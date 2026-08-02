import { Test, TestingModule } from '@nestjs/testing';
import { GatewayConfigService } from './gateway-config.service';

describe('GatewayConfigService', () => {
  let service: GatewayConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayConfigService],
    }).compile();

    service = module.get<GatewayConfigService>(GatewayConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
