import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TerminalsService } from './terminals.service.js';
import { KYSELY_DB } from '@fin-ledger/databases';
import { TerminalQueryDto } from './dto/terminals.dto.js';

describe('TerminalsService', () => {
  let service: TerminalsService;

  // 1. Create the chainable Kysely Mock Object
  const mockDbQueryBuilder = {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };

  const mockDb = mockDbQueryBuilder;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerminalsService,
        {
          provide: KYSELY_DB,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<TerminalsService>(TerminalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTerminal', () => {
    it('should register a new card terminal', async () => {
      const dto = {
        location_id: 'loc-1',
        name: 'Front Counter EDC',
      };

      const expectedResult = {
        id: 'term-1',
        ...dto,
        serial_number: null,
        status: 'ACTIVE',
      };

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedResult);

      const result = await service.create(dto as any);

      expect(result).toEqual(expectedResult);
      expect(mockDb.insertInto).toHaveBeenCalledWith('terminals');

      // Assert the exact default values your service sets in DB
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          location_id: 'loc-1',
          name: 'Front Counter EDC',
          serial_number: null,
          status: 'ACTIVE',
        }),
      );
    });
  });

  describe('getTerminals', () => {
    it('should return a list of terminals for a location', async () => {
      const queryDto: TerminalQueryDto = {
        location_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };

      const expectedResult = [{ id: 'term-1', name: 'Front Counter EDC' }];
      mockDb.execute.mockResolvedValueOnce(expectedResult);

      const result = await service.findAll(queryDto);

      expect(result).toEqual(expectedResult);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('terminals');
      expect(mockDb.where).toHaveBeenCalledWith(
        'location_id',
        '=',
        queryDto.location_id,
      );
    });
  });

  describe('getTerminalById', () => {
    it('should return terminal details', async () => {
      const expectedResult = { id: 'term-1', name: 'Front Counter EDC' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(expectedResult);

      const result = await service.findOne('term-1');

      expect(result).toEqual(expectedResult);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'term-1');
    });

    it('should throw NotFoundException if terminal not found', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.findOne('term-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTerminal', () => {
    it('should update terminal details', async () => {
      const dto = { name: 'Drive Thru EDC', status: 'OFFLINE' };
      const expectedResult = { id: 'term-1', ...dto };

      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'term-1' });
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(expectedResult);

      const result = await service.update('term-1', dto as any);

      expect(result).toEqual(expectedResult);
      expect(mockDb.updateTable).toHaveBeenCalledWith('terminals');
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining(dto));
    });
  });

  describe('pingTerminal', () => {
    it('should return terminal health status if terminal is ACTIVE', async () => {
      const activeTerminal = {
        id: 'term-1',
        status: 'ACTIVE',
        name: 'Front Counter EDC',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(activeTerminal);

      const result = await service.ping('term-1');

      expect(result).toEqual({
        terminal_id: 'term-1',
        status: 'online',
        message: 'Terminal is reachable and responding.',
        pinged_at: expect.any(String),
      });
    });

    it('should throw ConflictException if terminal is not ACTIVE', async () => {
      const inactiveTerminal = {
        id: 'term-1',
        status: 'INACTIVE',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(inactiveTerminal);

      await expect(service.ping('term-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if terminal does not exist', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.ping('term-999')).rejects.toThrow(NotFoundException);
    });
  });
});
