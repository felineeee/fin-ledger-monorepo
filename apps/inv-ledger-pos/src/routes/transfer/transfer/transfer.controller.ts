import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TransferService } from './transfer.service.js';
import { CreateTransferDto } from '../dto/branch-transfers.dto.js';
import {
  DispatchTransferDto,
  ReceiveTransferDto,
} from '../dto/branch-transfers.dto.js';

@ApiTags('transfers')
@ApiBearerAuth()
@Controller('api')
export class TransferController {
  constructor(private readonly transfersService: TransferService) {}

  @Get('transfers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List stock movement requests' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query('status') status?: string) {
    return this.transfersService.findAll(status);
  }

  @Get('transfers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View specific transfer manifest and item breakdown',
  })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.findOne(id);
  }

  @Get('locations/:id/transfers/incoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Filtered view: transfers destined for this location',
  })
  @ApiParam({ name: 'id', description: 'Destination Location UUID' })
  async findIncoming(@Param('id', ParseUUIDPipe) locationId: string) {
    return this.transfersService.findIncoming(locationId);
  }

  @Get('locations/:id/transfers/outgoing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Filtered view: transfers originating from this location',
  })
  @ApiParam({ name: 'id', description: 'Source Location UUID' })
  async findOutgoing(@Param('id', ParseUUIDPipe) locationId: string) {
    return this.transfersService.findOutgoing(locationId);
  }

  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a transfer request between locations' })
  async create(@Body() dto: CreateTransferDto) {
    return this.transfersService.create(dto);
  }

  @Patch('transfers/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a transfer while status is PENDING' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  @ApiResponse({ status: 200, description: 'Transfer cancelled' })
  @ApiResponse({ status: 409, description: 'Transfer is no longer PENDING' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.cancel(id);
  }

  @Post('transfers/:id/dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Deduct stock from origin, write TRANSFER_OUT to ledger, set IN_TRANSIT',
  })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  async dispatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispatchTransferDto,
  ) {
    return this.transfersService.dispatch(id, dto);
  }

  @Post('transfers/:id/receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Increment stock at destination, write TRANSFER_IN to ledger, complete transfer',
  })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  async receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceiveTransferDto,
  ) {
    return this.transfersService.receive(id, dto);
  }

  @Post('transfers/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Destination location refuses shipment' })
  @ApiParam({ name: 'id', description: 'Transfer UUID' })
  async reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.reject(id);
  }
}
