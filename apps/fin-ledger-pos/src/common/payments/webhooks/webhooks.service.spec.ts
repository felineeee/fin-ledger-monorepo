import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { FeesService } from '../../finance/fees/fees.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let feesService: FeesService;

  // Fluent chainable Kysely mock
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    forUpdate: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
  };

  mockDbQueryBuilder.transaction = jest.fn().mockReturnValue({
    execute: jest.fn().mockImplementation(async (callback) => {
      return await callback(mockDbQueryBuilder);
    }),
  });

  const mockDb = mockDbQueryBuilder;

  const mockFeesService = {
    calculateAndSnapshotFees: jest.fn(),
  };

  const mockGatewayConfig = {
    config: JSON.stringify({ webhook_secret: 'valid-secret-token' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: KYSELY_DB, useValue: mockDb },
        { provide: FeesService, useValue: mockFeesService },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    feesService = module.get<FeesService>(FeesService);
  });

  describe('handleGatewayWebhook', () => {
    const validToken = 'valid-secret-token';
    const mockPayload = {
      id: 'webhook-evt-123',
      external_id: 'pay-1', // Matches legacy virtual accounts
      status: 'PAID',
    };

    it('should successfully process a new PAID webhook and capture the payment', async () => {
      // 1. Config fetch (Auth)
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockGatewayConfig);
      // 2. Idempotency Check (No existing event)
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
      // 3. Payment Lock & Fetch
      const existingPayment = {
        id: 'pay-1',
        status: 'PENDING',
        amount: '50000',
        currency: 'IDR',
      };
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      const result = await service.handleGatewayWebhook(
        validToken,
        'virtual_account.paid',
        mockPayload,
      );

      expect(result.success).toBe(true);

      // Verify transaction was used
      expect(mockDb.transaction().execute).toHaveBeenCalled();

      // Verify Audit Log Insertion
      expect(mockDb.insertInto).toHaveBeenCalledWith('webhook_events');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: 'webhook-evt-123',
          event_type: 'virtual_account.paid',
        }),
      );

      // Verify Payment was captured
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CAPTURED' }),
      );

      // Verify Ledger realization
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-1',
          entry_type: 'CAPTURED',
          amount: '50000',
        }),
      );
    });

    it('should process a QRIS payload by extracting external_id from data object', async () => {
      const qrisPayload = {
        event_id: 'evt_qr_999',
        data: { qr_code: { external_id: 'pay-2' }, status: 'SUCCEEDED' },
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(mockGatewayConfig); // Auth
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined); // Idempotency
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'pay-2',
        status: 'PENDING',
        amount: '20000',
      }); // Payment

      await service.handleGatewayWebhook(validToken, 'qr.payment', qrisPayload);

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ payment_id: 'pay-2' }),
      );
    });

    it('should fail payment if event is FAILED or EXPIRED', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockGatewayConfig); // Auth
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined); // Idempotency
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'pay-3',
        status: 'PENDING',
      }); // Payment

      await service.handleGatewayWebhook(validToken, 'payment_request.failed', {
        reference_id: 'pay-3', // <--- ADDED THIS so paymentId isn't null!
        status: 'FAILED',
      });

      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED' }),
      );
    });

    it('should throw UnauthorizedException if token does not match', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockGatewayConfig);

      await expect(
        service.handleGatewayWebhook(
          'hacker-token',
          'virtual_account.paid',
          mockPayload,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return early with success if idempotency check finds existing event', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockGatewayConfig); // Auth
      // Idempotency finds an existing event!
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'log-1',
        event_id: 'webhook-evt-123',
      });

      const result = await service.handleGatewayWebhook(
        validToken,
        'virtual_account.paid',
        mockPayload,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Already processed');
      expect(mockDb.insertInto).not.toHaveBeenCalled(); // Stops processing
    });
  });

  describe('processGatewayWebhook (with FeesService)', () => {
    it('should trigger FeesService when payment is successfully captured', async () => {
      const mockPayload = {
        data: { reference_id: 'pay-999', status: 'SUCCEEDED' },
      };

      // Mock the payment fetch inside the transaction
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'pay-999',
        status: 'PENDING',
        amount: '100000',
      });

      await service.processGatewayWebhook(
        'evt-999',
        'ewallet.payment',
        mockPayload,
      );

      // Verify the transaction locked the row
      expect(mockDb.forUpdate).toHaveBeenCalled();

      // Verify FeesService was triggered with the payment ID and transaction
      expect(mockFeesService.calculateAndSnapshotFees).toHaveBeenCalledWith(
        'pay-999',
        mockDbQueryBuilder,
      );

      // Verify Ledger Write
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-999',
          entry_type: 'CAPTURED',
        }),
      );
    });
  });

  describe('getWebhookEvents', () => {
    it('should return a list of recent webhook events', async () => {
      const expectedEvents = [{ id: 'evt-1' }, { id: 'evt-2' }];
      mockDb.execute.mockResolvedValueOnce(expectedEvents);

      const result = await service.getWebhookEvents();

      expect(result).toEqual(expectedEvents);
      expect(mockDb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(mockDb.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getWebhookEventDetails', () => {
    it('should return event details if found', async () => {
      const event = { id: 'evt-1', payload: '{}' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(event);

      const result = await service.getWebhookEventDetails('evt-1');

      expect(result).toEqual(event);
    });

    it('should throw NotFoundException if event is not found', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.getWebhookEventDetails('evt-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
