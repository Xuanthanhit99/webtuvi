import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color } from '@/theme/tokens';

/** Root screen wrapper — canvas background + safe-area edges. Scroll containers live inside
 *  individual screens (Home uses a ScrollView directly) so this stays a thin shell. */
export function Screen({ children, edges = ['top', 'left', 'right'] }: { children: ReactNode; edges?: Array<'top' | 'bottom' | 'left' | 'right'> }) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <View style={styles.root}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
