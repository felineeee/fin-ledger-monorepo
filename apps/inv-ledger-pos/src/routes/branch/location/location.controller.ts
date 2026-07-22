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
} from '@nestjs/common';
import { LocationService } from './location.service.js';
import { CreateLocationDto, UpdateLocationDto } from '../dto/location.dto.js';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLocation(@Body() dto: CreateLocationDto) {}

  @Get()
  async getLocationAll() {}

  @Get(':id')
  async getLocationById() {}

  @Patch(':id')
  async updateLocation() {}
}
