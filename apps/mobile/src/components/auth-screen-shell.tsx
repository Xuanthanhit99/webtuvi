import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Logo } from './logo';
import { Screen } from './screen';
import { color, font, fontSize, spacing } from '@/theme/tokens';

/** Shared shell for the 4 (auth) screens — same Screen/Logo/tokens as everywhere else, no new
 *  visual style. Presented as a modal (see app/_layout.tsx), so it owns its own close affordance
 *  rather than relying on native stack chrome. */
export function AuthScreenShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Logo withWordmark={false} />
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Đóng">
              <Ionicons name="close" size={22} color={color.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.display, fontSize: fontSize.displayMd, color: color.textPrimary, marginTop: spacing.md },
  subtitle: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, lineHeight: 20 },
  body: { gap: spacing.md, marginTop: spacing.sm },
});
