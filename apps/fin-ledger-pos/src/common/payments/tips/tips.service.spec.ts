import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TipsService } from './tips.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('TipsService', () => {
  let service: TipsService;

  // Fluent chainable mock for Kysely
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };

  // Mock Kysely transaction to execute the callback with our mock builder
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
        TipsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<TipsService>(TipsService);
  });

  describe('adjustTip', () => {
    it('should successfully add a new tip and write to the ledger', async () => {
      const existingPayment = {
        id: 'pay-1',
        status: 'CAPTURED',
        tip_amount: '0',
        currency: 'IDR',
      };
      const updatedPayment = { ...existingPayment, tip_amount: '15000' };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedPayment);

      const result = await service.adjustTip('pay-1', { amount: 15000 });

      expect(result.tip_amount).toEqual('15000');

      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          tip_amount: 15000,
          updated_at: expect.anything(), // sql`NOW()` mock
        }),
      );

      // Ledger entry checks
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-1',
          entry_type: 'TIP_ADDED',
          amount: 15000, // Delta is +15000
          currency: 'IDR',
          metadata: JSON.stringify({ previous_tip: 0, new_tip: 15000 }),
        }),
      );
    });

    it('should successfully reduce an existing tip (negative delta) and write to ledger', async () => {
      const existingPayment = {
        id: 'pay-2',
        status: 'CAPTURED',
        tip_amount: '20000',
        currency: 'IDR',
      };
      const updatedPayment = { ...existingPayment, tip_amount: '10000' };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedPayment);

      await service.adjustTip('pay-2', { amount: 10000 });

      // The delta should be -10000
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          entry_type: 'TIP_ADDED',
          amount: -10000,
          metadata: JSON.stringify({ previous_tip: 20000, new_tip: 10000 }),
        }),
      );
    });

    it('should return early without database writes if tip delta is 0', async () => {
      const existingPayment = {
        id: 'pay-3',
        status: 'AUTHORIZED',
        tip_amount: '15000',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      const result = await service.adjustTip('pay-3', { amount: 15000 });

      expect(result).toEqual(existingPayment); // Returns original unmodified
      expect(mockDb.updateTable).not.toHaveBeenCalled();
      expect(mockDb.insertInto).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.adjustTip('pay-999', { amount: 10000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if trying to tip a FAILED payment', async () => {
      const existingPayment = { id: 'pay-4', status: 'FAILED' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      await expect(
        service.adjustTip('pay-4', { amount: 10000 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getTipTotals', () => {
    it('should aggregate tip totals correctly across cashiers without date filters', async () => {
      const mockDatabaseReturn = [
        { cashier_id: 'user-1', total_tips: '50000', tipped_transactions: '2' },
        { cashier_id: 'user-2', total_tips: '25000', tipped_transactions: '1' },
      ];

      mockDb.execute.mockResolvedValueOnce(mockDatabaseReturn);

      const result = await service.getTipTotals('loc-1', {});

      // 1. Verify JS aggregation math (50000 + 25000 = 75000)
      expect(result.grand_total_tips).toBe(75000);
      expect(result.location_id).toBe('loc-1');

      // 2. Verify mapping structure
      expect(result.cashier_breakdown).toHaveLength(2);
      expect(result.cashier_breakdown[0]).toEqual({
        cashier_id: 'user-1',
        total_tips: 50000,
        tipped_transactions: 2,
      });

      // 3. Verify query builders
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        'shifts',
        'payments.shift_id',
        'shifts.id',
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'shifts.location_id',
        '=',
        'loc-1',
      );
      expect(mockDb.groupBy).toHaveBeenCalledWith('shifts.cashier_id');
    });

    it('should append date filters if provided in query', async () => {
      mockDb.execute.mockResolvedValueOnce([]);

      await service.getTipTotals('loc-1', {
        start_date: '2026-08-01',
        end_date: '2026-08-31',
      });

      // Verify date ranges were applied to the Kysely query
      expect(mockDb.where).toHaveBeenCalledWith(
        'payments.created_at',
        '>=',
        expect.any(Date),
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'payments.created_at',
        '<=',
        expect.any(Date),
      );
    });
  });
});
