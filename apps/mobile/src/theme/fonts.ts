import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Karla_400Regular, Karla_500Medium, Karla_600SemiBold } from '@expo-google-fonts/karla';

/** Fraunces (display) + Karla (body) — confirmed as the real Home typeface pair via
 *  packages/config/tokens.ts's `typography.fontFamily`, matching `font-display`/`font-body`
 *  Tailwind usage across apps/web/features/dashboard/components/home/*. */
export function useAppFonts() {
  return useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
  });
}
