import { Test, TestingModule } from '@nestjs/testing';
import { StocktakeService } from './stocktake.service';

describe('StocktakeService', () => {
  let service: StocktakeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StocktakeService],
    }).compile();

    service = module.get<StocktakeService>(StocktakeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
