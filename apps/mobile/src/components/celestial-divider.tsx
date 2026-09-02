import { StyleSheet, View } from 'react-native';
import { color } from '@/theme/tokens';

/** A thin hairline section divider, matching the `border-t border-white/10` treatment used
 *  between Home sections on web. */
export function CelestialDivider() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: color.borderSubtle, marginVertical: 20 },
});
