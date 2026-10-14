import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { useAuth } from '@/providers/auth-provider';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';
import { tarotArtworkUri, TAROT_BACK_URI } from '@/features/tarot/tarot-artwork';
import {
  tarotApi,
  requiredCardCount,
  type TarotReading,
  type TarotSpread,
  type TarotStatus,
} from '@/features/tarot/tarot-api';

import { TarotMotion, TarotShuffle, useReducedMotion } from '@/features/tarot/tarot-motion';

const SPREADS: { type: TarotSpread; label: string; subtitle: string }[] = [
  { type: 'DAILY_DRAW', label: 'Lá bài hôm nay', subtitle: 'Một thông điệp dành cho hôm nay' },
  { type: 'SINGLE_CARD', label: 'Một lá bài', subtitle: 'Một câu hỏi, một góc nhìn' },
  { type: 'THREE_CARD', label: 'Trải ba lá', subtitle: 'Ba vị trí, một câu chuyện' },
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không thể kết nối. Vui lòng thử lại.';
}

export default function TarotScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const locked = useRef(false);
  const listRequest = useRef(0);
  const [shuffling, setShuffling] = useState(false);
  const [animateReading, setAnimateReading] = useState(false);
  const { status } = useAuth();
  const [type, setType] = useState<TarotSpread>('DAILY_DRAW');
  const [question, setQuestion] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [positions, setPositions] = useState<number[]>([]);
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [readings, setReadings] = useState<TarotReading[]>([]);
  const [history, setHistory] = useState<{
    filter: TarotStatus;
    state: 'loading' | 'ready' | 'error';
    error?: string;
  }>({ filter: 'ACTIVE', state: 'loading' });
  const [filter, setFilter] = useState<TarotStatus>('ACTIVE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadReadings = useCallback(async (nextFilter: TarotStatus) => {
    const request = ++listRequest.current;
    setHistory({ filter: nextFilter, state: 'loading' });
    try {
      const result = await tarotApi.readings(nextFilter);
      if (request !== listRequest.current) return;
      setReadings(Array.isArray(result.items) ? result.items : []);
      setHistory({ filter: nextFilter, state: 'ready' });
    } catch (cause) {
      if (request === listRequest.current)
        setHistory({ filter: nextFilter, state: 'error', error: errorMessage(cause) });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const counter = listRequest;
    if (status === 'authenticated') {
      const request = Promise.resolve().then(() => {
        if (active) return loadReadings(filter);
      });
      void request;
    }
    return () => {
      active = false;
      ++counter.current;
    };
  }, [status, filter, loadReadings]);

  const shuffle = async () => {
    if (locked.current) return;
    locked.current = true;
    setShuffling(true);
    setBusy(true);
    setError('');
    setReading(null);
    setPositions([]);
    setToken(null);
    try {
      const session = await tarotApi.selectionSession(type);
      if (!session.token) throw new Error('Không nhận được phiên xáo bài.');
      setToken(session.token);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      locked.current = false;
      setShuffling(false);
      setBusy(false);
    }
  };

  const choose = (position: number) => {
    if (locked.current || busy || !token) return;
    setPositions((current) =>
      current.includes(position)
        ? current.filter((x) => x !== position)
        : current.length < requiredCardCount(type)
          ? [...current, position]
          : current,
    );
  };

  const reveal = async () => {
    if (locked.current || !token || positions.length !== requiredCardCount(type)) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await tarotApi.draw(type, token, positions, question);
      setAnimateReading(true);
      setReading(result);
      setToken(null);
      setPositions([]);
      if (filter === 'ACTIVE') await loadReadings('ACTIVE');
      else setFilter('ACTIVE');
    } catch (cause) {
      setError(errorMessage(cause));
      // A selection token is one-use: never resubmit it after an ambiguous failure.
      setToken(null);
      setPositions([]);
    } finally {
      locked.current = false;
      setShuffling(false);
      setBusy(false);
    }
  };

  const openReading = async (id: string) => {
    if (locked.current) return;
    locked.current = true;
    setAnimateReading(false);
    setBusy(true);
    setError('');
    try {
      setReading(await tarotApi.reading(id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      locked.current = false;
      setShuffling(false);
      setBusy(false);
    }
  };

  const action = async (name: 'archive' | 'restore' | 'remove' | 'interpret', id: string) => {
    if (locked.current) return;
    locked.current = true;
    setAnimateReading(false);
    setBusy(true);
    setError('');
    try {
      const result = await tarotApi[name](id);
      setReading(result);
      await loadReadings(filter);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      locked.current = false;
      setShuffling(false);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>MỆNH VI · TAROT</Text>
        <Text style={styles.title}>Một cuộc gặp với những lá bài</Text>
        <Text style={styles.muted}>
          Chọn trải bài, xáo bộ 78 lá và tự chọn vị trí. Kết quả chỉ được tiết lộ sau khi bạn xác
          nhận.
        </Text>
        {status !== 'authenticated' ? (
          <View style={styles.panel}>
            <Text style={styles.muted}>
              Đăng nhập để rút bài và lưu lại hành trình Tarot của bạn.
            </Text>
            <Pressable style={styles.primary} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.primaryText}>Đăng nhập</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.section}>Chọn kiểu trải bài</Text>
              {SPREADS.map((spread) => (
                <Pressable
                  key={spread.type}
                  disabled={busy}
                  style={[styles.option, type === spread.type && styles.selected]}
                  onPress={() => {
                    setType(spread.type);
                    setToken(null);
                    setPositions([]);
                    setReading(null);
                  }}
                >
                  <Text style={styles.optionTitle}>{spread.label}</Text>
                  <Text style={styles.muted}>{spread.subtitle}</Text>
                </Pressable>
              ))}
              <TextInput
                style={styles.input}
                value={question}
                onChangeText={setQuestion}
                maxLength={500}
                placeholder="Điều bạn muốn hỏi (không bắt buộc)"
                placeholderTextColor={color.textMuted}
                multiline
              />
              <Pressable style={styles.primary} disabled={busy} onPress={() => void shuffle()}>
                <Text style={styles.primaryText}>{token ? 'Xáo lại 78 lá' : 'Xáo bài'}</Text>
              </Pressable>
              {shuffling && <TarotShuffle reduced={reducedMotion} />}
              {token && (
                <>
                  <Text style={styles.section}>
                    Chọn {requiredCardCount(type)} vị trí ({positions.length}/
                    {requiredCardCount(type)})
                  </Text>
                  <View style={styles.deck}>
                    {Array.from({ length: 78 }, (_, index) => (
                      <TarotMotion
                        key={index}
                        mode="select"
                        selected={positions.includes(index)}
                        reduced={reducedMotion}
                      >
                        <Pressable
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel={`Lá úp vị trí ${index + 1}`}
                          accessibilityState={{ selected: positions.includes(index) }}
                          style={[styles.cardBack, positions.includes(index) && styles.chosen]}
                          onPress={() => choose(index)}
                        >
                          <Image
                            source={{ uri: TAROT_BACK_URI }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                          {positions.includes(index) && <Text style={styles.selectionMark}>✦</Text>}
                        </Pressable>
                      </TarotMotion>
                    ))}
                  </View>
                  <Pressable
                    style={[
                      styles.primary,
                      positions.length !== requiredCardCount(type) && styles.disabled,
                    ]}
                    disabled={busy || positions.length !== requiredCardCount(type)}
                    onPress={() => void reveal()}
                  >
                    <Text style={styles.primaryText}>Lật bài và nhận luận giải</Text>
                  </Pressable>
                </>
              )}
            </View>
            {reading && (
              <View style={styles.panel}>
                <Text style={styles.section}>Kết quả trải bài</Text>
                {reading.cards.map((entry, index) => (
                  <TarotMotion
                    key={`${reading.id}-${entry.position}-${entry.card.slug ?? entry.card.id}`}
                    mode="reveal"
                    index={index}
                    reduced={reducedMotion || !animateReading}
                  >
                    <View style={styles.historyItem}>
                      {tarotArtworkUri(entry.card) && (
                        <Image
                          source={{ uri: tarotArtworkUri(entry.card)! }}
                          style={[styles.revealedImage, entry.isReversed && styles.reversedImage]}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.optionTitle}>
                        {entry.positionLabel || `Lá ${entry.position + 1}`} ·{' '}
                        {entry.card.nameVi || entry.card.name}
                      </Text>
                      <Text style={styles.muted}>{entry.isReversed ? 'Ngược' : 'Xuôi'}</Text>
                    </View>
                  </TarotMotion>
                ))}
                <TarotMotion
                  key={`${reading.id}-interpretation`}
                  mode="reveal"
                  cardFace={false}
                  index={Math.max(0, reading.cards.length - 1)}
                  reduced={reducedMotion || !animateReading}
                >
                  <Text style={styles.result}>
                    {reading.interpretation || 'Luận giải đang được xử lý.'}
                  </Text>
                </TarotMotion>
                <View style={styles.actions}>
                  {!reading.interpretation && (
                    <Pressable onPress={() => void action('interpret', reading.id)}>
                      <Text style={styles.link}>Luận giải lại</Text>
                    </Pressable>
                  )}
                  {reading.status === 'ARCHIVED' || reading.status === 'DELETED' ? (
                    <Pressable onPress={() => void action('restore', reading.id)}>
                      <Text style={styles.link}>Khôi phục</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => void action('archive', reading.id)}>
                      <Text style={styles.link}>Lưu trữ</Text>
                    </Pressable>
                  )}
                  {reading.status !== 'DELETED' && (
                    <Pressable
                      onPress={() =>
                        Alert.alert('Xóa trải bài?', 'Bạn có thể khôi phục sau.', [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Xóa',
                            style: 'destructive',
                            onPress: () => void action('remove', reading.id),
                          },
                        ])
                      }
                    >
                      <Text style={styles.link}>Xóa</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            <View style={styles.panel}>
              <Text style={styles.section}>Lịch sử Tarot</Text>
              <View style={styles.actions}>
                {(['ACTIVE', 'ARCHIVED', 'DELETED'] as const).map((value) => (
                  <Pressable
                    key={value}
                    disabled={busy}
                    onPress={() => {
                      setError('');
                      setFilter(value);
                    }}
                  >
                    <Text style={[styles.link, filter === value && styles.active]}>
                      {value === 'ACTIVE'
                        ? 'Hiện tại'
                        : value === 'ARCHIVED'
                          ? 'Lưu trữ'
                          : 'Đã xóa'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {(history.filter !== filter || history.state === 'loading') && (
                <ActivityIndicator accessibilityLabel="Đang tải lịch sử Tarot" color={color.gold} />
              )}
              {history.filter === filter && history.state === 'error' && (
                <View>
                  <Text accessibilityRole="alert" style={styles.error}>
                    {history.error}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={() => void loadReadings(filter)}>
                    <Text style={styles.link}>Thử lại lịch sử</Text>
                  </Pressable>
                </View>
              )}
              {history.filter === filter && history.state === 'ready' && readings.length === 0 && (
                <Text style={styles.muted}>Chưa có trải bài trong mục này.</Text>
              )}
              {history.filter === filter &&
                history.state === 'ready' &&
                readings.map((item) => (
                  <Pressable
                    key={item.id}
                    testID={`tarot-history-${item.id}`}
                    style={styles.historyItem}
                    onPress={() => void openReading(item.id)}
                  >
                    <Text style={styles.optionTitle}>
                      {SPREADS.find((s) => s.type === item.type)?.label ?? 'Trải bài Tarot'}
                    </Text>
                    <Text style={styles.muted}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                        : 'Xem trải bài'}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </>
        )}
        {busy && <ActivityIndicator color={color.gold} accessibilityLabel="Đang xử lý" />}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 60, gap: spacing.lg },
  eyebrow: { color: color.gold, fontFamily: font.bodyMedium, letterSpacing: 3, fontSize: 11 },
  title: { color: color.textPrimary, fontFamily: font.display, fontSize: fontSize.displayMd },
  muted: {
    color: color.textSecondary,
    fontFamily: font.body,
    fontSize: fontSize.bodySm,
    lineHeight: 20,
  },
  panel: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: color.borderGold,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    gap: spacing.md,
  },
  section: { color: color.goldLight, fontFamily: font.display, fontSize: fontSize.headingMd },
  option: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    borderRadius: radius.md,
    gap: 3,
  },
  selected: { borderColor: color.gold, backgroundColor: color.surfaceElevated },
  optionTitle: {
    color: color.textPrimary,
    fontFamily: font.bodySemibold,
    fontSize: fontSize.bodyMd,
  },
  input: {
    borderWidth: 1,
    borderColor: color.borderGold,
    borderRadius: radius.md,
    padding: spacing.md,
    color: color.textPrimary,
    minHeight: 54,
    fontFamily: font.body,
  },
  primary: {
    backgroundColor: color.gold,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryText: { color: color.bg, fontFamily: font.bodySemibold, fontSize: fontSize.bodyMd },
  disabled: { opacity: 0.4 },
  deck: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  cardBack: {
    width: 30,
    height: 46,
    borderWidth: 1,
    borderColor: color.goldMuted,
    borderRadius: 4,
    backgroundColor: '#17112A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chosen: { borderColor: color.goldLight, backgroundColor: '#57416B' },
  cardImage: { width: '100%', height: '100%', borderRadius: 3 },
  selectionMark: {
    position: 'absolute',
    color: color.goldLight,
    fontSize: 20,
    backgroundColor: 'rgba(7,11,18,0.8)',
  },
  revealedImage: { width: 130, height: 210, alignSelf: 'center' },
  reversedImage: { transform: [{ rotate: '180deg' }] },
  result: {
    color: color.textPrimary,
    fontFamily: font.body,
    fontSize: fontSize.bodyMd,
    lineHeight: 24,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  link: { color: color.textSecondary, fontFamily: font.bodyMedium },
  active: { color: color.goldLight },
  historyItem: {
    borderTopWidth: 1,
    borderColor: color.borderSubtle,
    paddingTop: spacing.md,
    gap: 4,
  },
  error: { color: '#F6A59B', fontFamily: font.body },
});
