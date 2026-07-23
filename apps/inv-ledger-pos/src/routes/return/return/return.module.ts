import { Module } from '@nestjs/common';
import { ReturnService } from './return.service';
import { ReturnController } from './return.controller';

@Module({
  controllers: [ReturnController],
  providers: [ReturnService],
})
export class ReturnModule {}
