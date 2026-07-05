import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TransferRequestDto } from './dto/transfer-request.dto';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  async initiateTransfer(
    @CurrentUser() user: { id: string },
    @Body() body: TransferRequestDto,
  ) {
    const amountInCents = BigInt(body.amount);
    const result = await this.ledgerService.executeTransfer(
      user.id,
      body.target_account_id,
      amountInCents,
      body.description,
    );

    return {
      success: true,
      message: 'Asset transfer processed',
      ...result,
    };
  }
}
