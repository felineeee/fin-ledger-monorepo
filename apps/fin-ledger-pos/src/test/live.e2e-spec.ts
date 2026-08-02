import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import ngrok from 'ngrok';
import { AppModule } from '../app.module';
import { KYSELY_DB } from '@fin-ledger/databases';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Live Checkout & Webhook Flow (E2E)', () => {
  let app: INestApplication;
  let db: any;
  let publicUrl: string;

  let testPaymentMethodId: string;
  let testPaymentId: string;
  let paymentRequestExtId: string;

  beforeAll(async () => {
    // 1. OPEN THE NGROK TUNNEL
    publicUrl = await ngrok.connect(3000);
    console.log(`Ngrok Tunnel active at: ${publicUrl}`);

    // 2. CONFIGURE XENDIT WEBHOOK URL
    // We tell Xendit Sandbox to send webhooks to this exact Ngrok URL
    const apiKey = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString(
      'base64',
    );

    // Note: Xendit handles Payment Request webhooks via their v2 settings endpoint
    await fetch('https://api.xendit.co/v2/webhooks/urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        url: `${publicUrl}/api/webhooks/gateway`,
        event_types: ['qr.payment', 'payment_request.succeeded'],
      }),
    });
    console.log('Xendit Webhook URL dynamically updated.');

    // 3. BOOT THE NESTJS APP
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3000);

    db = app.get(KYSELY_DB);

    // 4. SEED THE DATABASE
    const paymentMethod = await db
      .insertInto('payment_methods')
      .values({
        name: 'QRIS',
        type: 'QRIS', // Must match the switch-case in CheckoutService
        provider: 'XENDIT',
        config: JSON.stringify({
          webhook_secret: process.env.XENDIT_WEBHOOK_TOKEN,
        }),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    testPaymentMethodId = paymentMethod.id;

    const payment = await db
      .insertInto('payments')
      .values({
        amount: '50000',
        currency: 'IDR',
        channel: 'ONLINE',
        status: 'PENDING',
        payment_method_id: paymentMethod.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    testPaymentId = payment.id;
    console.log(`Seeded PENDING Payment: ${testPaymentId}`);
  });

  afterAll(async () => {
    // PHASE 5: THE TEARDOWN
    console.log('Cleaning up test database and shutting down...');

    // Wipe test data in reverse order of foreign key dependencies
    await db
      .deleteFrom('webhook_events')
      .where('payment_id', '=', testPaymentId)
      .execute();
    await db
      .deleteFrom('payment_ledger')
      .where('payment_id', '=', testPaymentId)
      .execute();
    await db.deleteFrom('payments').where('id', '=', testPaymentId).execute();
    await db
      .deleteFrom('payment_methods')
      .where('id', '=', testPaymentMethodId)
      .execute();

    // Shut down Ngrok and Nest
    await ngrok.kill();
    await app.close();
  });

  // Phases 2, 3, and 4 will go here in a single `it()` block to ensure sequential flow...
  it('should complete the full QRIS checkout and webhook lifecycle', async () => {
    // Coming up next!
  });
});
