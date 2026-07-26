// src/terminals/terminals.controller.ts
import { 
  Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TerminalsService } from './terminals.service.js';
import { CreateTerminalDto, UpdateTerminalDto, TerminalQueryDto } from './dto/terminals.dto.js';

@ApiTags('terminals')
@ApiBearerAuth()
@Controller('api/terminals')
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List registered card readers per location' })
  async findAll(@Query() query: TerminalQueryDto) {
    return this.terminalsService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new card terminal' })
  @ApiResponse({ status: 201, description: 'Terminal registered successfully' })
  async create(@Body() dto: CreateTerminalDto) {
    return this.terminalsService.create(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a single terminal' })
  @ApiParam({ name: 'id', description: 'Terminal UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update terminal details (rename, reassign location, update status)' })
  @ApiParam({ name: 'id', description: 'Terminal UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTerminalDto,
  ) {
    return this.terminalsService.update(id, dto);
  }

  @Post(':id/ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check terminal connectivity and health' })
  @ApiParam({ name: 'id', description: 'Terminal UUID' })
  @ApiResponse({ status: 200, description: 'Terminal is online and reachable' })
  @ApiResponse({ status: 409, description: 'Terminal is inactive or in maintenance' })
  async ping(@Param('id', ParseUUIDPipe) id: string) {
    return this.terminalsService.ping(id);
  }
}