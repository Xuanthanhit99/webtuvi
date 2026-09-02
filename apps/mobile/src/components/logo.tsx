import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { color, font, fontSize } from '@/theme/tokens';

/** Port of apps/web/components/ui/logo.tsx — the brand mark is a tiny inline SVG constellation
 *  glyph (3 gold dots connected by 2 thin gold lines), not an image asset. */
export function Logo({ withWordmark = true, size = 24 }: { withWordmark?: boolean; size?: number }) {
  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Line x1="5" y1="18" x2="12" y2="6" stroke={color.gold} strokeWidth={1} strokeOpacity={0.6} />
        <Line x1="12" y1="6" x2="19" y2="15" stroke={color.gold} strokeWidth={1} strokeOpacity={0.6} />
        <Circle cx="5" cy="18" r="1.6" fill={color.gold} />
        <Circle cx="12" cy="6" r="1.6" fill={color.gold} />
        <Circle cx="19" cy="15" r="1.6" fill={color.gold} />
      </Svg>
      {withWordmark && <Text style={styles.wordmark}>Mệnh Vi</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: font.display, fontSize: fontSize.bodyLg, color: color.textPrimary },
});
