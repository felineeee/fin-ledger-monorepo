// src/terminals/terminals.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../db/types.js';
import { CreateTerminalDto, UpdateTerminalDto, TerminalQueryDto } from './dto/terminals.dto.js';

@Injectable()
export class TerminalsService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] POST /api/terminals
  async create(dto: CreateTerminalDto) {
    try {
      return await this.db.insertInto('terminals')
        .values({
          location_id: dto.location_id,
          name: dto.name,
          serial_number: dto.serial_number ?? null,
          status: 'ACTIVE',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      // Catch unique violation for serial_number
      if (error.code === '23505') {
        throw new ConflictException('A terminal with this serial number is already registered.');
      }
      throw error;
    }
  }

  // [x] GET /api/terminals
  async findAll(query: TerminalQueryDto) {
    let q = this.db.selectFrom('terminals').selectAll().orderBy('created_at', 'desc');
    
    if (query.location_id) {
      q = q.where('location_id', '=', query.location_id);
    }

    return q.execute();
  }

  // [x] GET /api/terminals/:id
  async findOne(id: string) {
    const terminal = await this.db.selectFrom('terminals')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!terminal) {
      throw new NotFoundException(`Terminal ${id} not found.`);
    }

    return terminal;
  }

  // [x] PATCH /api/terminals/:id
  async update(id: string, dto: UpdateTerminalDto) {
    await this.findOne(id); // Ensure exists

    const updatePayload: any = {};
    if (dto.location_id !== undefined) updatePayload.location_id = dto.location_id;
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.serial_number !== undefined) updatePayload.serial_number = dto.serial_number;
    if (dto.status !== undefined) updatePayload.status = dto.status;

    if (Object.keys(updatePayload).length === 0) {
      return this.findOne(id);
    }

    try {
      return await this.db.updateTable('terminals')
        .set(updatePayload)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Another terminal is already registered with this serial number.');
      }
      throw error;
    }
  }

  // [x] POST /api/terminals/:id/ping
  async ping(id: string) {
    const terminal = await this.findOne(id);

    if (terminal.status !== 'ACTIVE') {
      throw new ConflictException(`Cannot ping terminal because its status is ${terminal.status}`);
    }

    // In a real-world scenario, this is where you would trigger an API call to Stripe/Adyen 
    // to check the hardware connection. For the boilerplate, we return a simulated success.
    return {
      terminal_id: terminal.id,
      status: 'online',
      message: 'Terminal is reachable and responding.',
      pinged_at: new Date().toISOString(),
    };
  }
}