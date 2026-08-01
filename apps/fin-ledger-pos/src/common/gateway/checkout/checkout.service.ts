// src/gateway/checkout.service.ts
import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../db/types.js';
import { GatewayService } from '../gateway.service.js';
import {
  CreateCheckoutSessionDto,
  VirtualAccountChannel,
} from '../dto/checkout.dto.js';
import { VirtualAccount } from 'xendit-node/payment_request/models/VirtualAccount.js';
import { EWallet } from 'xendit-node/payment_request/models/EWallet.js';
import { VirtualAccountChannelCode } from 'xendit-node/payment_request/models/VirtualAccountChannelCode.js';

@Injectable()
export class CheckoutService {
  constructor(
    @Inject('DB_INSTANCE') private readonly db: Kysely<DB>,
    private readonly gateway: GatewayService,
  ) {}

  // [x] POST /api/payments/:id/create-checkout-session
  async createSession(paymentId: string, dto: CreateCheckoutSessionDto) {
    const payment = await this.db
      .selectFrom('payments')
      .innerJoin(
        'payment_methods',
        'payments.payment_method_id',
        'payment_methods.id',
      )
      .select([
        'payments.id',
        'payments.amount',
        'payments.status',
        'payment_methods.type',
      ])
      .where('payments.id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING')
      throw new BadRequestException(`Payment is already ${payment.status}`);

    const xendit = this.gateway.getClient();
    let gatewayResponse;

    try {
      // 1. Route based on Payment Method Type
      switch (payment.type) {
        case 'VIRTUAL_ACCOUNT':
          // Xendit Payment Method API (Virtual Account)
          gatewayResponse = await xendit.PaymentMethod.createPaymentMethod({
            data: {
              type: 'VIRTUAL_ACCOUNT',
              reusability: 'ONE_TIME_USE',
              referenceId: payment.id,
              virtualAccount: {
                channelCode:
                  dto.channel_code as unknown as VirtualAccountChannelCode,
                channelProperties: {
                  customerName: 'POS Checkout',
                  // amount is set when creating a Payment Request using this payment method
                },
              },
            },
          });
          break;

        case 'WALLET':
          // Xendit E-Wallet Charge API
          gatewayResponse = await xendit.PaymentRequest.createPaymentRequest({
            data: {
              referenceId: payment.id,
              currency: 'IDR',
              amount: Number(payment.amount),
              paymentMethod: {
                type: 'EWALLET',
                ewallet: {
                  channelCode: dto.channel_code as any,
                  channelProperties: {
                    ...(dto.phone_number && {
                      mobileNumber: dto.phone_number,
                    }),
                    ...(dto.return_url && {
                      successReturnUrl: dto.return_url,
                    }),
                  },
                },
                reusability: 'ONE_TIME_USE',
              },
            },
          });
          break;

        // @TODO Need another migration
        case 'QRIS':
          // Xendit Dynamic QR Code API
          gatewayResponse = await xendit.PaymentRequest.createPaymentRequest({
            data: {
              referenceId: payment.id,
              currency: 'IDR',
              amount: Number(payment.amount),
              paymentMethod: {
                type: 'QR_CODE',
                qrCode: {
                  channelCode: 'QRIS',
                },
                reusability: 'ONE_TIME_USE',
              },
            },
          });
          break;

        case 'CARD':
          if (!dto.card_token)
            throw new BadRequestException(
              'card_token is required for credit cards',
            );
          // Note: Standard Xendit Card Charge (requires tokenization on frontend)
          throw new BadRequestException(
            'Card processing requires direct token charging implementation',
          );

        default:
          throw new BadRequestException(
            `Unsupported online payment type: ${payment.type}`,
          );
      }

      return {
        payment_id: payment.id,
        method: payment.type,
        channel: dto.channel_code,
        // Send the raw Xendit response back so the frontend can render the QR string, VA number, or redirect URL
        gateway_data: gatewayResponse,
      };
    } catch (error) {
      throw new BadRequestException(
        `Gateway Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // [x] GET /api/payments/:id/checkout-session
  async getSessionStatus(paymentId: string) {
    // In a real-world scenario, you might query Xendit directly here,
    // but typically you just rely on your internal database state updated by webhooks.
    const payment = await this.db
      .selectFrom('payments')
      .select(['id', 'status', 'amount'])
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) throw new NotFoundException('Payment not found');

    return {
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amount,
    };
  }
}
