import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { font, radius, spacing } from '@/theme/tokens';
import { HOME_BACKGROUND } from './production-assets';

/**
 * Static fallback — same content and same caveat as
 * apps/web/features/dashboard/components/home/today-suggestions.tsx: "giờ hoàng đạo / hướng cát
 * lợi / nhật nguyệt" is real almanac content that the not-yet-built Eastern Horoscope module would
 * compute. Illustrative copy only, not fabricated live data.
 *
 * The web version's crane/lotus/lantern decor accents are `tablet:`/`desktop:`-only (hidden below
 * 768px) — i.e. the web team already decided phones don't get them. This port follows that same
 * decision rather than adding them back in.
 */
const SUGGESTIONS = [
  { icon: 'hourglass-outline' as const, label: 'Giờ hoàng đạo', lines: ['Dần (03:00–05:00)', 'Mão (05:00–07:00)', 'Tỵ (09:00–11:00)', 'Thân (15:00–17:00)'] },
  { icon: 'compass-outline' as const, label: 'Hướng cát lợi', lines: ['Hướng tốt: Đông Nam', 'Hướng tài lộc: Chính Nam'] },
  { icon: 'moon-outline' as const, label: 'Nhật nguyệt', lines: ['Ngày: Bính Thân', 'Tháng: Ất Dậu'] },
];

export function TodaySuggestions({ energyText }: { energyText?: string }) {
  return (
    <View style={styles.wrap}>
      <Image source={HOME_BACKGROUND.journeyBanner} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['rgba(5,8,16,0.6)', 'rgba(6,10,20,0.42)', 'rgba(5,8,16,0.1)']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        {SUGGESTIONS.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={styles.itemHeader}>
              <Ionicons name={item.icon} size={15} color="#E6C980" />
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            {item.lines.map((line) => (
              <Text key={line} style={styles.itemLine}>
                {line}
              </Text>
            ))}
          </View>
        ))}
        <View style={styles.item}>
          <View style={styles.itemHeader}>
            <Ionicons name="sparkles-outline" size={15} color="#E6C980" />
            <Text style={styles.itemLabel}>Năng lượng</Text>
          </View>
          <Text style={styles.itemLine}>{energyText ?? 'Năng lượng hôm nay ở mức tốt, hãy duy trì tinh thần tích cực.'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 260, borderRadius: radius.xl, overflow: 'hidden', marginHorizontal: spacing.lg, marginTop: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.lg },
  item: { gap: 6 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemLabel: { fontFamily: font.bodySemibold, fontSize: 11, color: '#E6C980', letterSpacing: 0.8, textTransform: 'uppercase' },
  itemLine: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: '#D8D1C2' },
});
