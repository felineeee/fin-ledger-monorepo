import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../db/types.js';
import { CreateCheckoutSessionDto } from './dto/gateway.dto';
import { KYSELY_DB } from '@fin-ledger/databases';
import { GatewayConfigService } from './gateway-config/gateway-config.service';
import { PaymentRequestCurrency } from 'xendit-node/payment_request/models/PaymentRequestCurrency.js';
import { PaymentRequestChannelProperties } from 'xendit-node/payment_request/models/PaymentRequestChannelProperties.js';
import { EWalletChannelCode } from 'xendit-node/payment_request/models/EWalletChannelCode.js';
import { VirtualAccountChannelCode } from 'xendit-node/payment_request/models/VirtualAccountChannelCode.js';
import { QRCodeChannelCode } from 'xendit-node/payment_method/models/QRCodeChannelCode.js';
/* GatewayService is used for inner-app checkout activity
 *
 */

// @TODO Is gopay not supported?
function resolveEWalletChannel(code: string): EWalletChannelCode {
  const map: Record<string, EWalletChannelCode> = {
    SHOPEEPAY: EWalletChannelCode.Shopeepay,
    DANA: EWalletChannelCode.Dana,
    OVO: EWalletChannelCode.Ovo,
    LINKAJA: EWalletChannelCode.Linkaja,
  };
  return map[code?.toUpperCase()] || (code as EWalletChannelCode);
}

function resolveVAChannel(code: string): VirtualAccountChannelCode {
  const map: Record<string, VirtualAccountChannelCode> = {
    BCA: VirtualAccountChannelCode.Bca,
    BNI: VirtualAccountChannelCode.Bni,
    BRI: VirtualAccountChannelCode.Bri,
    MANDIRI: VirtualAccountChannelCode.Mandiri,
    PERMATA: VirtualAccountChannelCode.Permata,
    CIMB: VirtualAccountChannelCode.Cimb,
  };
  return map[code?.toUpperCase()] || (code as VirtualAccountChannelCode);
}

