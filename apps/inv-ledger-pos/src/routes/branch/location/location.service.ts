import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { KYSELY_DB } from '@inv-ledger/database';
import type { Kysely } from '@inv-ledger/database';
import { randomUUID } from 'crypto';
import { DB } from '@/db/types.js';
import { CreateLocationDto, UpdateLocationDto } from '../dto/location.dto.js';

@Injectable()
export class LocationService {
  async createLocation(dto: CreateLocationDto) {
    try {
    } catch (error) {}
  }
  async getLocationAll(activeOnly = true) {}
  async getLocationById(id: string) {}
  async updateLocation(id: string, dto: UpdateLocationDto) {
    try {
    } catch (error) {}
  }
}
