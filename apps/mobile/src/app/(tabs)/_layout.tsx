import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { color, font } from '@/theme/tokens';

/**
 * Bottom tab bar — the 5 destinations read directly from
 * apps/web/components/layout/nav-items.ts and the web app's own phone-width nav
 * (apps/web/components/layout/mobile-navigation.tsx filters NAV_ITEMS to exactly this set: Hôm
 * nay, Lá số Tử Vi, Tarot, Khám phá, Cài đặt→"Tôi" at phone width). Uses the standard `Tabs`
 * navigator (JS-rendered, styleable, works in Expo web) rather than the scaffold template's
 * `expo-router/unstable-native-tabs` — that API delegates to native OS tab-bar rendering with a
 * much thinner styling surface, doesn't render meaningfully in the web preview this environment
 * relies on for verification, and is explicitly marked unstable.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.gold,
        tabBarInactiveTintColor: color.textSecondary,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.borderSubtle,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontFamily: font.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Hôm nay', tabBarIcon: ({ color: c, size }) => <Ionicons name="home-outline" size={size} color={c} /> }}
      />
      <Tabs.Screen
        name="tu-vi"
        options={{ title: 'Lá số Tử Vi', tabBarIcon: ({ color: c, size }) => <Ionicons name="reader-outline" size={size} color={c} /> }}
      />
      <Tabs.Screen
        name="tarot"
        options={{ title: 'Tarot', tabBarIcon: ({ color: c, size }) => <Ionicons name="sparkles-outline" size={size} color={c} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Khám phá', tabBarIcon: ({ color: c, size }) => <Ionicons name="compass-outline" size={size} color={c} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Tôi', tabBarIcon: ({ color: c, size }) => <Ionicons name="settings-outline" size={size} color={c} /> }}
      />
    </Tabs>
  );
}
