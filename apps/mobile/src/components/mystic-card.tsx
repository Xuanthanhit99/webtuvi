import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { color, radius } from '@/theme/tokens';

/** Base card shell — port of Discovery/Home card treatment: dark navy fill, thin border,
 *  generous radius (apps/web/.../home/feature-grid.tsx: `rounded-[18px] border border-white/10
 *  bg-[#0c1420]`). */
export function MysticCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    overflow: 'hidden',
  },
});
