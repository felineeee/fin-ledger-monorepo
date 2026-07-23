import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { StocktakeService } from './stocktake.service.js';
import {
  CreateStocktakeDto,
  SubmitCountBatchDto,
  CorrectStockTakeItemDto,
} from '../dto/stocktake.dto.js';

@ApiTags('stocktakes')
@ApiBearerAuth()
@Controller('api/stocktakes')
export class StocktakeController {
  constructor(private readonly stocktakesService: StocktakeService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active and historical counts' })
  async findAll() {
    return this.stocktakesService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch stocktake status and list of snapshot items',
  })
  @ApiParam({ name: 'id', description: 'Stocktake UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new count session and snapshot inventory' })
  async create(@Body() dto: CreateStocktakeDto) {
    return this.stocktakesService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel/abort an IN_PROGRESS stocktake session' })
  @ApiParam({ name: 'id', description: 'Stocktake UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakesService.remove(id);
  }

  @Post(':id/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit batch barcode scans to update counted_quantity',
  })
  @ApiParam({ name: 'id', description: 'Stocktake UUID' })
  async submitCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitCountBatchDto,
  ) {
    return this.stocktakesService.submitCount(id, dto);
  }

  @Patch(':id/count/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Correct a single miscounted item quantity before finalizing',
  })
  @ApiParam({ name: 'id', description: 'Stocktake UUID' })
  @ApiParam({ name: 'itemId', description: 'Stocktake Item UUID' })
  async correctCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CorrectStockTakeItemDto,
  ) {
    return this.stocktakesService.correctCount(id, itemId, dto);
  }

  @Get(':id/variance-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review expected vs. counted discrepancies' })
  @ApiParam({ name: 'id', description: 'Stocktake UUID' })
  async getVarianceReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakesService.getVarianceReport(id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lock stocktake, apply variances to inventory, and write to ledger',
  })
  @ApiParam({ name: 'id', description: 'Stocktake UUID' })
  async complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakesService.complete(id);
  }
}
