import { Controller } from '@nestjs/common';
import { FeesService } from './fees.service.js';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}
}
