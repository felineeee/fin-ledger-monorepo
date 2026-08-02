import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { GatewayConfigService } from './gateway-config/gateway-config.service';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('GatewayService', () => {
  let service: GatewayService;
  let configService: GatewayConfigService;

  // 1. Kysely DB Mock
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };

  mockDbQueryBuilder.transaction = jest.fn().mockReturnValue({
    execute: jest.fn().mockImplementation(async (callback) => {
      return await callback(mockDbQueryBuilder);
    }),
  });

  const mockDb = mockDbQueryBuilder;

  // 2. GatewayConfigService Mock
  const mockGatewayConfigService = {
    getXenditDbConfig: jest.fn(),
    getClient: jest.fn(),
    getWebhookToken: jest.fn(),
  };

  // 3. Global Fetch Mock
  const originalFetch = global.fetch;

  const mockDbConfig = {
    id: 'method-1',
    config: {
      api_key: 'xnd_development_123',
      enabled_channels: ['CREDIT_CARD'],
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup fetch mock
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: KYSELY_DB, useValue: mockDb },
        { provide: GatewayConfigService, useValue: mockGatewayConfigService },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
    configService = module.get<GatewayConfigService>(GatewayConfigService);
  });

  afterAll(() => {
    // Restore fetch after tests finish
    global.fetch = originalFetch;
  });

  describe('createCheckoutSession', () => {
    it('should call Xendit API via fetch and return checkout details', async () => {
      const paymentId = 'pay-1';
      const existingPayment = {
        id: paymentId,
        channel: 'ONLINE',
        status: 'PENDING',
        amount: '50000',
        currency: 'IDR',
      };

      const xenditResponse = {
        invoice_url: 'https://checkout.xendit.co/web/123',
        expiry_date: '2026-12-31T23:59:59Z',
        status: 'PENDING',
      };

      // Mock DB & Config calls
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockGatewayConfigService.getXenditDbConfig.mockResolvedValueOnce(
        mockDbConfig,
      );

      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => xenditResponse,
      });

      const result = await service.createCheckoutSession(paymentId, {
        success_redirect_url: 'https://mysite.com/success',
        failure_redirect_url: 'https://mysite.com/fail',
      });

      expect(result).toEqual({
        payment_id: 'pay-1',
        checkout_url: 'https://checkout.xendit.co/web/123',
        expires_at: '2026-12-31T23:59:59Z',
        status: 'PENDING',
      });

      // Verify fetch was called with correct payload
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.xendit.co/v2/invoices',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":50000'),
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic '),
          }),
        }),
      );
    });

    it('should throw ConflictException if payment is not ONLINE', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'pay-1',
        channel: 'IN_PERSON',
      });

      await expect(
        service.createCheckoutSession('pay-1', {} as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if Xendit fetch fails', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'pay-1',
        channel: 'ONLINE',
        status: 'PENDING',
        amount: '1000',
      });
      mockGatewayConfigService.getXenditDbConfig.mockResolvedValueOnce(
        mockDbConfig,
      );

      // Mock a failed fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid API Key' }),
      });

      await expect(
        service.createCheckoutSession('pay-1', {} as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getCheckoutSession', () => {
    it('should fetch the invoice from Xendit', async () => {
      mockGatewayConfigService.getXenditDbConfig.mockResolvedValueOnce(
        mockDbConfig,
      );

      const mockInvoices = [{ id: 'inv_123', status: 'PAID' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockInvoices,
      });

      const result = await service.getCheckoutSession('pay-1');

      expect(result).toEqual(mockInvoices[0]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('external_id=pay-1'),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if no invoice is found', async () => {
      mockGatewayConfigService.getXenditDbConfig.mockResolvedValueOnce(
        mockDbConfig,
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => [],
      });

      await expect(service.getCheckoutSession('pay-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelCheckoutSession', () => {
    it('should completely cancel the session and write to ledger if isRetry is false', async () => {
      mockGatewayConfigService.getXenditDbConfig.mockResolvedValue(
        mockDbConfig,
      );

      // 1. Mock getCheckoutSession fetch call & expire call
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => [{ id: 'inv_123', status: 'PENDING' }],
        })
        .mockResolvedValueOnce({ ok: true });

      // 2. Mock DB Transaction for Voiding
      const existingPayment = { id: 'pay-1', amount: '50000', currency: 'IDR' };
      mockDb.executeTakeFirstOrThrow
        .mockResolvedValueOnce(existingPayment)
        .mockResolvedValueOnce({ ...existingPayment, status: 'VOIDED' });

      await service.cancelCheckoutSession('pay-1', false);

      // Check Xendit expire fetch was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.xendit.co/invoices/inv_123/expire!',
        expect.objectContaining({ method: 'POST' }),
      );

      // Check Database updates
      expect(mockDb.transaction().execute).toHaveBeenCalled();
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'VOIDED' }),
      );

      // Check Ledger entry
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
    });

    it('should only expire in Xendit and return early if isRetry is true', async () => {
      mockGatewayConfigService.getXenditDbConfig.mockResolvedValue(
        mockDbConfig,
      );

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => [{ id: 'inv_123', status: 'PENDING' }],
        })
        .mockResolvedValueOnce({ ok: true });

      const result = await service.cancelCheckoutSession('pay-1', true);

      expect(result).toEqual({
        success: true,
        message: 'Old session expired.',
      });

      // DB Transaction should NOT be called
      expect(mockDb.transaction().execute).not.toHaveBeenCalled();
    });
  });
});
