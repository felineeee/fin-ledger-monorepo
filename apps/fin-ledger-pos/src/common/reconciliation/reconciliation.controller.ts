import { Controller } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service.js';

@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}
}
