import { 
  Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service.js';
import { OpenShiftDto, CashDropDto, CloseShiftDto, ShiftQueryDto } from './dto/shifts.dto.js';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('api')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('shifts/open')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a shift and declare starting cash float' })
  @ApiResponse({ status: 201, description: 'Shift opened successfully' })
  @ApiResponse({ status: 409, description: 'An open shift already exists for this cashier/location' })
  async openShift(@Body() dto: OpenShiftDto) {
    return this.shiftsService.openShift(dto);
  }

  @Get('shifts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List shifts system-wide (Supports filtering)' })
  async findAll(@Query() query: ShiftQueryDto) {
    return this.shiftsService.findAll(query);
  }

  @Get('locations/:id/shifts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List shift history for a specific location' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  async findByLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.findByLocation(id);
  }

  @Get('shifts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed shift summary including running totals and drops' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.findOne(id);
  }

  @Post('shifts/cash-drop')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record mid-shift cash drop to the safe' })
  async recordCashDrop(@Body() dto: CashDropDto) {
    return this.shiftsService.recordCashDrop(dto);
  }

  @Post('shifts/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close shift, record actual cash, and calculate variance against ledger' })
  async closeShift(@Body() dto: CloseShiftDto) {
    return this.shiftsService.closeShift(dto);
  }

  @Post('shifts/:id/force-close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin override to force-close an abandoned shift (flags for audit)' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  async forceClose(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftsService.forceClose(id);
  }
}