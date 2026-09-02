import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, fontSize, radius } from '@/theme/tokens';
import type { DiscoveryModuleKey } from '@/features/home/production-assets';

interface FeatureCardProps {
  moduleKey: DiscoveryModuleKey;
  title: string;
  description: string;
  image: ImageSource;
  badge: ImageSource;
  onPress?: () => void;
}

/** Port of feature-grid.tsx's Discovery module card. The web version tints the photo with a
 *  `mix-blend-soft-light` gradient per module (no RN blend-mode support) — approximated here with
 *  a plain semi-opaque color wash (`color.moduleTint`) instead of replicating the blend math. */
export function FeatureCard({ moduleKey, title, description, image, badge, onPress }: FeatureCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.artWrap}>
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color.moduleTint[moduleKey] }]} />
        <LinearGradient colors={['transparent', color.cardBg]} style={styles.fade} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Image source={badge} style={styles.badge} contentFit="contain" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>Khám phá</Text>
          <Ionicons name="arrow-up-outline" size={12} color={color.gold} style={{ transform: [{ rotate: '45deg' }] }} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    backgroundColor: color.cardBg,
    overflow: 'hidden',
    height: 200,
  },
  pressed: { opacity: 0.9 },
  artWrap: { height: '58%', width: '100%' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  body: { flex: 1, padding: 10, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { width: 16, height: 16 },
  title: { fontFamily: font.display, fontSize: fontSize.bodySm, color: color.textPrimary, flexShrink: 1 },
  description: { fontFamily: font.body, fontSize: 11, lineHeight: 15, color: color.textSecondary },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cta: { fontFamily: font.bodyMedium, fontSize: 11, color: color.gold },
});
