import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { GoldButton } from '@/components/buttons';
import { TextField } from '@/components/text-field';
import { authApi } from '@/lib/auth/auth-api';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { color, font, fontSize } from '@/theme/tokens';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!token) return setError('Liên kết đặt lại mật khẩu không hợp lệ.');
    if (password.length < 8) return setError('Mật khẩu cần có ít nhất 8 ký tự.');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận chưa khớp.');
    setSubmitting(true); setError(null);
    try {
      await authApi.resetPassword({ token, password, confirmPassword });
      setDone(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <AuthScreenShell title="Đã đặt lại mật khẩu">
      <Text style={styles.body}>Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại trên Mệnh Vi.</Text>
      <GoldButton label="Đăng nhập" onPress={() => router.replace('/(auth)/login')} />
    </AuthScreenShell>
  );

  return (
    <AuthScreenShell title="Đặt mật khẩu mới" subtitle="Chọn mật khẩu mới cho tài khoản của bạn.">
      {!token && <Text style={styles.error}>Liên kết đặt lại mật khẩu không hợp lệ.</Text>}
      <TextField label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <TextField label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
      {error && <Text style={styles.error}>{error}</Text>}
      <GoldButton label={submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'} onPress={submitting || !token ? undefined : submit} />
    </AuthScreenShell>
  );
}
const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: fontSize.bodyMd, color: color.textSecondary, lineHeight: 22 },
  error: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.seal },
});
