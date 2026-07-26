import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
describe('HealthController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();
        controller = module.get(HealthController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
