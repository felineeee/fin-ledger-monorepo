import { Test, TestingModule } from '@nestjs/testing';
import { StocktakeController } from './stocktake.controller';
import { StocktakeService } from './stocktake.service';

describe('StocktakeController', () => {
  let controller: StocktakeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocktakeController],
      providers: [StocktakeService],
    }).compile();

    controller = module.get<StocktakeController>(StocktakeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
