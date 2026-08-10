import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentOrder } from '@prisma/client';
import type { PaymentOrderDto } from '@beaconvie/types';
import type { AppConfiguration } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProviderRegistryService } from '../providers/payment-provider-registry.service';
import { generateOrderCode } from '../providers/payos-signature.util';
import { toPaymentOrderDto } from '../payment.mappers';

const PRODUCT = 'PREMIUM_30D' as const;
const PROVIDER = 'PAYOS' as const;
const MAX_ORDER_CODE_ATTEMPTS = 3;
const CHECKOUT_LINK_TTL_MS = 30 * 60 * 1000;
// PayOS caps `description` length — keep this short and unambiguous rather than truncating
// mid-sentence at request time.
const CHECKOUT_DESCRIPTION = 'BeaconVie Premium';

/**
 * Backend-controlled checkout (Phase 5 of the sprint brief). The browser only ever asks to
 * "purchase Premium" — product, price, and currency are read exclusively from server config
 * (`PREMIUM_PRICE_VND`/`PREMIUM_DURATION_DAYS`), never accepted from the request body.
 */
@Injectable()
export class PaymentCheckoutService {
  private readonly logger = new Logger('Payment');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly providerRegistry: PaymentProviderRegistryService,
  ) {}

  async createCheckout(userId: string): Promise<PaymentOrderDto> {
    if (!this.providerRegistry.has('payos')) {
      throw new BadRequestException({
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: 'Payment is temporarily unavailable. Please try again later.',
      });
    }
    const provider = this.providerRegistry.get('payos');
    const config = this.configService.get<AppConfiguration>('app')!;
    const amount = config.payment.premium.priceVnd;
    const currency = 'VND';

    const order = await this.createPendingOrder(userId, amount, currency);

    const returnUrl = `${config.frontendUrl}/premium/return?order=${order.id}`;
    const cancelUrl = `${config.frontendUrl}/premium?cancelled=1`;

    try {
      const result = await provider.createPayment({
        orderCode: Number(order.providerOrderCode),
        amount,
        currency,
        description: CHECKOUT_DESCRIPTION,
        returnUrl,
        cancelUrl,
      });

      const updated = await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { providerCheckoutUrl: result.checkoutUrl, providerPaymentLinkId: result.providerPaymentLinkId },
      });

      this.logger.log(`payment.order.created id=${updated.id} userId=${userId} amount=${amount} ${currency}`);
      return toPaymentOrderDto(updated);
    } catch (error) {
      await this.prisma.paymentOrder.update({ where: { id: order.id }, data: { status: 'FAILED', failedAt: new Date() } });
      this.logger.error(`payment.order.provider_error id=${order.id}`, error instanceof Error ? error.message : String(error));
      throw new BadRequestException({ code: 'PAYMENT_PROVIDER_ERROR', message: 'Could not start checkout. Please try again.' });
    }
  }

  async getOrder(userId: string, orderId: string): Promise<PaymentOrderDto> {
    const order = await this.prisma.paymentOrder.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException({ code: 'PAYMENT_ORDER_NOT_FOUND', message: 'That order was not found.' });
    }
    return toPaymentOrderDto(order);
  }

  /** `providerOrderCode` is unique per order; a collision is vanishingly unlikely (millisecond
   * timestamp + random suffix) but retried a few times rather than trusted blindly. */
  private async createPendingOrder(userId: string, amount: number, currency: string): Promise<PaymentOrder> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ORDER_CODE_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.paymentOrder.create({
          data: {
            userId,
            product: PRODUCT,
            amount,
            currency,
            provider: PROVIDER,
            providerOrderCode: String(generateOrderCode()),
            status: 'PENDING',
            expiresAt: new Date(Date.now() + CHECKOUT_LINK_TTL_MS),
          },
        });
      } catch (error) {
        lastError = error;
      }
    }
    this.logger.error(`payment.order.code_collision attempts=${MAX_ORDER_CODE_ATTEMPTS}`, lastError as Error);
    throw new BadRequestException({ code: 'PAYMENT_ORDER_CREATE_FAILED', message: 'Could not start checkout. Please try again.' });
  }
}
