import { Stack } from 'expo-router'; import { color } from '@/theme/tokens';
export default function DiscoverLayout(){return <Stack screenOptions={{headerStyle:{backgroundColor:color.surface},headerTintColor:color.textPrimary,contentStyle:{backgroundColor:color.bg}}}/>;}
