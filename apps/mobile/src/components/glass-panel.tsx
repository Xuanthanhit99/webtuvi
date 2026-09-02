import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, shadow } from '@/theme/tokens';

/** Port of daily-flow-panel.tsx's `PANEL_SHELL` — a translucent glass card meant to read as part
 *  of the Hero scene behind it, not an opaque card. CSS `backdrop-blur-xl` has no RN equivalent;
 *  `expo-blur`'s BlurView is the substitute (the #1 "no direct primitive" flag from the design
 *  audit). `intensity` is tuned down from the default because the hero art behind it is already
 *  fairly dark — a heavy blur here just muddies it. */
export function GlassPanel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(213,173,98,0.09)',
    overflow: 'hidden',
    ...shadow.glass,
  },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(14,23,38,0.22)' },
  content: { padding: 16 },
});
