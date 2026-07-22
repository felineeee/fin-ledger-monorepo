import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { LocationService } from './location.service.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateLocationDto, UpdateLocationDto } from '../dto/location.dto.js';

@ApiTags('locations')
// @ApiBearerAuth()
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 409,
    description: 'A location with this data already exists',
  })
  async createLocation(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.createLocation(createLocationDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all locations' })
  @ApiResponse({
    status: 200,
    description: 'List of locations returned successfully',
  })
  async getLocationAll() {
    return this.locationService.getLocationAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single location by id' })
  @ApiResponse({ status: 200, description: 'Location found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format provided' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationById(@Param('id') id: string) {
    return this.locationService.getLocationById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update location details or deactivate' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID or empty update body',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(id, updateLocationDto);
  }
}
