import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import type { PaymentProvider, PaymentProviderName } from './payment-provider.interface';
import { PaymentProviderUnavailableError } from './payment-provider.interface';
import { PayOSProvider } from './payos.provider';

/**
 * Constructs the PayOS provider once, at startup, only if its credentials are present — mirrors
 * `ProviderRegistryService` (Companion AI) exactly. `PaymentCheckoutService` is the only consumer
 * that should call `get()`; a missing provider surfaces as a clear "provider unavailable" outcome
 * (Phase 11's required frontend state) rather than a crash.
 */
@Injectable()
export class PaymentProviderRegistryService {
  private readonly providers = new Map<PaymentProviderName, PaymentProvider>();

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfiguration>('app')!;
    const { clientId, apiKey, checksumKey, baseUrl, mockCheckout } = config.payment.payos;

    if (clientId && apiKey && checksumKey) {
      this.providers.set('payos', new PayOSProvider({ clientId, apiKey, checksumKey, baseUrl, mockCheckout }));
    }
  }

  get(name: PaymentProviderName): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new PaymentProviderUnavailableError(name);
    }
    return provider;
  }

  has(name: PaymentProviderName): boolean {
    return this.providers.has(name);
  }
}
