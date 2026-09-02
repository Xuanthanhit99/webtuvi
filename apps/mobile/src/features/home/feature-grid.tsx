import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from '@/components/feature-card';
import { font, fontSize, spacing } from '@/theme/tokens';
import { FEATURE_ART_ASSET, FEATURE_BADGE_ASSET, type DiscoveryModuleKey } from './production-assets';

/** Port of feature-grid.tsx's 4 Discovery module cards — 2-column on mobile (the web grid is
 *  already 2-up below `desktop:`, so this matches the web's own small-viewport layout, not a
 *  desktop grid squeezed down). Copy/hrefs read directly from
 *  apps/web/features/dashboard/components/home/feature-grid.tsx's guest fallback strings, not
 *  invented — real chart-derived descriptions require the authenticated data this pass can't
 *  reach yet (see use-home-data.ts). */
const MODULES: Array<{ key: DiscoveryModuleKey; title: string; description: string; href: '/(tabs)/tu-vi' | '/(tabs)/tarot' | '/(tabs)/discover' }> = [
  { key: 'tu_vi', title: 'Lá số Tử Vi', description: 'Bản đồ vận mệnh theo Tử Vi Đẩu Số.', href: '/(tabs)/tu-vi' },
  { key: 'tarot', title: 'Tarot', description: 'Một lá bài cho câu hỏi của bạn.', href: '/(tabs)/tarot' },
  { key: 'natal_chart', title: 'Bản đồ sao', description: 'Cần ngày, giờ và nơi sinh để lập bản đồ.', href: '/(tabs)/discover' },
  { key: 'numerology', title: 'Thần số học', description: 'Các con số cốt lõi từ tên và ngày sinh.', href: '/(tabs)/discover' },
];

export function FeatureGrid() {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Khám phá vận mệnh</Text>
      <View style={styles.grid}>
        {MODULES.map((mod) => (
          <View key={mod.key} style={styles.cell}>
            <FeatureCard
              moduleKey={mod.key}
              title={mod.title}
              description={mod.description}
              image={FEATURE_ART_ASSET[mod.key]}
              badge={FEATURE_BADGE_ASSET[mod.key]}
              onPress={() => router.push(mod.href)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  heading: { fontFamily: font.display, fontSize: fontSize.headingMd, marginBottom: spacing.md, color: '#F2EEE5' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47%' },
});
