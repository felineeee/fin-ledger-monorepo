import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  // 1. Fake Expression Builder to handle Kysely callbacks like `where((eb) => eb.or(...))`
  const fakeEb = Object.assign(jest.fn().mockReturnThis(), {
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
  });

  // 2. Fluent Kysely Mock Builder
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
    // Intercept callback-based `where` clauses so they don't crash
    where: jest.fn().mockImplementation((arg1) => {
      if (typeof arg1 === 'function') {
        arg1(fakeEb);
      }
      return mockDbQueryBuilder;
    }),
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
        ReconciliationService,
        { provide: KYSELY_DB, useValue: mockDb },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
  });

  describe('getLedgerRecords', () => {
    it('should query the payment_ledger table with optional filters', async () => {
      const mockRecords = [{ id: 'ledg-1', amount: '50000' }];
      mockDb.execute.mockResolvedValueOnce(mockRecords);

      const result = await service.getLedgerRecords({
        payment_id: 'pay-1',
        entry_type: 'CAPTURED',
      });

      expect(result).toEqual(mockRecords);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.where).toHaveBeenCalledWith('payment_id', '=', 'pay-1');
      expect(mockDb.where).toHaveBeenCalledWith('entry_type', '=', 'CAPTURED');
      expect(mockDb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });
  });

  describe('getLedgerRecordById', () => {
    it('should return a ledger record by ID', async () => {
      const mockRecord = { id: 'ledg-1' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockRecord);

      const result = await service.getLedgerRecordById('ledg-1');
      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException if ledger record is missing', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
      await expect(service.getLedgerRecordById('ledg-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDailyReconciliation', () => {
    it('should correctly aggregate shift and payment data for a location', async () => {
      // 1. Mock lock check (returns undefined meaning not locked)
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      // 2. Mock Shift Aggregations (fn.sum and fn.count results)
      const mockShiftsAgg = {
        total_starting_float: '100000',
        total_expected_cash: '500000',
        total_actual_cash: '495000',
        total_cash_drops: '400000',
        net_variance: '-5000',
        total_shifts: '2',
      };
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockShiftsAgg);

      // 3. Mock Raw Shifts
      const mockShifts = [
        { id: 'shift-1', status: 'CLOSED' },
        { id: 'shift-2', status: 'OPEN' },
      ];
      mockDb.execute.mockResolvedValueOnce(mockShifts);

      // 4. Mock Payment Method Breakdown
      const mockPaymentBreakdown = [
        {
          method_type: 'CASH',
          method_name: 'Cash',
          total_amount: '400000',
          transaction_count: '10',
        },
        {
          method_type: 'QRIS',
          method_name: 'QRIS',
          total_amount: '150000',
          transaction_count: '5',
        },
      ];
      mockDb.execute.mockResolvedValueOnce(mockPaymentBreakdown);

      const result = await service.getDailyReconciliation('loc-1', {
        date: '2026-08-02',
      });

      // Assertions
      expect(result.location_id).toBe('loc-1');
      expect(result.is_closed).toBe(false);
      expect(result.summary.net_variance).toBe(-5000);
      expect(result.summary.open_shifts).toBe(1);
      expect(result.summary.closed_shifts).toBe(1);
      expect(result.payment_breakdown).toHaveLength(2);
      expect(result.payment_breakdown[0].total_amount).toBe(400000);

      // Verify DB chain
      expect(mockDb.selectFrom).toHaveBeenCalledWith('daily_reconciliations');
      expect(mockDb.selectFrom).toHaveBeenCalledWith('shifts');
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
    });

    it('should handle zero shifts smoothly without crashing on payment breakdown', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined); // Lock check
      mockDb.executeTakeFirst.mockResolvedValueOnce({}); // Shifts agg
      mockDb.execute.mockResolvedValueOnce([]); // Empty shifts array

      const result = await service.getDailyReconciliation('loc-1', {
        date: '2026-08-02',
      });

      expect(result.summary.total_shifts).toBe(0);
      expect(result.payment_breakdown).toEqual([]);
      // Should not attempt to run the `in` query if there are no shifts
      expect(mockDb.innerJoin).not.toHaveBeenCalled();
    });
  });

  describe('getDiscrepancies', () => {
    it('should fetch closed shifts where variance is non-zero or null', async () => {
      const mockDiscrepancies = [{ id: 'shift-1', variance: '-5000' }];
      mockDb.execute.mockResolvedValueOnce(mockDiscrepancies);

      const result = await service.getDiscrepancies({
        location_id: 'loc-1',
        date: '2026-08-02',
      });

      expect(result).toEqual(mockDiscrepancies);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('shifts');
      // Verifies our fake eb callback logic worked
      expect(mockDb.where).toHaveBeenCalledWith('status', 'in', [
        'CLOSED',
        'FORCE_CLOSED',
      ]);
      expect(mockDb.where).toHaveBeenCalledWith('location_id', '=', 'loc-1');
    });
  });

  describe('closeDailyReconciliation', () => {
    const targetDate = '2026-08-02';

    it('should throw ConflictException if day is already closed', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'rec-1' });

      await expect(
        service.closeDailyReconciliation('loc-1', { date: targetDate }),
      ).rejects.toThrow(ConflictException);
      expect(mockDb.transaction().execute).not.toHaveBeenCalled();
    });

    it('should force close open shifts, aggregate metrics, and lock the day', async () => {
      // 1. Initial lock check
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      // 2. Open Shifts Fetch (inside transaction)
      const openShifts = [{ id: 'shift-1' }];
      mockDb.execute.mockResolvedValueOnce(openShifts);

      // 3. Spy on the internal getDailyReconciliation method so we don't have to mock all 4 of its DB calls
      const getDailySpy = jest
        .spyOn(service, 'getDailyReconciliation')
        .mockResolvedValueOnce({
          summary: {
            total_shifts: 1,
            total_starting_float: 100000,
            total_actual_cash: 500000,
            total_cash_drops: 400000,
            net_variance: -2000,
          },
        } as any);

      // 4. Final Insert Mock
      const savedRecord = { id: 'daily-rec-1', total_variance: '-2000' };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(savedRecord);

      const result = await service.closeDailyReconciliation('loc-1', {
        date: targetDate,
      });

      // Assertions
      expect(getDailySpy).toHaveBeenCalledWith('loc-1', { date: targetDate });

      // Verify open shifts were force closed
      expect(mockDb.updateTable).toHaveBeenCalledWith('shifts');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FORCE_CLOSED' }),
      );
      expect(mockDb.where).toHaveBeenCalledWith('id', 'in', ['shift-1']);

      // Verify the final record was saved
      expect(mockDb.insertInto).toHaveBeenCalledWith('daily_reconciliations');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          location_id: 'loc-1',
          total_variance: -2000,
        }),
      );

      expect(result.force_closed_abandoned_shifts).toBe(1);
      expect(result.reconciliation).toEqual(savedRecord);
    });
  });
});
