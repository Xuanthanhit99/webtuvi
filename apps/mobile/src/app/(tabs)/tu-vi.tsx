import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TuViChartDto } from '@beaconvie/types';
import { AppHeader } from '@/components/app-header';
import { GoldButton, SecondaryButton } from '@/components/buttons';
import { MysticCard } from '@/components/mystic-card';
import { Screen } from '@/components/screen';
import { ApiError } from '@/lib/api-client';
import { discoveryError } from '@/lib/discovery-error';
import { tuViApi } from '@/features/tu-vi/api';
import { TuViChartResult } from '@/features/tu-vi/chart-result';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

const ERROR_MESSAGES: Record<string, string> = {
  TUVI_INVALID_DATE_FORMAT: 'Ngày sinh phải đúng định dạng YYYY-MM-DD.',
  TUVI_INVALID_DATE: 'Ngày sinh này không tồn tại trong dương lịch.',
  TUVI_DATE_OUT_OF_RANGE: 'Ngày sinh nằm ngoài khoảng thời gian hệ thống hỗ trợ.',
  TUVI_DATE_IN_FUTURE: 'Ngày sinh không thể ở trong tương lai.',
  TUVI_INVALID_TIME_FORMAT: 'Giờ sinh phải theo định dạng 24 giờ HH:mm.',
  TUVI_INVALID_TIME: 'Vui lòng nhập giờ sinh hợp lệ từ 00:00 đến 23:59.',
  PREMIUM_REQUIRED: 'Bạn đã dùng hết lượt miễn phí.',
  TU_VI_DAILY_LIMIT_REACHED: 'Bạn đã đạt giới hạn lập lá số hôm nay.',
};

function summary(chart: TuViChartDto) {
  const x = chart as unknown as Record<string, unknown>;
  return [
    ['Ngày sinh', String(x.birthDate ?? '—')],
    ['Giờ sinh', String(x.birthTime ?? '—')],
    ['Giới tính', String(x.sex ?? '—')],
    ['Trạng thái', String(x.interpretationStatus ?? x.status ?? 'Đã lập')],
  ];
}

export default function TuViScreen() {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [sex, setSex] = useState<'Nam' | 'Nữ'>('Nam');
  const [result, setResult] = useState<TuViChartDto | null>(null);
  const [history, setHistory] = useState<TuViChartDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function calculate() {
    if (!birthDate || !birthTime) return setError('Vui lòng nhập đầy đủ ngày sinh và giờ sinh.');
    setBusy(true); setError('');
    try {
      setResult(await tuViApi.calculate({ birthDate, birthTime, sex }));
    } catch (e) {
      setError(e instanceof ApiError ? (ERROR_MESSAGES[e.code] ?? e.message) : 'Chưa thể lập lá số lúc này.');
    } finally { setBusy(false); }
  }

  async function loadHistory() {
    setBusy(true); setError('');
    try {
      const data = await tuViApi.listCharts();
      const rows = (data as unknown as { items?: TuViChartDto[] }).items ?? [];
      setHistory(rows);
    } catch (e) { setError(e instanceof Error ? e.message : 'Chưa thể tải lá số đã lưu.'); }
    finally { setBusy(false); }
  }

  return <Screen><AppHeader /><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>TỬ VI ĐẨU SỐ</Text><Text style={s.title}>Lập lá số của bạn</Text>
    <Text style={s.copy}>Nhập ngày dương lịch, giờ sinh và giới tính. Engine trên máy chủ sẽ tự chuyển đổi và an sao; ứng dụng không tự tính lại kết quả.</Text>
    {result ? <View style={{ gap: spacing.md }}><TuViChartResult chart={result} /><SecondaryButton label="Lập lá số khác" onPress={() => setResult(null)} /></View> : <MysticCard style={s.card}>
      <Text style={s.label}>Ngày sinh dương lịch</Text><TextInput value={birthDate} onChangeText={setBirthDate} placeholder="1995-08-24" placeholderTextColor={color.textMuted} style={s.input} autoCapitalize="none" />
      <Text style={s.label}>Giờ sinh</Text><TextInput value={birthTime} onChangeText={setBirthTime} placeholder="08:30" placeholderTextColor={color.textMuted} style={s.input} keyboardType="numbers-and-punctuation" />
      <Text style={s.label}>Giới tính</Text><View style={s.sexRow}>{(['Nam','Nữ'] as const).map(v=><Pressable key={v} onPress={()=>setSex(v)} style={[s.choice,sex===v&&s.choiceOn]}><Text style={[s.choiceText,sex===v&&s.choiceTextOn]}>{v}</Text></Pressable>)}</View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {busy ? <ActivityIndicator color={color.gold} /> : <GoldButton label="Lập lá số của tôi" onPress={calculate} />}
    </MysticCard>}
    <View style={s.sectionHead}><Text style={s.cardTitle}>Lá số đã lưu</Text><SecondaryButton label="Tải lịch sử" onPress={loadHistory} /></View>
    {history.map(chart=><Pressable key={chart.id} onPress={async()=>{setBusy(true); try{setResult(await tuViApi.getChart(chart.id));}finally{setBusy(false);}}}><MysticCard style={s.history}><Text style={s.value}>Lá số {chart.id.slice(0,8)}</Text><Text style={s.muted}>Chạm để mở kết quả đã lưu</Text></MysticCard></Pressable>)}
  </ScrollView></Screen>;
}
const s=StyleSheet.create({page:{padding:spacing.lg,paddingBottom:48,gap:spacing.md},eyebrow:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:color.gold,letterSpacing:2},title:{fontFamily:font.display,fontSize:fontSize.displayMd,color:color.textPrimary},copy:{fontFamily:font.body,fontSize:fontSize.bodySm,color:color.textSecondary,lineHeight:20},card:{padding:spacing.lg,gap:spacing.md},cardTitle:{fontFamily:font.display,fontSize:fontSize.headingMd,color:color.textPrimary},label:{fontFamily:font.bodySemibold,fontSize:fontSize.bodySm,color:color.goldLight},input:{minHeight:48,borderWidth:1,borderColor:color.borderGold,borderRadius:radius.sm,paddingHorizontal:14,color:color.textPrimary,backgroundColor:color.surface,fontFamily:font.body},sexRow:{flexDirection:'row',gap:spacing.sm},choice:{flex:1,minHeight:46,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:color.borderSubtle,borderRadius:radius.sm},choiceOn:{borderColor:color.gold,backgroundColor:'rgba(213,173,98,0.10)'},choiceText:{color:color.textSecondary,fontFamily:font.bodySemibold},choiceTextOn:{color:color.goldLight},error:{color:'#E49A8F',fontFamily:font.body},row:{flexDirection:'row',justifyContent:'space-between',gap:12},muted:{color:color.textSecondary,fontFamily:font.body,fontSize:fontSize.bodySm},value:{color:color.textPrimary,fontFamily:font.bodySemibold,fontSize:fontSize.bodySm},sectionHead:{gap:spacing.sm,marginTop:spacing.sm},history:{padding:spacing.md,gap:4}});
