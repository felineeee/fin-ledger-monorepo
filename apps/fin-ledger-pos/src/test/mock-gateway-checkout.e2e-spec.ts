import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { KYSELY_DB } from '@fin-ledger/databases';
import { PaymentsService } from '../common/payments/payments.service';
import { PaymentMethodsService } from '../common/payment-methods/payment-methods.service';
import { GatewayConfigService } from '../common/gateway/gateway-config/gateway-config.service';

describe('Gateway Checkout E2E Flow', () => {
  let app: INestApplication;
  let db: any;
  let paymentMethodsService: PaymentMethodsService;
  let paymentsService: PaymentsService;

  let testPaymentMethodId: string;
  let testPaymentId: string;
  let xenditPaymentRequestId: string;

  // Stubs for Xendit Clients
  let mockPaymentRequestClient: any;
  let mockGatewayConfigService: any;

  beforeAll(async () => {
    // 1. Prepare Mock Clients before NestJS module compilation
    mockPaymentRequestClient = {
      createPaymentRequest: jest.fn(),
    };

    mockGatewayConfigService = {
      getPaymentRequestClient: jest
        .fn()
        .mockReturnValue(mockPaymentRequestClient),
      getWebhookToken: jest.fn().mockReturnValue('test-secret'),
      getXenditDbConfig: jest.fn().mockResolvedValue({
        config: {
          api_key: process.env.XENDIT_SECRET_KEY || 'xnd_development_...',
          webhook_secret: process.env.XENDIT_WEBHOOK_TOKEN || 'test-secret',
        },
      }),
      getClient: jest.fn(),
    };

    // 2. Boot NestJS with the overridden GatewayConfigService provider
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GatewayConfigService)
      .useValue(mockGatewayConfigService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);

    // Initialize Services
    db = app.get(KYSELY_DB);
    paymentMethodsService = app.get<PaymentMethodsService>(
      PaymentMethodsService,
    );
    paymentsService = app.get<PaymentsService>(PaymentsService);

    // 3. Seed: Create Payment Method via Service
    const paymentMethod = await paymentMethodsService.create({
      name: 'E-Wallet OVO',
      type: 'WALLET' as any,
      channel_code: 'OVO' as any,
      provider: 'XENDIT',
      is_active: true,
      config: {},
    });
    testPaymentMethodId = paymentMethod.id;

    // 4. Seed: Create Payment via Service
    const payment = await paymentsService.createPayment({
      order_id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 50000,
      currency: 'IDR',
      channel: 'ONLINE' as any,
      payment_method_id: testPaymentMethodId,
    });
    testPaymentId = payment.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testPaymentId) {
      await db
        .deleteFrom('webhook_events')
        .where('payment_id', '=', testPaymentId)
        .execute();
      await db
        .deleteFrom('payment_ledger')
        .where('payment_id', '=', testPaymentId)
        .execute();
      await db.deleteFrom('payments').where('id', '=', testPaymentId).execute();
    }

    if (testPaymentMethodId) {
      await db
        .deleteFrom('payment_methods')
        .where('id', '=', testPaymentMethodId)
        .execute();
    }

    await app.close();
  });

  it('should successfully execute checkout creation and process webhook settlement', async () => {
    // ---------------------------------------------------------
    // MOCK: Setup Payment Request SDK response
    // ---------------------------------------------------------
    mockPaymentRequestClient.createPaymentRequest.mockResolvedValueOnce({
      id: 'pr-mock-12345',
      referenceId: testPaymentId,
      status: 'PENDING',
      paymentMethod: { type: 'EWALLET' },
    });

    // ==========================================
    // STEP 1: CREATE CHECKOUT SESSION
    // ==========================================
    const createRes = await request(app.getHttpServer())
      .post(`/api/payments/${testPaymentId}/create-checkout-session`)
      .send({
        channel_code: 'OVO',
        phone_number: '+6281234567890',
        success_redirect_url: `http://localhost:8080/payments/checkout/success?payment_id=${testPaymentId}`,
        failure_redirect_url: `http://localhost:8080/payments/checkout/failed?payment_id=${testPaymentId}`,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.payment_id).toBe(testPaymentId);
    expect(createRes.body.channel_code).toBe('OVO');

    // Verify SDK was called with the mapped parameters
    expect(mockPaymentRequestClient.createPaymentRequest).toHaveBeenCalledWith({
      data: expect.objectContaining({
        referenceId: testPaymentId,
        paymentMethod: expect.objectContaining({
          type: 'EWALLET',
          ewallet: expect.objectContaining({
            channelCode: 'OVO',
          }),
        }),
      }),
    });

    xenditPaymentRequestId = createRes.body.gateway_data.id;

    // ==========================================
    // STEP 2: RECEIVE & PROCESS XENDIT WEBHOOK
    // ==========================================
    const mockWebhookPayload = {
      event: 'payment_request.succeeded',
      businessId: 'test-business-id',
      created: new Date().toISOString(),
      data: {
        id: xenditPaymentRequestId,
        referenceId: testPaymentId, // Matches internal DB Payment UUID
        status: 'SUCCEEDED',
        amount: 50000,
        currency: 'IDR',
        paymentMethod: {
          type: 'EWALLET',
          ewallet: {
            channelCode: 'OVO',
          },
        },
      },
    };

    const webhookRes = await request(app.getHttpServer())
      .post('/api/webhooks/gateway')
      .set('x-callback-token', 'test-secret')
      .send(mockWebhookPayload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);

    // ==========================================
    // STEP 3: VERIFY STATE & LEDGER SETTLEMENT
    // ==========================================
    // 1. Payment status must transition to CAPTURED
    const updatedPayment = await paymentsService.findOne(testPaymentId);
    expect(updatedPayment.status).toBe('CAPTURED');

    // 2. Realization entry must exist in immutable ledger
    const ledgerEntry = await db
      .selectFrom('payment_ledger')
      .selectAll()
      .where('payment_id', '=', testPaymentId)
      .where('entry_type', '=', 'CAPTURED')
      .executeTakeFirst();

    expect(ledgerEntry).toBeDefined();
    expect(Number(ledgerEntry.amount)).toBe(50000);

    // 3. Raw Webhook Event must be logged for auditability
    const loggedWebhook = await db
      .selectFrom('webhook_events')
      .selectAll()
      .where('payment_id', '=', testPaymentId)
      .executeTakeFirst();

    expect(loggedWebhook).toBeDefined();
    expect(loggedWebhook.event_type).toBe('payment_request.succeeded');
  });
});
