import { ScrollView, StyleSheet } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { CelestialDivider } from '@/components/celestial-divider';
import { Screen } from '@/components/screen';
import { Hero } from '@/features/home/hero';
import { FeatureGrid } from '@/features/home/feature-grid';
import { TodaySuggestions } from '@/features/home/today-suggestions';
import { useHomeData } from '@/features/home/use-home-data';
import { useAuth } from '@/providers/auth-provider';
import { color } from '@/theme/tokens';

/**
 * Mobile Home — Phase 01's primary target. Composition order follows the CURRENT web Home
 * (apps/web/features/dashboard/components/dashboard-view.tsx) for the sections this pass covers:
 * Hero (with the Daily Flow glass panel nested inside it, matching web) → Feature Grid → Today
 * Suggestions. Articles and "mobile app promo" are deliberately descoped for this pass (see the
 * Phase 01 report) — the latter specifically makes no sense inside the mobile app itself, since on
 * web it's an ad for the (now-existing) mobile app.
 */
export default function HomeScreen() {
  const { status, user } = useAuth();
  const home = useHomeData();
  const isGuest = status !== 'authenticated';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Hero isGuest={isGuest} userName={user?.displayName ?? ''} home={home} />
        <CelestialDivider />
        <FeatureGrid />
        <TodaySuggestions />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: 40 },
});
