import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { color, font, fontSize, spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy' }} />
      <View style={styles.wrap}>
        <Text style={styles.title}>Không tìm thấy màn hình này.</Text>
        <Link href="/(tabs)" style={styles.link}>
          Về Hôm nay
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: color.bg, padding: spacing.xl },
  title: { fontFamily: font.display, fontSize: fontSize.headingMd, color: color.textPrimary },
  link: { fontFamily: font.bodyMedium, fontSize: fontSize.bodySm, color: color.gold },
});
