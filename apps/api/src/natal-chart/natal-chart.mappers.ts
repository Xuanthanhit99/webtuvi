import type { NatalAspect, NatalChart, NatalChartHistory, NatalHouse, NatalPlacement } from '@prisma/client';
import { composeAngleMeaning, composeAspectMeaning, composePlacementMeaning } from './engine/natal-chart-meanings';
import { fromPrismaAspectType, fromPrismaPlanet, fromPrismaPoint, fromPrismaSign } from './natal-chart-enum.util';
import type { NatalChartInterpretationSections } from './natal-chart.types';

export interface NatalPlacementDto {
  body: string;
  longitude: number;
  sign: string;
  degreeInSign: number;
  house: number | null;
  retrograde: boolean;
  /** Fixed traditional meaning, composed from planet+sign(+house) — never AI-generated. */
  meaning: string;
}

export interface NatalHouseDto {
  number: number;
  cuspLongitude: number;
  sign: string;
}

export interface NatalAspectDto {
  pointA: string;
  pointB: string;
  type: string;
  orb: number;
  angle: number;
  /** Fixed traditional meaning — never AI-generated. */
  meaning: string;
}

export interface NatalAngleDto {
  longitude: number;
  sign: string;
  degreeInSign: number;
  /** Fixed traditional meaning — never AI-generated. */
  meaning: string;
}

export interface NatalChartDto {
  id: string;
  status: NatalChart['status'];
  visibility: NatalChart['visibility'];
  /** `YYYY-MM-DD`. */
  birthDate: string;
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthPlaceLabel: string;
  timezone: string;
  zodiacMode: string;
  houseSystem: string;
  housesAvailable: boolean;
  calculationVersion: string;
  engineVersion: string;
  ascendant: NatalAngleDto | null;
  midheaven: NatalAngleDto | null;
  placements: NatalPlacementDto[];
  houses: NatalHouseDto[];
  aspects: NatalAspectDto[];
  /** Structured, AI-narrated sections — null until generated. Clearly separate from every other
   * field above, which is real calculated/fixed-reference data (Phase 18/UI labeling). */
  interpretation: NatalChartInterpretationSections | null;
  interpretedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface NatalChartHistoryDto {
  id: string;
  action: NatalChartHistory['action'];
  detail: string;
  createdAt: string;
}

const PLACEMENT_DISPLAY_ORDER: Record<string, number> = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
};

function toNatalPlacementDto(placement: NatalPlacement): NatalPlacementDto {
  const body = fromPrismaPlanet(placement.body);
  const sign = fromPrismaSign(placement.sign);
  return {
    body,
    longitude: placement.longitude,
    sign,
    degreeInSign: placement.degreeInSign,
    house: placement.house,
    retrograde: placement.retrograde,
    meaning: composePlacementMeaning(body, sign, placement.house),
  };
}

function toNatalHouseDto(house: NatalHouse): NatalHouseDto {
  return { number: house.number, cuspLongitude: house.cuspLongitude, sign: fromPrismaSign(house.sign) };
}

function toNatalAspectDto(aspect: NatalAspect): NatalAspectDto {
  const pointA = fromPrismaPoint(aspect.pointA);
  const pointB = fromPrismaPoint(aspect.pointB);
  const type = fromPrismaAspectType(aspect.type);
  return { pointA, pointB, type, orb: aspect.orb, angle: aspect.angle, meaning: composeAspectMeaning(pointA, pointB, type) };
}

function toAngleDto(longitude: number | null, sign: NatalChart['ascendantSign'], degreeInSign: number | null, kind: 'ascendant' | 'midheaven'): NatalAngleDto | null {
  if (longitude === null || sign === null || degreeInSign === null) return null;
  const signKey = fromPrismaSign(sign);
  return { longitude, sign: signKey, degreeInSign, meaning: composeAngleMeaning(kind, signKey) };
}

type NatalChartWithRelations = NatalChart & {
  placements: NatalPlacement[];
  houses: NatalHouse[];
  aspects: NatalAspect[];
};

export function toNatalChartDto(chart: NatalChartWithRelations): NatalChartDto {
  return {
    id: chart.id,
    status: chart.status,
    visibility: chart.visibility,
    birthDate: chart.birthDate.toISOString().slice(0, 10),
    birthTime: chart.birthTime,
    birthTimeKnown: chart.birthTimeKnown,
    birthPlaceLabel: chart.birthPlaceLabel,
    timezone: chart.timezone,
    zodiacMode: chart.zodiacMode,
    houseSystem: chart.houseSystem,
    housesAvailable: chart.housesAvailable,
    calculationVersion: chart.calculationVersion,
    engineVersion: chart.engineVersion,
    ascendant: toAngleDto(chart.ascendantLongitude, chart.ascendantSign, chart.ascendantDegreeInSign, 'ascendant'),
    midheaven: toAngleDto(chart.midheavenLongitude, chart.midheavenSign, chart.midheavenDegreeInSign, 'midheaven'),
    placements: [...chart.placements].sort((a, b) => (PLACEMENT_DISPLAY_ORDER[a.body] ?? 0) - (PLACEMENT_DISPLAY_ORDER[b.body] ?? 0)).map(toNatalPlacementDto),
    houses: [...chart.houses].sort((a, b) => a.number - b.number).map(toNatalHouseDto),
    aspects: chart.aspects.map(toNatalAspectDto),
    interpretation: (chart.interpretation as NatalChartInterpretationSections | null) ?? null,
    interpretedAt: chart.interpretedAt?.toISOString() ?? null,
    createdAt: chart.createdAt.toISOString(),
    updatedAt: chart.updatedAt.toISOString(),
    archivedAt: chart.archivedAt?.toISOString() ?? null,
  };
}

export function toNatalChartHistoryDto(entry: NatalChartHistory): NatalChartHistoryDto {
  return { id: entry.id, action: entry.action, detail: entry.detail, createdAt: entry.createdAt.toISOString() };
}
