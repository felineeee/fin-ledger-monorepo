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
import { SupplierService } from './supplier.service.js';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../dto/purchase-order.dto.js';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('api/suppliers')
@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all suppliers and contact details' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  async findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single supplier details' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Supplier with this name or email already exists',
  })
  async create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update supplier details or deactivate' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.update(id, dto);
  }
}
