import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
}

/** Primary CTA — port of the Hero's gold button (`bg-[#d5ad62] ... hover:bg-[#e6c980]`; RN has no
 *  hover, so press state uses opacity instead). */
export function GoldButton({ label, onPress, icon }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.gold, pressed && styles.pressed]}>
      {icon}
      <Text style={styles.goldLabel}>{label}</Text>
    </Pressable>
  );
}

/** Secondary CTA — port of the Hero's outlined gold button. */
export function SecondaryButton({ label, onPress, icon }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
      {icon}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const base: import('react-native').ViewStyle = {
  minHeight: 44,
  paddingHorizontal: 20,
  borderRadius: radius.sm,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const styles = StyleSheet.create({
  gold: { ...base, backgroundColor: color.gold },
  goldLabel: { fontFamily: font.bodySemibold, fontSize: fontSize.bodySm, color: '#070B12' },
  secondary: {
    ...base,
    backgroundColor: 'rgba(11,18,32,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(213,173,98,0.35)',
  },
  secondaryLabel: { fontFamily: font.bodySemibold, fontSize: fontSize.bodySm, color: color.goldLight },
  pressed: { opacity: 0.85 },
});

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>{children}</View>;
}
