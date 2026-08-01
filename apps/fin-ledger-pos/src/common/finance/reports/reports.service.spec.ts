import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('ReportsService', () => {
  let service: ReportsService;

  // Fluent chainable mock for Kysely
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
  };

  const mockDb = mockDbQueryBuilder;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('getPaymentMethodsBreakdown', () => {
    it('should calculate revenue breakdown and correct percentages', async () => {
      const mockDatabaseReturn = [
        {
          method_type: 'WALLET',
          method_name: 'OVO',
          provider: 'XENDIT',
          total_revenue: '150000',
          transaction_count: '3',
        },
        {
          method_type: 'CASH',
          method_name: 'Cash',
          provider: 'INTERNAL',
          total_revenue: '50000',
          transaction_count: '1',
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockDatabaseReturn);

      const result = await service.getPaymentMethodsBreakdown('loc-1', {});

      // Verify total math (150,000 + 50,000)
      expect(result.total_revenue).toBe(200000);
      expect(result.breakdown).toHaveLength(2);

      // Verify percentage calculation
      expect(result.breakdown[0].percentage_of_total).toBe('75.00'); // 150k of 200k
      expect(result.breakdown[1].percentage_of_total).toBe('25.00'); // 50k of 200k

      // Verify Kysely routing
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        'payment_methods',
        'payments.payment_method_id',
        'payment_methods.id',
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'payments.location_id',
        '=',
        'loc-1',
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'payments.status',
        '=',
        'CAPTURED',
      );
      expect(mockDb.groupBy).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalledWith('total_revenue', 'desc');
    });

    it('should handle zero revenue gracefully without division by zero errors', async () => {
      mockDb.execute.mockResolvedValueOnce([]); // Empty DB result

      const result = await service.getPaymentMethodsBreakdown('loc-1', {});

      expect(result.total_revenue).toBe(0);
      expect(result.breakdown).toEqual([]);
    });

    it('should apply date filters when provided', async () => {
      mockDb.execute.mockResolvedValueOnce([]);

      await service.getPaymentMethodsBreakdown('loc-1', {
        start_date: '2026-08-01',
        end_date: '2026-08-31',
      });

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

  describe('getFailedPayments', () => {
    it('should return mapped failed payments and aggregate totals', async () => {
      const mockFailures = [
        {
          id: 'pay-1',
          amount: '50000',
          currency: 'IDR',
          created_at: new Date(),
          method_type: 'WALLET',
          provider: 'XENDIT',
        },
        {
          id: 'pay-2',
          amount: '25000',
          currency: 'IDR',
          created_at: new Date(),
          method_type: 'CARD',
          provider: 'STRIPE',
        },
      ];

      mockDb.execute.mockResolvedValueOnce(mockFailures);

      const result = await service.getFailedPayments('loc-1', {});

      expect(result.total_failed_count).toBe(2);
      expect(result.total_failed_amount).toBe(75000); // 50k + 25k

      // Verify string conversion to Number
      expect(result.data[0].amount).toBe(50000);

      // Verify Kysely routing
      expect(mockDb.where).toHaveBeenCalledWith(
        'payments.status',
        '=',
        'FAILED',
      );
      expect(mockDb.orderBy).toHaveBeenCalledWith(
        'payments.created_at',
        'desc',
      );
    });
  });

  describe('getCompanyWideRevenue', () => {
    it('should execute two queries and combine totals with location breakdowns', async () => {
      const mockTotals = { gross_revenue: '1000000', total_transactions: '10' };
      const mockLocations = [
        {
          location_id: 'loc-1',
          location_revenue: '600000',
          location_transactions: '6',
        },
        {
          location_id: 'loc-2',
          location_revenue: '400000',
          location_transactions: '4',
        },
      ];

      // 1. First execution is executeTakeFirst() for totals
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockTotals);

      // 2. Second execution is execute() for the location breakdown
      mockDb.execute.mockResolvedValueOnce(mockLocations);

      const result = await service.getCompanyWideRevenue({});

      // Verify company totals
      expect(result.company_gross_revenue).toBe(1000000);
      expect(result.company_total_transactions).toBe(10);

      // Verify location mapping
      expect(result.locations).toHaveLength(2);
      expect(result.locations[0]).toEqual({
        location_id: 'loc-1',
        revenue: 600000,
        transactions: 6,
      });

      // Verify Kysely routing
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockDb.where).toHaveBeenCalledWith('status', '=', 'CAPTURED');
      expect(mockDb.where).toHaveBeenCalledWith('location_id', 'is not', null);

      // We should see both execute methods called on the branched builder
      expect(mockDb.executeTakeFirst).toHaveBeenCalledTimes(1);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    it('should default to 0 if no transactions exist company-wide', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);
      mockDb.execute.mockResolvedValueOnce([]);

      const result = await service.getCompanyWideRevenue({});

      expect(result.company_gross_revenue).toBe(0);
      expect(result.company_total_transactions).toBe(0);
      expect(result.locations).toEqual([]);
    });
  });
});
