import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
// Replace with your actual DTO paths if different
import { KYSELY_DB } from '@fin-ledger/databases';
import { FeesService } from '../finance/fees/fees.service.js';
describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockFeesService = {
    calculateFee: jest.fn(),
  };

  // 1. Create the chainable Kysely Mock Object
  const mockDbQueryBuilder = () => {
    const mockBuilder = {
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insertInto: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      updateTable: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      deleteFrom: jest.fn().mockReturnThis(),
      returningAll: jest.fn().mockReturnThis(),
      toEqual: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      executeTakeFirst: jest.fn(),
      executeTakeFirstOrThrow: jest.fn(),

      // Transaction support using `this` to refer to `mockBuilder` dynamically
      transaction: jest.fn().mockImplementation(function (this: any) {
        const self = this;
        return {
          execute: jest
            .fn()
            .mockImplementation(async (cb: (trx: any) => any) => {
              return await cb(self);
            }),
        };
      }),
    };

    return mockBuilder;
  };

  let mockDb: ReturnType<typeof mockDbQueryBuilder>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = mockDbQueryBuilder();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
        {
          provide: FeesService,
          useValue: mockFeesService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create and return a PENDING payment attempt', async () => {
      const dto = {
        order_id: 'order-1',
        amount: 50000,
        payment_method_id: 'method-1',
        channel: 'IN_PERSON' as any,
        shift_id: 'shift-1',
      };

      const expectedResult = { id: 'uuid-1', status: 'PENDING', ...dto };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedResult);

      const result = await service.createPayment(dto as any);

      expect(result).toEqual(expectedResult);
      expect(mockDb.insertInto).toHaveBeenCalledWith('payments');
      expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(mockDb.returningAll).toHaveBeenCalled();
    });
  });

  describe('getPayments', () => {
    it('should return a list of payments', async () => {
      const expectedResult = [
        { id: 'uuid-1', amount: 50000, status: 'CAPTURED' },
      ];
      mockDb.execute.mockResolvedValueOnce(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockDb.selectAll).toHaveBeenCalled();
    });
  });

  describe('getPaymentById', () => {
    it('should return the payment if it exists', async () => {
      const expectedResult = { id: 'uuid-1', amount: 50000 };
      mockDb.executeTakeFirst.mockResolvedValueOnce(expectedResult);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'uuid-1');
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.findOne('uuid-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePayment', () => {
    it('should update and return the payment if it is PENDING', async () => {
      const existingPayment = {
        id: 'uuid-1',
        status: 'PENDING',
        amount: 50000,
      };
      const updateDto = { amount: 60000 };
      const updatedPayment = { ...existingPayment, ...updateDto };

      // Mock the initial fetch check
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);
      // Mock the update return
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedPayment);

      const result = await service.updatePayment('uuid-1', updateDto);

      expect(result).toEqual(updatedPayment);
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });

    it('should throw BadRequestException if trying to edit a CAPTURED payment', async () => {
      // Return a payment that is already captured
      const existingPayment = { id: 'uuid-1', status: 'CAPTURED' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingPayment);

      await expect(
        service.updatePayment('uuid-1', { amount: 60000 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelPayment', () => {
    it('should void an uncaptured payment and balance the ledger', async () => {
      const existingPayment = {
        id: 'uuid-1',
        status: 'PENDING',
        amount: 50000,
        currency: 'IDR',
      };
      const voidedPayment = { ...existingPayment, status: 'VOIDED' };

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(existingPayment);
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(voidedPayment);
      mockDb.execute.mockResolvedValueOnce([]);

      const result = await service.cancelPayment('uuid-1');

      expect(result).toEqual(voidedPayment);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'VOIDED' }),
      );
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
    });

    it('should throw ConflictException if trying to cancel a CAPTURED payment', async () => {
      const existingPayment = {
        id: 'uuid-1',
        status: 'CAPTURED',
        amount: 50000,
      };

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(existingPayment);
      await expect(service.cancelPayment('uuid-1')).rejects.toThrow(
        ConflictException,
      );

      expect(mockDb.updateTable).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentsByOrderId', () => {
    it('should return payments linked to an order ID', async () => {
      const expectedResult = [{ id: 'uuid-1', order_id: 'order-123' }];
      mockDb.execute.mockResolvedValueOnce(expectedResult);

      const result = await service.findByOrderId('order-123');

      expect(result).toEqual(expectedResult);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payments');
      expect(mockDb.where).toHaveBeenCalledWith('order_id', '=', 'order-123');
    });
  });
});
