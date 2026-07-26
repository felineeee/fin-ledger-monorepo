import { Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '@/db/types.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';
@Injectable()
export class PaymentMethodsService {
    constructor(private readonly db: Kysely<DB>){}

    // [x] GET /api/payment-methods
  async findAll() {
    return this.db
      .selectFrom('payment_methods')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }

  // [x] GET /api/payment-methods/:id
  async findOne(id: string) {
    const paymentMethod = await this.db
      .selectFrom('payment_methods')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found.`);
    }

    return paymentMethod;
  }

  // [x] POST /api/payment-methods
  async create(dto: CreatePaymentMethodDto) {
    return this.db
      .insertInto('payment_methods')
      .values({
        name: dto.name,
        type: dto.type,
        is_active: dto.is_active ?? true,
        config: dto.config ? JSON.stringify(dto.config) : '{}',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // [x] PATCH /api/payment-methods/:id
  async update(id: string, dto: UpdatePaymentMethodDto) {
    // 1. Ensure it exists first
    const existing = await this.findOne(id);

    // 2. Build the update payload dynamically
    const updatePayload: any = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.type !== undefined) updatePayload.type = dto.type;
    if (dto.is_active !== undefined) updatePayload.is_active = dto.is_active;
    if (dto.config !== undefined) updatePayload.config = JSON.stringify(dto.config);

    // If payload is empty, just return existing record
    if (Object.keys(updatePayload).length === 0) {
      return existing;
    }

    // 3. Apply the update
    return this.db
      .updateTable('payment_methods')
      .set(updatePayload)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
