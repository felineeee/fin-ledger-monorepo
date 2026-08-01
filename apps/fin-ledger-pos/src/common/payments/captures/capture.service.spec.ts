import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { KYSELY_DB } from '@fin-ledger/databases';
import { CaptureService } from './capture.service.js';

describe('CaptureService - Capture & Lifecycle', () => {
  let service: CaptureService;

  // 1. Create the chainable Kysely Mock Object (including transactions)
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    deleteFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };

  // Mock Kysely's transaction logic to yield our query builder back
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
        CaptureService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<CaptureService>(CaptureService);
  });

  describe('captureCashPayment', () => {
    it('should successfully capture a PENDING cash payment and write to ledger', async () => {
      const existingPayment = {
        id: 'pay-1',
        status: 'PENDING',
        amount: '50000',
        channel: 'IN_PERSON',
        currency: 'IDR',
      };
      const capturedPayment = {
        ...existingPayment,
        status: 'CAPTURED',
        captured_at: new Date(),
      };

      // Mock validation fetch
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      // Mock the update return inside the transaction
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(capturedPayment);

      const result = await service.captureCash('pay-1');

      expect(result.status).toEqual('CAPTURED');

      // Verify transaction was utilized
      expect(mockDb.transaction().execute).toHaveBeenCalled();

      // Verify payment status was updated
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CAPTURED' }),
      );

      // Verify ledger entry was created
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-1',
          entry_type: 'CAPTURED',
          amount: '50000',
          currency: 'IDR',
        }),
      );
    });

    it('should throw ConflictException if cash payment is already CAPTURED', async () => {
      const existingPayment = { id: 'pay-1', status: 'CAPTURED' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      await expect(service.captureCash('pay-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.captureCash('pay-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('captureCardPresentPayment', () => {
    it('should capture a card payment and log hardware authorization metadata to the ledger', async () => {
      const existingPayment = {
        id: 'pay-2',
        status: 'PENDING',
        amount: '150000',
        currency: 'USD',
      };

      const dto = { auth_code: 'AUTH123', entry_method: 'EMV_CHIP' };

      const capturedPayment = {
        ...existingPayment,
        status: 'CAPTURED',
        updated_at: new Date(),
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(capturedPayment);

      const result = await service.captureCardPresent('pay-2', dto as any);

      expect(result.status).toEqual('CAPTURED');

      // 1. Verify payment status update in DB
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'CAPTURED',
        }),
      );

      // 2. Verify hardware metadata is correctly stringified and saved to payment_ledger
      expect(mockDb.values).toHaveBeenCalledWith({
        payment_id: 'pay-2',
        entry_type: 'CAPTURED',
        amount: '150000',
        currency: 'USD',
        metadata: JSON.stringify({
          auth_code: 'AUTH123',
          entry_method: 'EMV_CHIP',
        }),
      });
    });
  });

  describe('cancelPayment', () => {
    it('should void/delete a payment attempt prior to capture completion', async () => {
      const existingPayment = {
        id: 'pay-3',
        status: 'PENDING',
        amount: '150000',
        currency: 'USD',
      };

      const voidedPayment = {
        ...existingPayment,
        status: 'VOIDED',
        updated_at: new Date(),
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(voidedPayment);

      const result = await service.cancel('pay-3');

      expect(result.status).toEqual('VOIDED');

      // 1. Assert updateTable was called on 'payments' instead of deleteFrom
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');

      // 2. Assert status was updated to VOIDED
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'VOIDED',
        }),
      );

      // 3. Assert the negative reversal entry was sent to the ledger
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-3',
          entry_type: 'VOIDED',
          currency: 'USD',
        }),
      );
    });
  });

  describe('reversePayment', () => {
    describe('reversePayment', () => {
      it('should reverse a CAPTURED payment (same-day window void)', async () => {
        const existingPayment = {
          id: 'pay-4',
          status: 'CAPTURED',
          amount: '50000',
          currency: 'IDR',
        };

        const voidedPayment = { ...existingPayment, status: 'VOIDED' };
        const dto = { reason: 'Customer requested immediate refund' };

        mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
        mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(voidedPayment);

        const result = await service.reverse('pay-4', dto as any);

        expect(result.status).toEqual('VOIDED');

        // Verify update call
        expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
        expect(mockDb.set).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'VOIDED' }),
        );

        // Verify ledger insert call matching actual service keys & behavior
        expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
        expect(mockDb.values).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_id: 'pay-4',
            entry_type: 'VOIDED',
            currency: 'IDR',
            metadata: JSON.stringify({ reason: dto.reason }),
            amount: expect.anything(),
          }),
        );
      });
    });

    it('should throw ConflictException if trying to reverse a PENDING payment', async () => {
      const existingPayment = { id: 'pay-4', status: 'PENDING' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      await expect(
        service.reverse('pay-4', { reason: 'Mistake' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });
});
