import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { TextField } from '@/components/text-field';
import { GoldButton } from '@/components/buttons';
import { useAuth } from '@/providers/auth-provider';
import { getAuthErrorMessage } from '@/lib/auth/error-messages';
import { color, font, fontSize, spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError('Bạn cần đồng ý với Điều khoản và Chính sách bảo mật để tiếp tục.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: email.trim(), displayName: displayName.trim(), password, confirmPassword, acceptedTerms });
      router.replace('/(auth)/verify-email-pending');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell title="Tạo tài khoản" subtitle="Bắt đầu hành trình khám phá vận mệnh cùng Mệnh Vi.">
      <TextField label="Tên hiển thị" value={displayName} onChangeText={setDisplayName} placeholder="Tên của bạn" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="ban@vidu.com"
      />
      <TextField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry placeholder="Ít nhất 8 ký tự, có số hoặc ký hiệu" />
      <TextField label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" />

      <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((v) => !v)}>
        <Ionicons name={acceptedTerms ? 'checkbox' : 'square-outline'} size={20} color={acceptedTerms ? color.gold : color.textSecondary} />
        <Text style={styles.termsText}>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
      <GoldButton label={submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'} onPress={submitting ? undefined : onSubmit} />
      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.footer}>
          Đã có tài khoản? <Text style={styles.footerLink}>Đăng nhập</Text>
        </Text>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  termsText: { flex: 1, fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, lineHeight: 19 },
  error: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.seal },
  footer: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, textAlign: 'center', marginTop: spacing.md },
  footerLink: { color: color.goldLight, fontFamily: font.bodyMedium },
});
