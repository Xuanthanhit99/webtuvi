import type { TuViChartDto } from '../tu-vi.mappers';

/** Everything the interpretation service needs, already computed by the deterministic engine and
 * persisted — this type contains no field the interpretation layer could use to recompute a
 * placement; it only narrates what is given. */
export interface TuViInterpretationInput {
  sex: TuViChartDto['sex'];
  cuc: string;
  menhPosition: string;
  thanPosition: string;
  yearStem: string;
  yearBranch: string;
  mainStars: TuViChartDto['mainStars'];
  auxiliaryStars: TuViChartDto['auxiliaryStars'];
  tuan: TuViChartDto['tuan'];
  triet: TuViChartDto['triet'];
  transformations: TuViChartDto['transformations'];
  tier: 'FREE' | 'PREMIUM';
  memoryReference: { title: string; summary: string } | null;
}
