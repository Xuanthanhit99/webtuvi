import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { GoldButton } from '@/components/buttons';
import { authApi } from '@/lib/auth/auth-api';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { color, font, fontSize } from '@/theme/tokens';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Đang xác minh email...' : 'Liên kết xác minh email không hợp lệ.');

  useEffect(() => {
    if (!token) return;
    let active = true;
    authApi.verifyEmail(token)
      .then(() => { if (active) { setStatus('success'); setMessage('Email của bạn đã được xác minh.'); } })
      .catch((err) => { if (active) { setStatus('error'); setMessage(getAuthErrorMessage(err)); } });
    return () => { active = false; };
  }, [token]);

  return (
    <AuthScreenShell title="Xác minh email">
      <Text style={status === 'error' ? styles.error : styles.body}>{message}</Text>
      {status !== 'loading' && <GoldButton label={status === 'success' ? 'Về Mệnh Vi' : 'Đăng nhập'} onPress={() => router.replace(status === 'success' ? '/(tabs)' : '/(auth)/login')} />}
    </AuthScreenShell>
  );
}
const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: fontSize.bodyMd, color: color.textSecondary, lineHeight: 22 },
  error: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.seal },
});
