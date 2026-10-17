import { useCallback, useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { EarthlyBranchValue, TuViChartDto, TuViChartHistoryDto } from '@beaconvie/types';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { useAuth } from '@/providers/auth-provider';
import { color, font, spacing } from '@/theme/tokens';
import { tuViApi, type TuViStatus } from '@/features/tu-vi/tu-vi-api';

const FILTERS: TuViStatus[] = ['ACTIVE', 'ARCHIVED', 'DELETED'];
const statusText: Record<TuViStatus, string> = { ACTIVE: 'Hiện tại', ARCHIVED: 'Lưu trữ', DELETED: 'Đã xóa' };
const branches: EarthlyBranchValue[] = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Không thể kết nối máy chủ.'; }

export default function TuViScreen() {
  const { status, user, devFixture } = useAuth();
  return <TuViContent key={`${user?.id ?? 'guest'}:${status}:${devFixture}`} />;
}

function TuViContent() {
  const router = useRouter();
  const { status, devFixture } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [sex, setSex] = useState<'Nam' | 'Nữ'>('Nam');
  const [chart, setChart] = useState<TuViChartDto | null>(null);
  const [selected, setSelected] = useState<EarthlyBranchValue | null>(null);
  const [items, setItems] = useState<TuViChartDto[]>([]);
  const [filter, setFilter] = useState<TuViStatus>('ACTIVE');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState<TuViChartHistoryDto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');
  const isRealUser = status === 'authenticated' && (!__DEV__ || devFixture === 'off');

  const refresh = useCallback(async (nextFilter: TuViStatus, nextPage = 1) => {
    if (!isRealUser) return;
    setLoadingList(true);
    try {
      const result = await tuViApi.list({ status: nextFilter, page: nextPage, pageSize: 10 });
      setItems(result.items);
      setTotal(result.total);
      setPage(nextPage);
    } catch (cause) { setError(message(cause)); }
    finally { setLoadingList(false); }
  }, [isRealUser]);

  useEffect(() => {
    if (!isRealUser) return;
    let cancelled = false;
    const loadInitial = async () => {
      try {
        const result = await tuViApi.list({ status:'ACTIVE', page:1, pageSize:10 });
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
        setPage(1);
      } catch (cause) {
        if (!cancelled) setError(message(cause));
      }
    };
    void loadInitial();
    return () => { cancelled = true; };
  }, [isRealUser]);

  async function run(task: () => Promise<TuViChartDto>) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await task();
      setChart(result); setSelected(result.palaces.menh); setHistory(null);
      await refresh(filter);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }
  function calculate() {
    if (!validDate(birthDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
      setError('Nhập ngày sinh YYYY-MM-DD và giờ sinh HH:mm hợp lệ.'); return;
    }
    void run(() => tuViApi.calculate({ birthDate, birthTime, sex }));
  }
  async function open(id: string) { await run(() => tuViApi.get(id)); }
  async function loadHistory() {
    if (!chart || busy) return;
    setBusy(true); setError('');
    try { setHistory(await tuViApi.history(chart.id)); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }
  function remove() {
    if (!chart || busy) return;
    Alert.alert('Xóa lá số?', 'Bạn có thể khôi phục lá số trong mục Đã xóa.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => void run(() => tuViApi.remove(chart.id)) },
    ]);
  }
  const palace = chart && selected ? {
    role: chart.palaces.layout[selected],
    main: chart.mainStars.filter(s => s.position === selected),
    auxiliary: chart.auxiliaryStars.filter(s => s.position === selected),
    changes: chart.transformations.filter(t => t.position === selected),
  } : null;

  return <Screen><AppHeader /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>MỆNH VI · TỬ VI ĐẨU SỐ</Text>
    <Text style={styles.title}>Lập lá số Tử Vi</Text>
    <Text style={styles.muted}>Cung, sao và vận hạn được tính trên máy chủ, không suy diễn trên thiết bị.</Text>
    {!isRealUser ? <View style={styles.panel}>
      <Text style={styles.muted}>Đăng nhập bằng tài khoản thật để lập và lưu lá số.</Text>
      <Pressable onPress={() => router.push('/(auth)/login')} style={styles.button}><Text style={styles.buttonText}>Đăng nhập</Text></Pressable>
    </View> : <>
      <View style={styles.panel}>
        <Text style={styles.heading}>Thông tin sinh</Text>
        <Text style={styles.muted}>Ngày sinh dương lịch (YYYY-MM-DD)</Text>
        <TextInput accessibilityLabel="Ngày sinh" value={birthDate} onChangeText={setBirthDate} placeholder="1995-08-21" placeholderTextColor={color.textMuted} style={styles.input} keyboardType="numbers-and-punctuation" />
        <Text style={styles.muted}>Giờ sinh (HH:mm, 24 giờ)</Text>
        <TextInput accessibilityLabel="Giờ sinh" value={birthTime} onChangeText={setBirthTime} placeholder="08:30" placeholderTextColor={color.textMuted} style={styles.input} keyboardType="numbers-and-punctuation" />
        <View style={styles.row}>{(['Nam','Nữ'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: sex === value }} onPress={() => setSex(value)} style={[styles.choice,sex === value && styles.active]}><Text style={styles.text}>{value}</Text></Pressable>)}</View>
        <Pressable disabled={busy} onPress={calculate} style={styles.button}><Text style={styles.buttonText}>Lập lá số</Text></Pressable>
      </View>
      {chart && <View style={styles.panel}>
        <Text style={styles.heading}>{chart.canChi.year.stem} {chart.canChi.year.branch} · {chart.cuc}</Text>
        <Text style={styles.muted}>{chart.birthDate} · {chart.birthTime} · {chart.sex} · Giờ {chart.hourBranch}</Text>
        <Text style={styles.text}>Mệnh: {chart.palaces.menh} · Thân: {chart.palaces.than}</Text>
        <Text style={styles.muted}>Âm lịch: {chart.lunarDate.lunarDay}/{chart.lunarDate.lunarMonth}/{chart.lunarDate.lunarYear}{chart.lunarDate.isLeapMonth ? ' (nhuận)' : ''}</Text>
        <Text style={styles.muted}>Trạng thái: {statusText[chart.status]}</Text>
        <Text style={styles.heading}>Bản đồ 12 cung</Text>
        <View style={styles.grid}>{branches.map(branch => <Pressable key={branch} onPress={() => setSelected(branch)} accessibilityRole="button" accessibilityState={{ selected: selected === branch }} style={[styles.palace, selected === branch && styles.active]}>
          <Text style={styles.text}>{chart.palaces.layout[branch]}</Text><Text style={styles.muted}>{branch}</Text>
        </Pressable>)}</View>
        {palace && <View style={styles.detail}>
          <Text style={styles.heading}>Cung {palace.role} · {selected}</Text>
          <Text style={styles.text}>Chính tinh</Text>
          <Text style={styles.muted}>{palace.main.map(s => `${s.star} (${s.dignity})`).join(' · ') || 'Vô chính diệu'}</Text>
          <Text style={styles.text}>Phụ tinh</Text>
          <Text style={styles.muted}>{palace.auxiliary.map(s => s.star).join(' · ') || 'Không có phụ tinh'}</Text>
          <Text style={styles.text}>Tứ Hóa</Text>
          <Text style={styles.muted}>{palace.changes.map(t => `${t.transformation}: ${t.targetStar}`).join(' · ') || 'Không có Tứ Hóa'}</Text>
          <Text style={styles.muted}>{[chart.tuan.first,chart.tuan.second].includes(selected!) ? 'Tuần · ' : ''}{[chart.triet.first,chart.triet.second].includes(selected!) ? 'Triệt' : ''}</Text>
        </View>}
        <Text style={styles.heading}>Đại Vận</Text>
        {chart.daiVan.length ? chart.daiVan.map(cycle => <Text key={cycle.index} style={styles.muted}>{cycle.ageStart}–{cycle.ageEnd} tuổi · {cycle.role} ({cycle.position}){chart.currentDaiVan?.index === cycle.index ? ' · Hiện tại' : ''}</Text>) : <Text style={styles.muted}>Lá số cũ chưa có dữ liệu Đại Vận.</Text>}
        <Text style={styles.heading}>Tiểu Hạn</Text>
        {chart.currentTieuHan ? <Text style={styles.text}>Hiện tại: {chart.currentTieuHan.tuoi} tuổi · {chart.currentTieuHan.lunarYear} · {chart.currentTieuHan.palace}</Text> : <Text style={styles.muted}>Chưa có dữ liệu Tiểu Hạn cho lá số này.</Text>}
        {chart.nearbyTieuHan.map(cycle => <Text key={cycle.lunarYear} style={styles.muted}>{cycle.lunarYear} · {cycle.tuoi} tuổi · {cycle.palace}</Text>)}
        <Text style={styles.heading}>Luận giải</Text>
        <Text style={styles.muted}>{chart.interpretation || 'Chưa có luận giải.'}</Text>
        <View style={styles.row}>
          {!chart.interpretation && <Pressable disabled={busy} onPress={() => void run(() => tuViApi.interpret(chart.id))}><Text style={styles.link}>Tạo luận giải</Text></Pressable>}
          {chart.status === 'ACTIVE' ? <Pressable disabled={busy} onPress={() => void run(() => tuViApi.archive(chart.id))}><Text style={styles.link}>Lưu trữ</Text></Pressable> : <Pressable disabled={busy} onPress={() => void run(() => tuViApi.restore(chart.id))}><Text style={styles.link}>Khôi phục</Text></Pressable>}
          {chart.status !== 'DELETED' && <Pressable disabled={busy} onPress={remove}><Text style={styles.link}>Xóa</Text></Pressable>}
          <Pressable disabled={busy} onPress={() => void loadHistory()}><Text style={styles.link}>Lịch sử thay đổi</Text></Pressable>
        </View>
        {history?.map(entry => <Text key={entry.id} style={styles.muted}>{entry.createdAt} · {entry.action} · {entry.detail}</Text>)}
      </View>}
      <View style={styles.panel}>
        <Text style={styles.heading}>Lá số đã lưu</Text>
        <View style={styles.row}>{FILTERS.map(value => <Pressable key={value} onPress={() => {setFilter(value);void refresh(value);}}><Text style={[styles.link,filter === value && styles.text]}>{statusText[value]}</Text></Pressable>)}</View>
        {loadingList ? <ActivityIndicator color={color.gold} /> : items.length ? items.map(item => <Pressable key={item.id} onPress={() => void open(item.id)} style={styles.historyItem}><Text style={styles.text}>{item.canChi.year.stem} {item.canChi.year.branch} · {item.birthDate}</Text><Text style={styles.muted}>Xem lá số · {item.createdAt.slice(0,10)}</Text></Pressable>) : <Text style={styles.muted}>Không có lá số trong mục này.</Text>}
        <Text style={styles.muted}>Trang {page} · Tổng {total} lá số</Text>
        <View style={styles.row}><Pressable disabled={loadingList || page <= 1} onPress={() => void refresh(filter,page-1)}><Text style={styles.link}>Trang trước</Text></Pressable><Pressable disabled={loadingList || page*10 >= total} onPress={() => void refresh(filter,page+1)}><Text style={styles.link}>Trang sau</Text></Pressable></View>
      </View>
    </>}
    {busy && <ActivityIndicator accessibilityLabel="Đang xử lý lá số" color={color.gold}/>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 80, gap: spacing.lg },
  eyebrow: { color: color.gold, fontFamily: font.bodyMedium, letterSpacing: 2 },
  title: { color: color.textPrimary, fontFamily: font.display, fontSize: 28 },
  heading: { color: color.goldLight, fontFamily: font.display, fontSize: 19 },
  text: { color: color.textPrimary, fontFamily: font.bodyMedium },
  muted: { color: color.textSecondary, fontFamily: font.body, lineHeight: 21 },
  panel: { backgroundColor: color.surface, borderColor: color.borderGold, borderWidth: 1, borderRadius: 16, padding: spacing.lg, gap: spacing.md },
  input: { color: color.textPrimary, borderColor: color.borderGold, borderWidth: 1, borderRadius: 10, padding: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, alignItems: 'center' },
  choice: { padding: spacing.md, borderColor: color.borderGold, borderWidth: 1, borderRadius: 8 },
  active: { borderColor: color.gold, backgroundColor: color.surfaceElevated, borderWidth: 1 },
  button: { backgroundColor: color.gold, borderRadius: 10, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: color.bg, fontFamily: font.bodySemibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  palace: { width: '31%', minHeight: 66, padding: 8, borderWidth: 1, borderColor: color.borderGold, borderRadius: 8 },
  detail: { borderColor: color.borderGold, borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
  link: { color: color.gold, fontFamily: font.bodyMedium },
  historyItem: { borderTopWidth: 1, borderColor: color.borderSubtle, paddingTop: spacing.md, gap: 4 },
  error: { color: '#F6A59B' },
});
