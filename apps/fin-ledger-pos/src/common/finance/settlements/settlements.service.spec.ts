import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SettlementsService } from './settlements.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('SettlementsService', () => {
  let service: SettlementsService;

  // 1. Fake Expression Builder for eb.fn.count('id').as('total')
  const fakeEb = {
    fn: {
      count: jest.fn().mockReturnValue({
        as: jest.fn().mockReturnThis(),
      }),
    },
  };

  // 2. Fluent Kysely Mock
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
    // Intercept the select((eb) => ...) callback
    select: jest.fn().mockImplementation((arg) => {
      if (typeof arg === 'function') {
        arg(fakeEb);
      }
      return mockDbQueryBuilder;
    }),
  };

  const mockDb = mockDbQueryBuilder;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettlementsService, { provide: KYSELY_DB, useValue: mockDb }],
    }).compile();

    service = module.get<SettlementsService>(SettlementsService);
  });

  describe('getSettlements', () => {
    it('should return paginated settlements with metadata (default pagination)', async () => {
      const mockCount = { total: '25' };
      const mockData = Array(20).fill({ id: 'stl-1', provider: 'XENDIT' });

      // First execution is the count query (executeTakeFirst)
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockCount);
      // Second execution is the data query (execute)
      mockDb.execute.mockResolvedValueOnce(mockData);

      const result = await service.getSettlements({});

      expect(result.data).toHaveLength(20);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 20,
        total_pages: 2, // 25 / 20 = 1.25 -> ceil = 2
      });

      expect(mockDb.selectFrom).toHaveBeenCalledWith('settlements');
      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
      expect(mockDb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });

    it('should apply all filters to the query builder', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ total: '0' });
      mockDb.execute.mockResolvedValueOnce([]);

      await service.getSettlements({
        provider: 'STRIPE',
        status: 'PENDING' as any, // bypassing DTO enum check for test
        start_date: '2026-08-01',
        end_date: '2026-08-31',
        page: 2,
        limit: 10,
      });

      // Verify pagination logic
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(10); // (page 2 - 1) * 10

      // Verify filters
      expect(mockDb.where).toHaveBeenCalledWith('provider', '=', 'STRIPE');
      expect(mockDb.where).toHaveBeenCalledWith('status', '=', 'PENDING');
      // Just verifying where was called 4 times total for the 4 filters applied
      expect(mockDb.where).toHaveBeenCalledTimes(4);
    });
  });

  describe('getSettlementById', () => {
    it('should return settlement details if found', async () => {
      const expected = { id: 'stl-1', status: 'PENDING' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(expected);

      const result = await service.getSettlementById('stl-1');

      expect(result).toEqual(expected);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'stl-1');
    });

    it('should throw NotFoundException if settlement does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.getSettlementById('stl-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markSettlementPaid', () => {
    it('should successfully update a pending settlement using the provided date', async () => {
      const existing = { id: 'stl-1', status: 'PENDING' };
      const updated = {
        ...existing,
        status: 'PAID',
        settled_at: new Date('2026-08-02'),
      };

      // 1. DB call inside getSettlementById
      mockDb.executeTakeFirst.mockResolvedValueOnce(existing);
      // 2. DB call for the update
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updated);

      const dto = { actual_deposit_date: '2026-08-02' };
      const result = await service.markSettlementPaid('stl-1', dto);

      expect(result.message).toContain('successfully marked as paid');
      expect(result.settlement).toEqual(updated);

      expect(mockDb.updateTable).toHaveBeenCalledWith('settlements');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PAID',
          settled_at: expect.any(Date),
        }),
      );
    });

    it('should successfully update a pending settlement using sql NOW if no date provided', async () => {
      const existing = { id: 'stl-2', status: 'PENDING' };

      mockDb.executeTakeFirst.mockResolvedValueOnce(existing);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({
        id: 'stl-2',
        status: 'PAID',
      });

      await service.markSettlementPaid('stl-2', {});

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PAID',
          // Checks that the fallback to sql`NOW()` is handled (which is mocked as an object by Kysely sql strings)
          settled_at: expect.anything(),
        }),
      );
    });

    it('should throw BadRequestException if settlement is already PAID', async () => {
      const existing = { id: 'stl-3', status: 'PAID' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(existing);

      await expect(service.markSettlementPaid('stl-3', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(mockDb.updateTable).not.toHaveBeenCalled();
    });
  });
});
