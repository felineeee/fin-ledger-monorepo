import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  // 1. Create terminal execution jest functions
  const mockExecute = jest.fn();
  const mockExecuteTakeFirst = jest.fn();
  const mockExecuteTakeFirstOrThrow = jest.fn();

  // 2. Define chainable builder
  const createMockDb = () => ({
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    execute: mockExecute,
    executeTakeFirst: mockExecuteTakeFirst,
    executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
  });

  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPaymentMethods', () => {
    it('should return an array of payment methods', async () => {
      const expectedResult = [
        { id: '1', name: 'Cash', type: 'CASH', is_active: true },
      ];
      mockExecute.mockResolvedValueOnce(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payment_methods');
      expect(mockDb.selectAll).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('createPaymentMethod', () => {
    it('should successfully create and return a payment method', async () => {
      const dto = {
        name: 'Xendit VA',
        type: 'VIRTUAL_ACCOUNT' as any,
        provider: 'XENDIT',
      };
      const expectedResult = { id: 'uuid-1', ...dto, is_active: true };

      mockExecuteTakeFirstOrThrow.mockResolvedValueOnce(expectedResult);

      const result = await service.create(dto as any);

      expect(result).toEqual(expectedResult);
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_methods');
      expect(mockDb.values).toHaveBeenCalledWith({
        name: dto.name,
        type: dto.type,
        is_active: true,
        config: '{}',
      });
      expect(mockDb.returningAll).toHaveBeenCalled();
    });
  });

  describe('getPaymentMethodById', () => {
    it('should return a payment method if found', async () => {
      const expectedResult = { id: 'uuid-1', name: 'Cash' };
      mockExecuteTakeFirst.mockResolvedValueOnce(expectedResult);

      const result = await service.findOne(expectedResult.id);

      expect(result).toEqual(expectedResult);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'uuid-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockExecuteTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.findOne('uuid-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update and return the payment method', async () => {
      const dto = { is_active: false };
      const existingMethod = { id: 'uuid-1', name: 'OVO', is_active: true };
      const expectedResult = { id: 'uuid-1', name: 'OVO', is_active: false };

      mockExecuteTakeFirst.mockResolvedValueOnce(existingMethod);
      mockExecuteTakeFirstOrThrow.mockResolvedValueOnce(expectedResult);

      const result = await service.update('uuid-1', dto);

      expect(result).toEqual(expectedResult);
      expect(mockDb.updateTable).toHaveBeenCalledWith('payment_methods');
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'uuid-1');
    });

    it('should throw NotFoundException if trying to update non-existent method', async () => {
      mockExecuteTakeFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.update('uuid-999', { is_active: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
