import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import {
  InventoryAdjustmentDto,
  SetReorderThresholdDto,
} from '../dto/inventory-adjustment.dto.js';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('api')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET /api/locations/:id/inventory
  @Get('locations/:id/inventory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch current inventory levels for a specific location',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory levels returned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid location UUID' })
  async getInventoryByLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getInventoryByLocation(id);
  }

  // PATCH /api/locations/:id/inventory/:productId/reorder-threshold
  @Patch('locations/:id/inventory/:productId/reorder-threshold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Set minimum reorder point threshold for a product at a specific location',
  })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiParam({ name: 'productId', description: 'Remote Product UUID' })
  @ApiResponse({ status: 200, description: 'Threshold updated successfully' })
  @ApiResponse({
    status: 404,
    description: 'Product not currently tracked at this location',
  })
  async setReorderThreshold(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: SetReorderThresholdDto,
  ) {
    return this.inventoryService.setReorderThreshold(id, productId, dto);
  }

  // POST /api/inventory/adjust
  @Post('inventory/adjust')
  @ApiOperation({
    summary: 'Perform manual stock adjustments (writes to ledger)',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock adjusted and ledger entry created',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (e.g., quantity_change is 0)',
  })
  @ApiResponse({
    status: 409,
    description: 'Foreign key violation (invalid location)',
  })
  @HttpCode(HttpStatus.CREATED)
  async adjustInventory(@Body() dto: InventoryAdjustmentDto) {
    return this.inventoryService.adjustInventory(dto);
  }

  // GET /api/locations/:id/inventory/:productId
  @Get('locations/:id/inventory/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get real-time stock level for a single product at a specific location',
  })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiParam({ name: 'productId', description: 'Remote Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stock level returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product is not tracked at this location',
  })
  async getSingleProductInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.inventoryService.getSingleProductInventory(id, productId);
  }

  // GET /api/products/:id/inventory
  @Get('products/:id/inventory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'View stock level breakdown across all locations for a specific product',
  })
  @ApiParam({ name: 'id', description: 'Remote Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Cross-location stock breakdown returned successfully',
  })
  async getProductInventoryAcrossLocations(
    @Param('id', ParseUUIDPipe) productId: string,
  ) {
    return this.inventoryService.getProductInventoryAcrossLocations(productId);
  }

  // GET /api/inventory/low-stock
  @Get('inventory/low-stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cross-location view of products falling below their reorder point',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock report returned successfully',
  })
  async getLowStockReport() {
    return this.inventoryService.getLowStockReport();
  }
}
