import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GoldButton } from './buttons';
import { color, font, fontSize, spacing } from '@/theme/tokens';

export function LoadingState({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={color.gold} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="sparkles-outline" size={22} color={color.goldMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.label}>{description}</Text>
      {actionLabel && onAction && <GoldButton label={actionLabel} onPress={onAction} />}
    </View>
  );
}

export function ErrorState({ description = 'Có lỗi xảy ra. Vui lòng thử lại.', onRetry }: { description?: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="alert-circle-outline" size={22} color={color.seal} />
      <Text style={styles.label}>{description}</Text>
      {onRetry && <GoldButton label="Thử lại" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  title: { fontFamily: font.display, fontSize: fontSize.bodyLg, color: color.textPrimary },
  label: { fontFamily: font.body, fontSize: fontSize.bodySm, color: color.textSecondary, textAlign: 'center' },
});
