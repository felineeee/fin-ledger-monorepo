import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { KYSELY_DB } from '@fin-ledger/databases';
import { PaymentsService } from '../common/payments/payments.service';
import { PaymentMethodsService } from '../common/payment-methods/payment-methods.service';
import { v4 as uuidv4 } from 'uuid';

describe('Gateway Checkout Real E2E Flow (Unmocked)', () => {
  let app: INestApplication;
  let db: any;
  let paymentMethodsService: PaymentMethodsService;
  let paymentsService: PaymentsService;

  let testPaymentMethodId!: string;
  let testPaymentId!: string;
  let xenditPaymentRequestId!: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    db = app.get(KYSELY_DB);
    paymentMethodsService = app.get<PaymentMethodsService>(
      PaymentMethodsService,
    );
    paymentsService = app.get<PaymentsService>(PaymentsService);

    testPaymentId = uuidv4();
    // 1. Seed the Master Xendit Gateway Config
    await paymentMethodsService.create({
      name: 'XENDIT',
      type: 'WALLET' as any,
      channel_code: 'GENERIC' as any,
      provider: 'XENDIT',
      is_active: true,
      config: {
        api_key: 'xnd_test_123',
        secret_key: 'xnd_test_123',
      },
    });

    // 2. Seed your OVO Wallet method (what you already have)
    const paymentMethod = await paymentMethodsService.create({
      name: 'E-Wallet OVO',
      type: 'WALLET' as any,
      channel_code: 'OVO' as any,
      provider: 'XENDIT',
      is_active: true,
      config: {},
    });
    testPaymentMethodId = paymentMethod.id;

    await db
      .insertInto('payments')
      .values({
        id: testPaymentId,
        order_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50000,
        currency: 'IDR',
        channel: 'ONLINE',
        status: 'PENDING',
        payment_method_id: testPaymentMethodId,
      })
      .execute();

    await app.init();
  });

  afterAll(async () => {
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

  it('should create a real payment request with Xendit and process settlement webhook', async () => {
    // Hits POST /api/payments/:id/create-checkout-session directly
    const createRes = await request(app.getHttpServer())
      .post(`/api/payments/${testPaymentId}/create-checkout-session`)
      .send({
        channel_code: 'OVO',
        phone_number: '+6281234567890',
        success_redirect_url: `http://localhost:8080/payments/checkout/success?payment_id=${testPaymentId}`,
        failure_redirect_url: `http://localhost:8080/payments/checkout/failed?payment_id=${testPaymentId}`,
      });

    console.log(createRes.body);
    expect(createRes.status).toBe(201);
    expect(createRes.body.payment_id).toBe(testPaymentId);
    expect(createRes.body.channel_code).toBe('OVO');

    xenditPaymentRequestId = createRes.body.gateway_data.id;
    expect(xenditPaymentRequestId).toBeDefined();

    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || 'test-secret';

    const mockWebhookPayload = {
      event: 'payment_request.succeeded',
      businessId: process.env.XENDIT_BUSINESS_ID || 'test-business-id',
      created: new Date().toISOString(),
      data: {
        id: xenditPaymentRequestId,
        referenceId: testPaymentId,
        status: 'SUCCEEDED',
        amount: 50000,
        currency: 'IDR',
        paymentMethod: {
          type: 'EWALLET',
          ewallet: { channelCode: 'OVO' },
        },
      },
    };

    const webhookRes = await request(app.getHttpServer())
      .post('/api/webhooks/gateway')
      .set('x-callback-token', webhookToken)
      .send(mockWebhookPayload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);

    const updatedPayment = await paymentsService.findOne(testPaymentId);
    expect(updatedPayment.status).toBe('CAPTURED');
  }, 30000);
});
