import type { NatalAspectType, NatalChartPoint, NatalZodiacSign } from '@prisma/client';
import type { NatalChartPlanetKey } from './engine/natal-chart-constants';
import type { NatalAspectPointKey, NatalAspectTypeKey, NatalZodiacSignKey } from './engine/natal-chart-calculator.service';

/**
 * The calculation engine's own lowercase keys (`sun`, `gemini`, `conjunction`, `ascendant`, ...)
 * and this domain's Prisma enums (`SUN`, `GEMINI`, `CONJUNCTION`, `ASCENDANT`, ...) are
 * deliberately named as exact uppercase/lowercase pairs (see the enum definitions in
 * schema.prisma) specifically so this mapping can be a plain case conversion — never a
 * hand-maintained switch statement that could silently drop a value if a case is missed.
 */
export function toPrismaPoint(key: NatalAspectPointKey): NatalChartPoint {
  return key.toUpperCase() as NatalChartPoint;
}

export function toPrismaSign(key: NatalZodiacSignKey): NatalZodiacSign {
  return key.toUpperCase() as NatalZodiacSign;
}

export function toPrismaAspectType(key: NatalAspectTypeKey): NatalAspectType {
  return key.toUpperCase() as NatalAspectType;
}

export function fromPrismaPoint(value: NatalChartPoint): NatalAspectPointKey {
  return value.toLowerCase() as NatalAspectPointKey;
}

export function fromPrismaPlanet(value: NatalChartPoint): NatalChartPlanetKey {
  return value.toLowerCase() as NatalChartPlanetKey;
}

export function fromPrismaSign(value: NatalZodiacSign): NatalZodiacSignKey {
  return value.toLowerCase() as NatalZodiacSignKey;
}

export function fromPrismaAspectType(value: NatalAspectType): NatalAspectTypeKey {
  return value.toLowerCase() as NatalAspectTypeKey;
}
