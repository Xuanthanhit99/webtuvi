import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { TextField } from '@/components/text-field';
import { GoldButton } from '@/components/buttons';
import { authApi } from '@/lib/auth/auth-api';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { color, font, fontSize } from '@/theme/tokens';

/** Enumeration-safe on the backend (apps/api/src/auth/auth.controller.ts's forgotPassword always
 *  returns the same message) — this screen shows that same message unconditionally on success,
 *  never revealing whether the email has an account. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthScreenShell title="Kiểm tra email của bạn">
        <Text style={styles.body}>Nếu email này có tài khoản, chúng tôi đã gửi một liên kết để đặt lại mật khẩu.</Text>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell title="Quên mật khẩu" subtitle="Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="ban@vidu.com"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <GoldButton label={submitting ? 'Đang gửi...' : 'Gửi liên kết'} onPress={submitting ? undefined : onSubmit} />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: fontSize.bodyMd, color: color.textSecondary, lineHeight: 22 },
  error: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.seal },
});
