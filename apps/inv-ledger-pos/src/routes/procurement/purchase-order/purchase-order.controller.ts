import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { PurchaseOrderService } from './purchase-order.service.js';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePOStatusDto,
  ReceivePODto,
} from '../dto/purchase-order.dto.js';
import { ReceivingService } from './receiving.service.js';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@Controller('api/purchase-orders')
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly receivingService: ReceivingService,
  ) {}

  // GET /api/purchase-orders
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List POs with optional filtering by status' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'SENT', 'CANCELLED', 'PARTIAL', 'RECEIVED'],
  })
  async findAll(@Query('status') status?: string) {
    return this.purchaseOrderService.findAll(status);
  }

  // GET /api/purchase-orders/:id
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'View full PO details and nested line items' })
  @ApiParam({ name: 'id', description: 'PO UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  // POST /api/purchase-orders
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a DRAFT PO with requested items and quantities',
  })
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrderService.create(dto);
  }

  // PATCH /api/purchase-orders/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit line items and quantities while PO is still DRAFT',
  })
  @ApiParam({ name: 'id', description: 'PO UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrderService.update(id, dto);
  }

  // PATCH /api/purchase-orders/:id/status
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition PO state (DRAFT -> SENT / CANCELLED)' })
  @ApiParam({ name: 'id', description: 'PO UUID' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePOStatusDto,
  ) {
    return this.purchaseOrderService.updateStatus(id, dto);
  }

  // DELETE /api/purchase-orders/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard-delete an un-sent DRAFT PO' })
  @ApiParam({ name: 'id', description: 'PO UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrderService.remove(id);
  }

  // POST /api/purchase-orders/:id/receive
  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process inbound scanned items and update inventory levels',
  })
  @ApiParam({ name: 'id', description: 'PO UUID' })
  @ApiResponse({
    status: 200,
    description: 'Items received successfully, inventory updated',
  })
  @ApiResponse({
    status: 409,
    description: 'PO is not in SENT or PARTIAL status',
  })
  async receivePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceivePODto,
  ) {
    return this.receivingService.receivePurchaseOrder(id, dto);
  }

  // GET /api/purchase-orders/:id/receipts
  @Get(':id/receipts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historical breakdown of partial receiving events against a PO',
  })
  @ApiParam({ name: 'id', description: 'PO UUID' })
  @ApiResponse({
    status: 200,
    description: 'Ledger history retrieved successfully',
  })
  async getPOReceiptHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.receivingService.getPOReceiptHistory(id);
  }
}
