import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { TextField } from '@/components/text-field';
import { GoldButton } from '@/components/buttons';
import { useAuth } from '@/providers/auth-provider';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { color, font, fontSize, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.back();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell title="Đăng nhập" subtitle="Tiếp tục hành trình khám phá vận mệnh của bạn.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="ban@vidu.com"
      />
      <TextField
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="••••••••"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <GoldButton label={submitting ? 'Đang đăng nhập...' : 'Đăng nhập'} onPress={submitting ? undefined : onSubmit} />
      <Link href="/(auth)/forgot-password" replace style={styles.link}>
        Quên mật khẩu?
      </Link>
      <Pressable onPress={() => router.replace('/(auth)/register')}>
        <Text style={styles.footer}>
          Chưa có tài khoản? <Text style={styles.footerLink}>Tạo tài khoản</Text>
        </Text>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  error: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.seal },
  link: { fontFamily: font.bodyMedium, fontSize: fontSize.bodySm, color: color.gold, textAlign: 'center', marginTop: spacing.xs },
  footer: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, textAlign: 'center', marginTop: spacing.md },
  footerLink: { color: color.goldLight, fontFamily: font.bodyMedium },
});
