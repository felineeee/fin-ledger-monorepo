import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';
import { SplitTenderService } from './split.service.js';

describe('PaymentsService - Split Tender & Balances', () => {
  let splitService: SplitTenderService;
  let paymentService: PaymentsService;

  // 1. Create the chainable Kysely Mock Object
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };

  // Mock Kysely transaction
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
        PaymentsService,
        SplitTenderService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    paymentService = module.get<PaymentsService>(PaymentsService);
    splitService = module.get<SplitTenderService>(SplitTenderService);
  });
});
