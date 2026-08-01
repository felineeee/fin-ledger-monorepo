import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RefundsService } from './refunds.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('RefundsService', () => {
  let service: RefundsService;

  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<RefundsService>(RefundsService);
  });

  describe('issueRefund', () => {
    it('should issue a partial refund and write a negative entry to the ledger', async () => {
      const paymentId = 'pay-1';
      const dto = { amount: 30000, reason: 'Customer returned 1 item' };

      const existingPayment = {
        id: paymentId,
        status: 'CAPTURED',
        amount: '100000',
        currency: 'IDR', // Added currency here
      };
      const previouslyRefunded = { total_refunded: '20000' };

      const expectedRefund = {
        id: 'ref-1',
        payment_id: paymentId,
        status: 'COMPLETED',
        ...dto,
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedRefund);

      const result = await service.issueRefund(paymentId, dto as any);

      expect(result).toEqual(expectedRefund);

      // 1. Verify refund record creation
      expect(mockDb.insertInto).toHaveBeenCalledWith('refunds');
      expect(mockDb.values).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          payment_id: paymentId,
          amount: dto.amount,
          reason: dto.reason,
          status: 'COMPLETED',
        }),
      );

      // 2. Verify negative ledger entry matching actual service implementation
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.values).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          payment_id: paymentId,
          entry_type: 'REFUNDED',
          currency: 'IDR',
          amount: expect.anything(), // Accepts the sql`` tag expression
        }),
      );
    });

    it('should throw ConflictException if refund amount exceeds available balance', async () => {
      const paymentId = 'pay-2';
      const existingPayment = {
        id: paymentId,
        status: 'CAPTURED',
        amount: '100000',
      };
      const previouslyRefunded = { total_refunded: '80000' }; // Only 20k left

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirst.mockResolvedValueOnce(previouslyRefunded);

      // Try to refund 30k when only 20k is available
      await expect(
        service.issueRefund(paymentId, { amount: 30000 } as any),
      ).rejects.toThrow(ConflictException);

      expect(mockDb.insertInto).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if payment is not CAPTURED', async () => {
      const paymentId = 'pay-3';
      const existingPayment = {
        id: paymentId,
        status: 'PENDING',
        amount: '100000',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      await expect(
        service.issueRefund(paymentId, { amount: 10000 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getRefundsByPaymentId', () => {
    it('should list all refunds for a specific payment', async () => {
      const expectedResult = [{ id: 'ref-1', amount: '50000' }];

      // Array list queries execute with execute()
      mockDb.execute.mockResolvedValueOnce(expectedResult);

      const result = await service.getRefundsByPayment('pay-1');

      expect(result).toEqual(expectedResult);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('refunds');
      expect(mockDb.where).toHaveBeenCalledWith('payment_id', '=', 'pay-1');
    });
  });

  describe('getRefundById', () => {
    it('should return refund details', async () => {
      const expectedResult = { id: 'ref-1', amount: '50000' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(expectedResult);

      const result = await service.getRefundById('ref-1');

      expect(result).toEqual(expectedResult);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'ref-1');
    });

    it('should throw NotFoundException if refund does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.getRefundById('ref-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRefundStatus', () => {
    it('should update async refund status (e.g., from PENDING to SUCCESS)', async () => {
      const existingRefund = { id: 'ref-1', status: 'PENDING' };
      const updatedRefund = { ...existingRefund, status: 'SUCCESS' };

      // Validation fetch
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingRefund);
      // Update return
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedRefund);

      const result = await service.updateRefundStatus('ref-1', {
        status: 'SUCCESS',
      } as any);

      expect(result.status).toEqual('SUCCESS');
      expect(mockDb.updateTable).toHaveBeenCalledWith('refunds');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SUCCESS' }),
      );
    });
  });
});
