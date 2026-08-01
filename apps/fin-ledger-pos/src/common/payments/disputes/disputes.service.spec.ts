import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DisputesService } from './disputes.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';

describe('DisputesService', () => {
  let service: DisputesService;

  // Fluent chainable Kysely mock
  const mockDbQueryBuilder: any = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
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
      providers: [DisputesService, { provide: KYSELY_DB, useValue: mockDb }],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  describe('getAllDisputes', () => {
    it('should return a list of disputes ordered by creation date', async () => {
      const mockDisputes = [{ id: 'disp-1' }, { id: 'disp-2' }];
      mockDb.execute.mockResolvedValueOnce(mockDisputes);

      const result = await service.getAllDisputes();

      expect(result).toEqual(mockDisputes);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('disputes');
      expect(mockDb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });
  });

  describe('getDisputeDetails', () => {
    it('should return dispute details if found', async () => {
      const mockDispute = { id: 'disp-1' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockDispute);

      const result = await service.getDisputeDetails('disp-1');

      expect(result).toEqual(mockDispute);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'disp-1');
    });

    it('should throw NotFoundException if dispute does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.getDisputeDetails('disp-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('respondToDispute', () => {
    const dto = {
      evidence_text: 'Customer signed receipt',
      evidence_url: 'https://cdn.com/receipt.jpg',
    };

    it('should update a PENDING dispute with evidence', async () => {
      const pendingDispute = { id: 'disp-1', status: 'PENDING' };
      const updatedDispute = { ...pendingDispute, ...dto };

      // 1. Mock getDisputeDetails fetch
      mockDb.executeTakeFirst.mockResolvedValueOnce(pendingDispute);
      // 2. Mock update return
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedDispute);

      const result = await service.respondToDispute('disp-1', dto);

      expect(result).toEqual(updatedDispute);
      expect(mockDb.updateTable).toHaveBeenCalledWith('disputes');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          evidence_text: dto.evidence_text,
          evidence_url: dto.evidence_url,
        }),
      );
    });

    it('should throw ConflictException if dispute is not PENDING', async () => {
      const wonDispute = { id: 'disp-1', status: 'WON' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(wonDispute);

      await expect(service.respondToDispute('disp-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDb.updateTable).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if database update fails', async () => {
      const pendingDispute = { id: 'disp-1', status: 'PENDING' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(pendingDispute);

      // Simulate DB crash
      mockDb.executeTakeFirstOrThrow.mockRejectedValueOnce(
        new Error('DB Constraint Failure'),
      );

      await expect(service.respondToDispute('disp-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateDisputeStatus', () => {
    it('should update status to WON without altering the ledger', async () => {
      const existingDispute = {
        id: 'disp-1',
        payment_id: 'pay-1',
        amount: '50000',
        status: 'PENDING',
      };
      const updatedDispute = { ...existingDispute, status: 'WON' };

      // Inside transaction
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingDispute); // Fetch dispute
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedDispute); // Update dispute

      const result = await service.updateDisputeStatus('disp-1', {
        status: 'WON',
      } as any);

      expect(result.status).toBe('WON');
      expect(mockDb.updateTable).toHaveBeenCalledWith('disputes');
      expect(mockDb.insertInto).not.toHaveBeenCalled(); // Ledger should NOT be hit
    });

    it('should void payment and write negative ledger entry if status is LOST', async () => {
      const existingDispute = {
        id: 'disp-1',
        payment_id: 'pay-1',
        amount: '50000',
        status: 'PENDING',
      };
      const updatedDispute = { ...existingDispute, status: 'LOST' };
      const associatedPayment = { id: 'pay-1', currency: 'IDR' };

      // Inside transaction mock sequence
      mockDb.executeTakeFirst.mockResolvedValueOnce(existingDispute); // Fetch dispute
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(updatedDispute); // Update dispute
      mockDb.executeTakeFirst.mockResolvedValueOnce(associatedPayment); // Fetch payment

      await service.updateDisputeStatus('disp-1', { status: 'LOST' } as any);

      expect(mockDb.transaction().execute).toHaveBeenCalled();

      // 1. Verify Payment is voided
      expect(mockDb.updateTable).toHaveBeenCalledWith('payments');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'VOIDED' }),
      );

      // 2. Verify Ledger double-entry reversal
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment_ledger');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_id: 'pay-1',
          entry_type: 'VOIDED',
          currency: 'IDR',
          metadata: JSON.stringify({
            reason: 'CHARGEBACK_LOST',
            dispute_id: 'disp-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException if dispute does not exist during status update', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined); // Fetch returns nothing

      await expect(
        service.updateDisputeStatus('disp-999', { status: 'WON' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
