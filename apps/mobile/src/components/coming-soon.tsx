import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from './app-header';
import { Screen } from './screen';
import { color, font, fontSize, spacing } from '@/theme/tokens';

/**
 * Honest placeholder for tabs out of Phase 01's scope (Home only — see the Phase 01 plan). No
 * fake data, no partial feature — just a clear "not built yet" state, per the task's own rule
 * against pretending features are complete.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Screen>
      <AppHeader />
      <View style={styles.wrap}>
        <Ionicons name="hourglass-outline" size={28} color={color.goldMuted} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontFamily: font.display, fontSize: fontSize.headingMd, color: color.textPrimary },
  description: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, textAlign: 'center', maxWidth: 280 },
});
