import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { MysticCard } from '@/components/mystic-card';
import { Screen } from '@/components/screen';
import { ButtonRow, GoldButton, SecondaryButton } from '@/components/buttons';
import { useAuth, type DevFixture } from '@/providers/auth-provider';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

const FIXTURES: Array<{ key: DevFixture; label: string }> = [
  { key: 'off', label: 'Khách (thật)' },
  { key: 'authenticated-loading', label: 'Đã đăng nhập — Đang tải' },
  { key: 'authenticated-ok', label: 'Đã đăng nhập — Có dữ liệu' },
  { key: 'authenticated-empty', label: 'Đã đăng nhập — Chưa có lá số' },
  { key: 'authenticated-error', label: 'Đã đăng nhập — Lỗi tải dữ liệu' },
];

/** "Tôi" tab — Phase 02: real account state, wired to AuthProvider's real bootstrap/login/logout
 *  (see providers/auth-provider.tsx). The dev-fixture switcher below is unchanged from Phase 01,
 *  compiled out of production builds, and only ever overrides what's *rendered* — it never touches
 *  this screen's real login/logout actions. */
export default function SettingsScreen() {
  const router = useRouter();
  const { status, user, devFixture, setDevFixture, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <MysticCard style={styles.card}>
          <Text style={styles.title}>Tài khoản</Text>
          {status === 'guest' ? (
            <>
              <Text style={styles.body}>Đăng nhập để lưu lá số, xem Dòng chảy hôm nay và tiếp tục hành trình của riêng bạn.</Text>
              <ButtonRow>
                <GoldButton label="Đăng nhập" onPress={() => router.push('/(auth)/login')} />
                <SecondaryButton label="Tạo tài khoản" onPress={() => router.push('/(auth)/register')} />
              </ButtonRow>
            </>
          ) : (
            <>
              <Text style={styles.name}>{user?.displayName}</Text>
              <Text style={styles.body}>{user?.email}</Text>
              {!user?.emailVerifiedAt && (
                <Pressable onPress={() => router.push('/(auth)/verify-email-pending')}>
                  <Text style={styles.warning}>Email chưa được xác thực — nhấn để xác thực ngay.</Text>
                </Pressable>
              )}
              <SecondaryButton label={loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'} onPress={loggingOut ? undefined : onLogout} />
            </>
          )}
        </MysticCard>

        {__DEV__ && (
          <MysticCard style={styles.card}>
            <Text style={styles.title}>Xem trước trạng thái (chỉ dev)</Text>
            <Text style={styles.body}>Chuyển đổi để xem các trạng thái Home mà không cần backend thật.</Text>
            <View style={styles.fixtureList}>
              {FIXTURES.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setDevFixture(f.key)}
                  style={[styles.fixtureRow, devFixture === f.key && styles.fixtureRowActive]}
                >
                  <Text style={[styles.fixtureLabel, devFixture === f.key && styles.fixtureLabelActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </MysticCard>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.sm },
  title: { fontFamily: font.display, fontSize: fontSize.headingMd, color: color.textPrimary },
  name: { fontFamily: font.display, fontSize: fontSize.bodyLg, color: color.textPrimary },
  body: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, lineHeight: 19 },
  warning: { fontFamily: font.bodyMedium, fontSize: fontSize.bodySm, color: color.gold },
  fixtureList: { gap: spacing.xs, marginTop: spacing.sm },
  fixtureRow: { paddingVertical: 10, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: color.surface },
  fixtureRowActive: { backgroundColor: 'rgba(213,173,98,0.14)', borderWidth: 1, borderColor: color.borderGold },
  fixtureLabel: { fontFamily: font.bodyMedium, fontSize: fontSize.bodySm, color: color.textSecondary },
  fixtureLabelActive: { color: color.goldLight },
});
