import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from 'react-native-svg';
import { ButtonRow, GoldButton, SecondaryButton } from '@/components/buttons';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';
import { HOME_BACKGROUND } from './production-assets';
import { DailyFlowPanel } from './daily-flow-panel';
import type { HomeDataState } from './use-home-data';

/**
 * Mobile Hero — matches the CURRENT web Home exactly (confirmed by reading
 * apps/web/features/dashboard/components/home/hero.tsx directly): the celestial wheel is baked
 * into the hero art itself, not a live animated component. `destiny-orbit.tsx`'s live SVG wheel
 * is used on the Tử Vi feature page and the archived /menh-vi prototype only — never on Home.
 * This Hero is architected as background-image + glow + scrim + content layers precisely so a
 * live wheel could be dropped in as one more layer later without a rebuild, if Web Home ever
 * adopts one.
 */
export function Hero({ isGuest, userName, home }: { isGuest: boolean; userName: string; home: HomeDataState }) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Image source={HOME_BACKGROUND.hero} style={StyleSheet.absoluteFill} contentFit="cover" />

      {/* Ambient glow — same intent as the web Hero's radial-gradient div: reads as part of the
          painted sky rather than a separate layer. */}
      <Svg width="100%" height="55%" style={styles.glow} pointerEvents="none">
        <Defs>
          <SvgRadialGradient id="glow" cx="60%" cy="30%" r="60%">
            <Stop offset="0%" stopColor="#F3D998" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#F3D998" stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      {/* Legibility scrim over the copy column. */}
      <LinearGradient colors={['rgba(5,8,14,0.55)', 'rgba(5,8,14,0.15)', 'rgba(5,8,14,0.05)']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        {isGuest ? (
          <>
            <Text style={styles.eyebrow}>Chào mừng bạn đến với</Text>
            <Text style={styles.title}>Mệnh Vi</Text>
          </>
        ) : (
          <>
            <Text style={styles.eyebrow}>Chào buổi sáng</Text>
            <Text style={styles.title}>{userName}</Text>
          </>
        )}
        <Text style={styles.subtitle}>
          {isGuest
            ? 'Đăng nhập để xem Dòng chảy hôm nay, lưu lá số và tiếp tục hành trình của riêng bạn.'
            : 'Mỗi ngày là một cơ hội mới để hiểu mình hơn và sống tốt hơn.'}
        </Text>
        <ButtonRow>
          <GoldButton
            label={isGuest ? 'Đăng nhập' : 'Xem vận hôm nay'}
            onPress={() => router.push(isGuest ? '/(auth)/login' : '/(tabs)/tu-vi')}
          />
          <SecondaryButton
            label={isGuest ? 'Tạo tài khoản' : 'Khám phá thêm'}
            onPress={() => router.push(isGuest ? '/(auth)/register' : '/(tabs)/discover')}
          />
        </ButtonRow>

        <View style={styles.panelSlot}>
          <DailyFlowPanel isGuest={isGuest} home={home} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 460,
    borderRadius: radius.xl,
    overflow: 'hidden',
    margin: spacing.lg,
    marginBottom: 0,
  },
  glow: { position: 'absolute', top: 0, right: 0 },
  content: { flex: 1, padding: spacing.lg, paddingTop: spacing.xxl, justifyContent: 'flex-start' },
  eyebrow: { fontFamily: font.bodyMedium, fontSize: fontSize.bodySm, color: color.goldLight },
  title: { fontFamily: font.display, fontSize: fontSize.displayLg, color: color.textPrimary, marginTop: 4 },
  subtitle: { fontFamily: font.body, fontSize: fontSize.bodySm, color: '#D8D1C2', lineHeight: 20, marginTop: 10, maxWidth: 320 },
  panelSlot: { marginTop: spacing.xl },
});
