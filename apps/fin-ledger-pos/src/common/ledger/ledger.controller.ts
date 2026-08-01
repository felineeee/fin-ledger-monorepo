import {
  Get,
  Query,
  Param,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { LedgerService } from './ledger.service.js';
import { AuthGuard } from '@fin-ledger/guards';
import { CurrentUser } from '@fin-ledger/decorators';
import { TransferRequestDto } from './dto/transfer-request.dto.js';
import { IdempotencyInterceptor } from '@fin-ledger/interceptors';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryLedgerDto } from './dto/query-ledger.dto.js';

@ApiTags('payments-ledger')
@ApiBearerAuth()
@Controller('/api/payments/ledger')
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
      body.source_account_id,
      amountInCents,
      body.description,
    );

    return {
      success: true,
      message: 'Asset transfer processed',
      ...result,
    };
  }

  @Post('accounts')
  @UseGuards(AuthGuard)
  async openNewWallet(
    @CurrentUser() user: { id: string },
    @Body() body: { type: string; currency?: string },
  ) {
    return await this.ledgerService.createAccount(
      user.id,
      body.type,
      body.currency || 'USD',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List immutable transaction ledger records' })
  async getLedgerEntries(@Query() query: QueryLedgerDto) {
    return this.ledgerService.getLedgerEntries(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single ledger entry details' })
  @ApiParam({ name: 'id', description: 'Ledger Entry UUID' })
  async getLedgerEntryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledgerService.getLedgerEntryById(id);
  }
}
