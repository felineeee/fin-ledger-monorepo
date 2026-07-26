import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipts.service.js';
import { ReceiptsController } from './receipts.controller.js';

@Module({
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
})
export class ReceiptsModule {}
