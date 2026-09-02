import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/glass-panel';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { color, font, fontSize, spacing } from '@/theme/tokens';
import type { HomeDataState } from './use-home-data';

/** Port of daily-flow-panel.tsx's "Dòng chảy hôm nay" — locked teaser for guests, real
 *  loading/error/empty/ok states for authenticated users (see use-home-data.ts for why those
 *  states can only be reached via the dev fixture today). */
export function DailyFlowPanel({ isGuest, home }: { isGuest: boolean; home: HomeDataState }) {
  const router = useRouter();

  if (isGuest) {
    return (
      <GlassPanel>
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed-outline" size={14} color={color.goldLight} />
          <Text style={styles.lockLabel}>DÒNG CHẢY HÔM NAY</Text>
        </View>
        <Text style={styles.lockCopy}>Đăng nhập để mở vận trình hôm nay của bạn.</Text>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      {home.kind === 'loading' && <LoadingState label="Đang tải dòng chảy hôm nay..." />}
      {home.kind === 'error' && <ErrorState onRetry={home.retry} />}
      {home.kind === 'empty' && (
        <EmptyState
          title="Chưa có lá số"
          description="Lập lá số Tử Vi để xem dòng chảy hôm nay của bạn."
          actionLabel="Lập lá số"
          onAction={() => router.push('/(tabs)/tu-vi')}
        />
      )}
      {home.kind === 'ok' && (
        <View>
          <Text style={styles.lockLabel}>DÒNG CHẢY HÔM NAY</Text>
          <Text style={styles.okCopy}>Đại Vận hiện tại đang thuận lợi cho các quyết định dài hạn.</Text>
        </View>
      )}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  lockLabel: { fontFamily: font.bodySemibold, fontSize: 11, color: color.goldLight, letterSpacing: 0.5 },
  lockCopy: { fontFamily: font.body, fontSize: fontSize.bodySm, color: '#D8D1C2', lineHeight: 19 },
  okCopy: { fontFamily: font.body, fontSize: fontSize.bodySm, color: '#D8D1C2', lineHeight: 19, marginTop: spacing.xs },
});
