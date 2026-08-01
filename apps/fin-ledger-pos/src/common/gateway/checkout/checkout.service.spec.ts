import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutService } from './checkout.service.js';
import { GatewayService } from '../gateway.service.js';

describe('CheckoutService', () => {
  let service: CheckoutService;

  // 1. Fluent Kysely Mock
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn(),
  };

  // 2. Mock Xendit SDK inside the Gateway Service
  const mockXenditClient = {
    PaymentMethod: {
      createPaymentMethod: jest.fn(),
    },
    PaymentRequest: {
      createPaymentRequest: jest.fn(),
    },
  };

  const mockGatewayService = {
    getClient: jest.fn().mockReturnValue(mockXenditClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: 'DB_INSTANCE', useValue: mockDbQueryBuilder },
        { provide: GatewayService, useValue: mockGatewayService },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  describe('createSession', () => {
    const basePayment = { id: 'pay-1', amount: '50000', status: 'PENDING' };

    it('should create a VIRTUAL_ACCOUNT via PaymentMethod API', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce({
        ...basePayment,
        type: 'VIRTUAL_ACCOUNT',
      });

      const mockVaResponse = { id: 'pm_123', status: 'ACTIVE' };
      mockXenditClient.PaymentMethod.createPaymentMethod.mockResolvedValueOnce(
        mockVaResponse,
      );

      const result = await service.createSession('pay-1', {
        channel_code: 'BCA',
      } as any);

      expect(
        mockXenditClient.PaymentMethod.createPaymentMethod,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'VIRTUAL_ACCOUNT',
          virtualAccount: expect.objectContaining({ channelCode: 'BCA' }),
        }),
      });

      expect(result.method).toBe('VIRTUAL_ACCOUNT');
      expect(result.gateway_data).toEqual(mockVaResponse);
    });

    it('should create an EWALLET via PaymentRequest API', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce({
        ...basePayment,
        type: 'WALLET',
      });

      const mockWalletResponse = { id: 'pr_123', status: 'PENDING' };
      mockXenditClient.PaymentRequest.createPaymentRequest.mockResolvedValueOnce(
        mockWalletResponse,
      );

      const result = await service.createSession('pay-1', {
        channel_code: 'OVO',
        phone_number: '+628123456789',
      } as any);

      expect(
        mockXenditClient.PaymentRequest.createPaymentRequest,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 50000,
          paymentMethod: expect.objectContaining({
            type: 'EWALLET',
            ewallet: expect.objectContaining({
              channelCode: 'OVO',
              channelProperties: expect.objectContaining({
                mobileNumber: '+628123456789',
              }),
            }),
          }),
        }),
      });

      expect(result.gateway_data).toEqual(mockWalletResponse);
    });

    it('should create a QRIS via PaymentRequest API', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce({
        ...basePayment,
        type: 'QRIS',
      });

      const mockQrResponse = { id: 'pr_456', status: 'PENDING' };
      mockXenditClient.PaymentRequest.createPaymentRequest.mockResolvedValueOnce(
        mockQrResponse,
      );

      const result = await service.createSession('pay-1', {} as any);

      expect(
        mockXenditClient.PaymentRequest.createPaymentRequest,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentMethod: expect.objectContaining({
            type: 'QR_CODE',
            qrCode: { channelCode: 'QRIS' },
          }),
        }),
      });
      expect(result.gateway_data).toEqual(mockQrResponse);
    });

    it('should throw BadRequestException if payment is not PENDING', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce({
        ...basePayment,
        status: 'CAPTURED',
        type: 'VIRTUAL_ACCOUNT',
      });

      await expect(
        service.createSession('pay-1', { channel_code: 'BCA' } as any),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockXenditClient.PaymentMethod.createPaymentMethod,
      ).not.toHaveBeenCalled();
    });

    it('should wrap external Gateway errors into a BadRequestException', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce({
        ...basePayment,
        type: 'QRIS',
      });

      mockXenditClient.PaymentRequest.createPaymentRequest.mockRejectedValueOnce(
        new Error('Xendit Timeout'),
      );

      await expect(service.createSession('pay-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.createSession('pay-999', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSessionStatus', () => {
    it('should return internal database payment status', async () => {
      mockDbQueryBuilder.executeTakeFirst.mockResolvedValueOnce({
        id: 'pay-1',
        status: 'PENDING',
        amount: '50000',
      });

      const result = await service.getSessionStatus('pay-1');

      expect(result).toEqual({
        payment_id: 'pay-1',
        status: 'PENDING',
        amount: '50000',
      });
      expect(mockDbQueryBuilder.selectFrom).toHaveBeenCalledWith('payments');
    });
  });
});
