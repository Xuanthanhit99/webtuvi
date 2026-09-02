import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

/** New primitive this phase — Phase 01's Home had no forms. Same card/border/radius language as
 *  MysticCard, not a new visual style. */
export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={color.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontFamily: font.bodyMedium, fontSize: fontSize.bodySm, color: color.textSecondary },
  input: {
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    backgroundColor: color.surface,
    paddingHorizontal: spacing.md,
    color: color.textPrimary,
    fontFamily: font.body,
    fontSize: fontSize.bodyMd,
  },
  inputError: { borderColor: color.seal },
  error: { fontFamily: font.body, fontSize: fontSize.caption, color: color.seal },
});
