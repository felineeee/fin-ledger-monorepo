import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';
import { CloseShiftDto } from './dto/shifts.dto.js';

describe('ShiftsService', () => {
  let service: ShiftsService;

  // 1. Create the base Kysely mock object
  const mockDbQueryBuilder = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
    // Transaction mock (returns the exact same query builder for simplicity in tests)
    transaction: jest.fn().mockReturnValue({
      execute: jest.fn().mockImplementation(async (callback) => {
        return await callback(mockDbQueryBuilder); // Passes the query builder as 'trx'
      }),
    }),
  };

  const mockDb = mockDbQueryBuilder;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openShift', () => {
    it('should successfully open a new shift', async () => {
      const dto = {
        cashier_id: 'user-1',
        location_id: 'loc-1',
        starting_float: 50000,
      };
      const expectedShift = { id: 'shift-1', status: 'OPEN', ...dto };

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedShift);

      const result = await service.openShift(dto as any);

      expect(result).toEqual(expectedShift);
      expect(mockDb.insertInto).toHaveBeenCalledWith('shifts');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          cashier_id: 'user-1',
          location_id: 'loc-1',
          status: 'OPEN',
          starting_float: 50000,
        }),
      );
    });
  });

  describe('getShifts', () => {
    it('should return a list of shifts', async () => {
      const expectedResult = [{ id: 'shift-1', status: 'OPEN' }];
      mockDb.execute.mockResolvedValueOnce(expectedResult);

      const result = await service.findAll({});

      expect(result).toEqual(expectedResult);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('shifts');
    });
  });

  describe('getShiftById', () => {
    it('should return the shift if found', async () => {
      const expectedResult = { id: 'shift-1', starting_float: '50000' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(expectedResult);

      const result = await service.findOne('shift-1');

      expect(result).toEqual(expectedResult);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'shift-1');
    });

    it('should throw NotFoundException if shift not found', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.findOne('shift-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordCashDrop', () => {
    it('should record a cash drop and update the shift totals', async () => {
      const dto = {
        shift_id: 'shift-1',
        amount: 100000,
        recorded_by: 'user-1',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'shift-1',
        status: 'OPEN',
      });

      const expectedDrop = { id: 'drop-1', ...dto };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedDrop);

      const result = await service.recordCashDrop(dto as any);

      expect(result).toEqual(expectedDrop);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('shifts');
      expect(mockDb.insertInto).toHaveBeenCalledWith('cash_drops');
    });

    it('should throw ConflictException if shift is not OPEN', async () => {
      // Mock shift as CLOSED
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'shift-1',
        status: 'CLOSED',
      });

      await expect(
        service.recordCashDrop({ shift_id: 'shift-1', amount: 100000 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('closeShift', () => {
    it('should calculate variance and close the shift', async () => {
      const dto = { shift_id: 'shift-1', actual_cash: 145000 };

      // 1. Mock finding the OPEN shift
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: 'shift-1',
        status: 'OPEN',
        starting_float: '100000',
      });

      // 2. Mock aggregate query calculating expected cash
      // Expected = starting_float + total_cash_sales - total_cash_drops

      mockDb.executeTakeFirst.mockResolvedValueOnce({
        total_drops: '0',
      });

      mockDb.executeTakeFirst.mockResolvedValueOnce({
        total_cash_sales: '50000',
      });

      // 3. Mock the final update returning the closed shift
      const expectedClosedShift = {
        id: 'shift-1',
        status: 'CLOSED',
        ending_cash_expected: '150000',
        ending_cash_actual: '145000',
        variance: -5000, // Short by 5,000
      };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedClosedShift);

      const result = await service.closeShift(dto as any);

      expect(result).toEqual(expectedClosedShift);
      expect(mockDb.updateTable).toHaveBeenCalledWith('shifts');

      // Check that the updated values correctly used the fixed database column names
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'CLOSED',
          ending_cash_expected: '150000',
          ending_cash_actual: '145000',
          variance: -5000,
        }),
      );
    });
  });

  // @TODO missconfiguration here
  describe('forceClose', () => {
    it('should force close an abandoned shift without requiring cash input', async () => {
      // 1. Mock finding the OPEN shift
      mockDb.executeTakeFirst.mockResolvedValueOnce({
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'OPEN',
        starting_float: '100000.00',
      });

      // 2. Return object matching force close state (actual cash & variance remain null)
      const expectedForceClosedShift = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        location_id: 'loc-123',
        status: 'FORCE_CLOSED' as const,
        cashier_id: 'cashier-123',
        opened_at: new Date('2026-08-01T08:00:00Z'),
        closed_at: new Date('2026-08-01T17:00:00Z'),
        starting_float: '100000.00',
        ending_cash_actual: null,
        ending_cash_expected: null,
        variance: null,
      };

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(
        expectedForceClosedShift,
      );

      // 3. Call forceClose with just the shift ID
      const shiftId = '123e4567-e89b-12d3-a456-426614174000';
      const result = await service.forceClose(shiftId);

      // 4. Assertions
      expect(result).toEqual(expectedForceClosedShift);
      expect(mockDb.updateTable).toHaveBeenCalledWith('shifts');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FORCE_CLOSED',
        }),
      );
    });
  });
  describe('auditShift', () => {
    it('should reconcile a force-closed shift, calculate variance, and post to ledger', async () => {
      const shiftId = '123e4567-e89b-12d3-a456-426614174000';
      const actualCashCounted = 2480000;
      const auditorId = 'manager-999';

      const mockTrx: any = {
        executeTakeFirst: jest.fn(),
        executeTakeFirstOrThrow: jest.fn(),
        execute: jest.fn(),
      };

      // Explicitly tell every method to return mockTrx
      mockTrx.selectFrom = jest.fn().mockReturnValue(mockTrx);
      mockTrx.selectAll = jest.fn().mockReturnValue(mockTrx);
      mockTrx.select = jest.fn().mockReturnValue(mockTrx);
      mockTrx.innerJoin = jest.fn().mockReturnValue(mockTrx);
      mockTrx.where = jest.fn().mockReturnValue(mockTrx);
      mockTrx.updateTable = jest.fn().mockReturnValue(mockTrx);
      mockTrx.set = jest.fn().mockReturnValue(mockTrx);
      mockTrx.returningAll = jest.fn().mockReturnValue(mockTrx);
      mockTrx.insertInto = jest.fn().mockReturnValue(mockTrx);
      mockTrx.values = jest.fn().mockReturnValue(mockTrx);

      mockDb.transaction.mockReturnValueOnce({
        execute: jest.fn().mockImplementation((cb: any) => cb(mockTrx)),
      } as any);

      mockTrx.executeTakeFirst
        .mockResolvedValueOnce({
          id: shiftId,
          cashier_id: 'cashier-123',
          status: 'FORCE_CLOSED',
          starting_float: '100000.00',
        })
        .mockResolvedValueOnce({ total_drops: '0.00' })
        .mockResolvedValueOnce({ total_cash_sales: '2400000.00' });

      const expectedAuditedShift = {
        id: shiftId,
        status: 'CLOSED' as const,
        ending_cash_expected: '2500000.00',
        ending_cash_actual: '2480000.00',
        variance: '-20000.00',
      };

      mockTrx.executeTakeFirstOrThrow.mockResolvedValueOnce(
        expectedAuditedShift,
      );

      const result = await service.auditShift(
        shiftId,
        actualCashCounted,
        auditorId,
      );

      expect(result).toEqual(expectedAuditedShift);
      expect(mockTrx.updateTable).toHaveBeenCalledWith('shifts');
      expect(mockTrx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'CLOSED',
          ending_cash_expected: '2500000',
          ending_cash_actual: '2480000',
          variance: -20000,
        }),
      );
    });
  });
});
