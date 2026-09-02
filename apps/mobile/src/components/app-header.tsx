import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Logo } from './logo';
import { color } from '@/theme/tokens';

/** Phone-only top bar — port of apps/web/components/layout/app-header.tsx's phone breakpoint
 *  (wordmark fallback, since the sidebar that normally owns the logo doesn't exist on mobile).
 *  The bell/profile icons are inert placeholders in Phase 01 — notifications and profile menu
 *  are out of scope for this pass (Phase 01 targets Home only). */
export function AppHeader() {
  return (
    <View style={styles.header}>
      <Logo />
      <View style={styles.actions}>
        <Ionicons name="notifications-outline" size={20} color={color.textSecondary} />
        <View style={styles.avatar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.borderSubtle,
    backgroundColor: color.bg,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.surfaceElevated,
    borderWidth: 1,
    borderColor: color.borderGold,
  },
});
