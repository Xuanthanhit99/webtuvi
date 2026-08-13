import { MaxLength, MinLength } from 'class-validator';

export class GeocodingSearchQueryDto {
  /** Free-text place name — bounded length only; the geocoder itself decides what's a real
   * place. Never per-keystroke: this endpoint is only ever called on an explicit user search
   * action (enforced at the frontend, not here). */
  @MinLength(1)
  @MaxLength(200)
  q!: string;
}
