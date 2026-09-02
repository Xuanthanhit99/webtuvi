import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { GoldButton, SecondaryButton, ButtonRow } from '@/components/buttons';
import { useAuth } from '@/providers/auth-provider';
import { authApi } from '@/lib/auth/auth-api';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { color, font, fontSize, spacing } from '@/theme/tokens';

/**
 * Informational, not a gate — apps/api/src/auth/auth.service.ts's login() never checks
 * emailVerifiedAt, so this screen doesn't block anything the backend doesn't also allow. It's a
 * nudge shown right after register, and reachable again from Settings while unverified.
 */
export default function VerifyEmailPendingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    if (!user?.email) return;
    try {
      await authApi.resendVerification(user.email);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <AuthScreenShell title="Xác thực email của bạn">
      <Ionicons name="mail-outline" size={28} color={color.goldMuted} />
      <Text style={styles.body}>
        Chúng tôi đã gửi một liên kết xác thực đến {user?.email ?? 'email của bạn'}. Nhấn vào liên kết đó để hoàn tất xác thực — bạn vẫn có thể
        tiếp tục sử dụng Mệnh Vi trong lúc chờ.
      </Text>
      {status === 'sent' && <Text style={styles.success}>Đã gửi lại liên kết xác thực.</Text>}
      {status === 'error' && error && <Text style={styles.error}>{error}</Text>}
      <ButtonRow>
        <SecondaryButton label="Gửi lại liên kết" onPress={resend} />
        <GoldButton label="Về Hôm nay" onPress={() => router.replace('/(tabs)')} />
      </ButtonRow>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: fontSize.bodyMd, color: color.textSecondary, lineHeight: 22, marginTop: spacing.sm },
  success: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.jade },
  error: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.seal },
});
