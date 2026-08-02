import { Test, TestingModule } from '@nestjs/testing';
import { GatewayConfigController } from './gateway-config.controller';

describe('GatewayConfigController', () => {
  let controller: GatewayConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayConfigController],
    }).compile();

    controller = module.get<GatewayConfigController>(GatewayConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