function resolveQRChannel(code: string): QRCodeChannelCode {
  return (
    code?.toUpperCase() === 'QRIS' ? QRCodeChannelCode.Qris : code
  ) as QRCodeChannelCode;
}
@Injectable()
export class GatewayService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<DB>,
    private readonly configService: GatewayConfigService,
  ) {}

  // [x] POST /api/payments/:id/create-checkout-session
  async createCheckoutSession(
    paymentId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    // 1. Fetch payment alongside its associated payment method metadata
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
        'payments.currency',
        'payments.status',
        'payments.channel',
        'payment_methods.type as method_type',
        'payment_methods.config as method_config',
        'payment_methods.channel_code as channel_code',
      ])
      .where('payments.id', '=', paymentId)
      .executeTakeFirst();

    // Checking
    if (!payment)
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    if (payment.channel !== 'ONLINE')
      throw new ConflictException(
        'Checkout sessions are only for ONLINE payments.',
      );
    if (payment.status !== 'PENDING')
      throw new ConflictException(`Payment is already ${payment.status}.`);

    const { config: gatewayConfig } =
      await this.configService.getXenditDbConfig();

    // Resolve target channel code (DTO override > DB fallback)
    const targetChannelCode =
      dto.channel_code && dto.channel_code !== 'GENERIC'
        ? dto.channel_code
        : payment.channel_code !== 'GENERIC'
          ? payment.channel_code
          : null;

    if (targetChannelCode) {
      const paymentRequestClient = this.configService.getPaymentRequestClient();
      let gatewayResponse;
      try {
        switch (payment.method_type) {
          case 'WALLET': {
            const resolvedChannel = resolveEWalletChannel(targetChannelCode);

            if (targetChannelCode === 'OVO' && !dto.phone_number) {
              throw new BadRequestException(
                'phone_number is required for OVO payments.',
              );
            }

            gatewayResponse = await paymentRequestClient.createPaymentRequest({
              data: {
                referenceId: payment.id,
                currency: (payment.currency || 'IDR') as PaymentRequestCurrency,
                amount: Number(payment.amount),
                paymentMethod: {
                  type: 'EWALLET',
                  reusability: 'ONE_TIME_USE',
                  ewallet: {
                    channelCode: resolvedChannel,
                    channelProperties: {
                      ...(dto.success_redirect_url && {
                        successReturnUrl: dto.success_redirect_url,
                      }),
                      ...(dto.failure_redirect_url && {
                        failureReturnUrl: dto.failure_redirect_url,
                      }),
                      ...(dto.phone_number && {
                        mobileNumber: dto.phone_number,
                      }),
                    },
                  },
                },
              },
            });
            break;
          }

          case 'QRIS': {
            gatewayResponse = await paymentRequestClient.createPaymentRequest({
              data: {
                referenceId: payment.id,
                currency: (payment.currency || 'IDR') as PaymentRequestCurrency,
                amount: Number(payment.amount),
                paymentMethod: {
                  type: 'QR_CODE',
                  reusability: 'ONE_TIME_USE',
                  qrCode: {
                    channelCode: resolveQRChannel(targetChannelCode || 'NOBU'),
                  },
                },
              },
            });
            break;
          }

          case 'VIRTUAL_ACCOUNT': {
            gatewayResponse = await paymentRequestClient.createPaymentRequest({
              data: {
                referenceId: payment.id,
                currency: (payment.currency || 'IDR') as PaymentRequestCurrency,
                amount: Number(payment.amount),
                paymentMethod: {
                  type: 'VIRTUAL_ACCOUNT',
                  reusability: 'ONE_TIME_USE',
                  virtualAccount: {
                    channelCode: resolveVAChannel(targetChannelCode),
                    channelProperties: {
                      customerName: 'POS Checkout',
                    },
                  },
                },
              },
            });
            break;
          }

          default:
            throw new ConflictException(
              `Direct checkout not supported for method type: ${payment.method_type}`,
            );
        }

        return {
          payment_id: payment.id,
          status: payment.status,
          method_type: payment.method_type,
          channel_code: targetChannelCode,
          gateway_data: gatewayResponse,
        };
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new ConflictException(
          `Xendit Payment Request Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    if (!gatewayConfig?.api_key) {
      throw new ConflictException('Gateway API Key is not configured.');
    }

    const payload = {
      external_id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      success_redirect_url: dto.success_redirect_url,
      failure_redirect_url: dto.failure_redirect_url,
      payment_methods: gatewayConfig.enabled_channels || [
        'CREDIT_CARD',
        'VIRTUAL_ACCOUNT',
        'QRIS',
        'EWALLET',
        'PAYLATER',
      ],
    };

    // @TODO Pass this into receipt service
    const response = await fetch('https://api.xendit.co/v3/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(gatewayConfig.api_key + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new ConflictException(
        `Failed to create Xendit checkout session: ${err.message}`,
      );
    }

    const xenditInvoice = await response.json();

    return {
      payment_id: payment.id,
      checkout_url: xenditInvoice.invoice_url,
      expires_at: xenditInvoice.expiry_date,
      status: xenditInvoice.status,
    };
  }

  // [x] GET /api/payments/:id/checkout-session
  async getCheckoutSession(paymentId: string) {
    const { config } = await this.configService.getXenditDbConfig();

    const response = await fetch(
      `https://api.xendit.co/v2/invoices?external_id=${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(config.api_key + ':').toString('base64')}`,
        },
      },
    );

    const invoices = await response.json();
    if (!invoices || invoices.length === 0) {
      throw new NotFoundException(
        `No active checkout session found for payment ${paymentId}`,
      );
    }

    return invoices[0];
  }

  // [x] POST /api/payments/:id/retry
  async retryCheckoutSession(paymentId: string, dto: CreateCheckoutSessionDto) {
    await this.cancelCheckoutSession(paymentId, true);
    return this.createCheckoutSession(paymentId, dto);
  }

  // [x] POST /api/payments/:id/cancel-checkout-session
  async cancelCheckoutSession(paymentId: string, isRetry = false) {
    const session = await this.getCheckoutSession(paymentId);
    const { config } = await this.configService.getXenditDbConfig();

    if (session.status === 'PENDING') {
      await fetch(`https://api.xendit.co/invoices/${session.id}/expire!`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(config.api_key + ':').toString('base64')}`,
        },
      });
    }

    if (isRetry) return { success: true, message: 'Old session expired.' };

    return this.db.transaction().execute(async (trx) => {
      const payment = await trx
        .selectFrom('payments')
        .selectAll()
        .where('id', '=', paymentId)
        .executeTakeFirstOrThrow();

      const updated = await trx
        .updateTable('payments')
        .set({ status: 'VOIDED', updated_at: sql`NOW()` })
        .where('id', '=', paymentId)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('payment_ledger')
        .values({
          payment_id: paymentId,
          entry_type: 'VOIDED',
          amount: sql`${payment.amount} * -1`,
          currency: payment.currency,
        })
        .execute();

      return updated;
    });
  }
}
