import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { GeocodingSearchResultDto, NatalChartDto, NumerologyReadingDto } from '@beaconvie/types';
import { AppHeader } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { useAuth } from '@/providers/auth-provider';
import { natalChartApi } from '@/features/natal-chart/natal-chart-api';
import { numerologyApi } from '@/features/numerology/numerology-api';
import { color, font, spacing } from '@/theme/tokens';

type Mode = 'natal' | 'numbers';
type Status = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
const statuses: Status[] = ['ACTIVE','ARCHIVED','DELETED'];
const statusLabels: Record<Status,string> = { ACTIVE:'Hiện tại', ARCHIVED:'Lưu trữ', DELETED:'Đã xóa' };
function errorText(e: unknown) { return e instanceof Error ? e.message : 'Không thể kết nối máy chủ.'; }
function validDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y,m,d] = v.split('-').map(Number);
  const t = new Date(Date.UTC(y,m-1,d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m-1 && t.getUTCDate() === d;
}
const sectionNames: Record<string,string> = {
  overview:'Tổng quan',corePersonality:'Tính cách cốt lõi',emotionalWorld:'Cảm xúc',
  communication:'Giao tiếp',loveAndRelationships:'Tình yêu và các mối quan hệ',
  motivation:'Động lực',careerDirection:'Sự nghiệp',strengths:'Điểm mạnh',
  challenges:'Thử thách',keyAspects:'Góc chiếu nổi bật',
};
export default function DiscoverScreen() {
  const { status, user, devFixture } = useAuth();
  return <DiscoverContent key={`${user?.id ?? 'guest'}:${status}:${devFixture}`} />;
}

function DiscoverContent() {
  const router = useRouter();
  const { status, devFixture } = useAuth();
  const allowed = status === 'authenticated' && (!__DEV__ || devFixture === 'off');
  const [mode,setMode] = useState<Mode>('natal');
  const [date,setDate] = useState('');
  const [time,setTime] = useState('');
  const [timeKnown,setTimeKnown] = useState(false);
  const [name,setName] = useState('');
  const [placeQuery,setPlaceQuery] = useState('');
  const [locations,setLocations] = useState<GeocodingSearchResultDto[]>([]);
  const [location,setLocation] = useState<GeocodingSearchResultDto|null>(null);
  const [natal,setNatal] = useState<NatalChartDto|null>(null);
  const [numbers,setNumbers] = useState<NumerologyReadingDto|null>(null);
  const [filter,setFilter] = useState<Status>('ACTIVE');
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);
  const [items,setItems] = useState<Array<{id:string;title:string;date:string}>>([]);
  const [history,setHistory] = useState<Array<{id:string;action:string;detail:string;createdAt:string}>|null>(null);
  const [busy,setBusy] = useState(false);
  const [loadingList,setLoadingList] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');

  const refresh = useCallback(async (nextFilter: Status, nextPage=1) => {
    if (!allowed) return;
    setLoadingList(true);
    try {
      if (mode === 'natal') {
        const data = await natalChartApi.list({status:nextFilter,page:nextPage,pageSize:10});
        setItems(data.items.map(c => ({id:c.id,title:c.birthPlaceLabel,date:c.birthDate})));
        setTotal(data.total);
      } else {
        const data = await numerologyApi.list({status:nextFilter,page:nextPage,pageSize:10});
        setItems(data.items.map(c => ({id:c.id,title:c.birthNameInput,date:c.birthDate})));
        setTotal(data.total);
      }
      setPage(nextPage);
    } catch (e) { setError(errorText(e)); }
    finally { setLoadingList(false); }
  },[allowed,mode]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    const loadInitial = async () => {
      try {
        const data = mode === 'natal'
          ? await natalChartApi.list({status:'ACTIVE',page:1,pageSize:10})
          : await numerologyApi.list({status:'ACTIVE',page:1,pageSize:10});
        if (cancelled) return;
        setItems(data.items.map(c => ({
          id:c.id,
          title:'birthPlaceLabel' in c ? c.birthPlaceLabel : c.birthNameInput,
          date:c.birthDate,
        })));
        setTotal(data.total);
        setPage(1);
      } catch (cause) {
        if (!cancelled) setError(errorText(cause));
      }
    };
    void loadInitial();
    return () => { cancelled = true; };
  },[allowed,mode]);

  async function action(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);setError('');setNotice('');
    try { await task(); } catch(e) {setError(errorText(e));}
    finally {setBusy(false);}
  }
  function changeMode(nextMode: Mode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setNatal(null); setNumbers(null); setHistory(null);
    setItems([]); setTotal(0); setPage(1); setFilter('ACTIVE');
    setError(''); setNotice('');
  }
  function calculate() {
    if (!validDate(date)) {setError('Ngày sinh phải có dạng YYYY-MM-DD hợp lệ.');return;}
    if (mode === 'natal') {
      if (!location) {setError('Hãy tìm và chọn nơi sinh từ kết quả máy chủ.');return;}
      if (timeKnown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {setError('Giờ sinh phải có dạng HH:mm.');return;}
      void action(async () => {
        const result = await natalChartApi.create({birthDate:date, ...(timeKnown ? {birthTime:time} : {}), locationToken:location.token});
        setNatal(result);setHistory(null);setLocation(null);setLocations([]);setPlaceQuery('');
        await refresh(filter);
      });
    } else {
      if (!name.trim()) {setError('Vui lòng nhập họ tên khai sinh.');return;}
      void action(async () => {
        setNumbers(await numerologyApi.calculate(name.trim(),date));setHistory(null);await refresh(filter);
      });
    }
  }
  function open(id:string) {
    void action(async () => {
      if(mode==='natal') setNatal(await natalChartApi.get(id));
      else setNumbers(await numerologyApi.get(id));
      setHistory(null);
    });
  }
  const active = mode === 'natal' ? natal : numbers;
  function change(kind:'archive'|'restore'|'remove'|'interpret') {
    if (!active) return;
    const id=active.id;
    const perform = () => void action(async () => {
      if(mode==='natal') {
        const result=await natalChartApi[kind](id);
        setNatal(result);
      } else {
        const result=await numerologyApi[kind](id);
        setNumbers(result);
      }
      setHistory(null);
      await refresh(filter);
    });
    if (kind==='remove') Alert.alert('Xóa kết quả?', 'Kết quả sẽ chuyển sang mục Đã xóa.',[
      {text:'Hủy',style:'cancel'},{text:'Xóa',style:'destructive',onPress:perform},
    ]);
    else perform();
  }
  function loadHistory() {
    if (!active) return;
    const id=active.id;
    void action(async () => {
      setHistory(mode==='natal' ? await natalChartApi.history(id) : await numerologyApi.history(id));
    });
  }
  function searchPlace() {
    if (placeQuery.trim().length < 2) {setError('Nhập ít nhất 2 ký tự để tìm nơi sinh.');return;}
    setLocation(null);
    void action(async () => {setLocations(await natalChartApi.searchLocation(placeQuery.trim()));});
  }
  return <Screen><AppHeader/><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>MỆNH VI · KHÁM PHÁ</Text>
    <Text style={styles.title}>Khám phá bản thân</Text>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityState={{selected:mode==='natal'}} style={[styles.tab,mode==='natal'&&styles.selected]} onPress={()=>changeMode('natal')}><Text style={styles.text}>Bản đồ sao</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{selected:mode==='numbers'}} style={[styles.tab,mode==='numbers'&&styles.selected]} onPress={()=>changeMode('numbers')}><Text style={styles.text}>Thần số học</Text></Pressable>
    </View>
    {!allowed ? <View style={styles.card}><Text style={styles.muted}>Đăng nhập để lập và lưu kết quả bằng API thật.</Text><Pressable onPress={()=>router.push('/(auth)/login')} style={styles.button}><Text style={styles.buttonText}>Đăng nhập</Text></Pressable></View> : <>
      <View style={styles.card}>
        <Text style={styles.heading}>{mode==='natal'?'Lập bản đồ sao':'Tính chỉ số Thần số học'}</Text>
        {mode==='numbers' && <><Text style={styles.muted}>Họ tên khai sinh</Text><TextInput accessibilityLabel="Họ tên khai sinh" value={name} onChangeText={setName} style={styles.input} placeholderTextColor={color.textMuted} placeholder="Nguyễn Văn An"/></>}
        <Text style={styles.muted}>Ngày sinh (YYYY-MM-DD)</Text>
        <TextInput accessibilityLabel="Ngày sinh" value={date} onChangeText={setDate} style={styles.input} keyboardType="numbers-and-punctuation" placeholder="1998-05-12" placeholderTextColor={color.textMuted}/>
        {mode==='natal' && <>
          <Pressable onPress={()=>setTimeKnown(v=>!v)} accessibilityRole="checkbox" accessibilityState={{checked:timeKnown}}><Text style={styles.link}>{timeKnown?'☑':'☐'} Tôi biết giờ sinh</Text></Pressable>
          {timeKnown && <TextInput accessibilityLabel="Giờ sinh" value={time} onChangeText={setTime} style={styles.input} keyboardType="numbers-and-punctuation" placeholder="14:30 (HH:mm)" placeholderTextColor={color.textMuted}/>}
          <Text style={styles.muted}>Nơi sinh — tìm kiếm qua máy chủ</Text>
          <TextInput accessibilityLabel="Tìm nơi sinh" value={placeQuery} onChangeText={v=>{setPlaceQuery(v);setLocation(null);setLocations([]);}} style={styles.input} placeholder="Hà Nội, Việt Nam" placeholderTextColor={color.textMuted}/>
          <Pressable disabled={busy} onPress={searchPlace}><Text style={styles.link}>Tìm địa điểm</Text></Pressable>
          {locations.map(candidate=><Pressable key={candidate.token} style={[styles.item,location?.token===candidate.token&&styles.selected]} onPress={()=>setLocation(candidate)}><Text style={styles.text}>{candidate.label}{location?.token===candidate.token?' ✓':''}</Text></Pressable>)}
          {location && <Text style={styles.link}>Đã chọn: {location.label}</Text>}
        </>}
        <Pressable disabled={busy} onPress={calculate} style={styles.button}><Text style={styles.buttonText}>{mode==='natal'?'Lập bản đồ sao':'Xem các chỉ số'}</Text></Pressable>
      </View>
      {active && <View style={styles.card}>
        <Text style={styles.heading}>{mode==='natal'?'Bản đồ sao đã tính':'Các con số của bạn'}</Text>
        <Text style={styles.muted}>{active.birthDate} · {statusLabels[active.status]}</Text>
        {natal && mode==='natal' && <>
          <Text style={styles.text}>{natal.birthPlaceLabel} · {natal.timezone}</Text>
          <Text style={styles.muted}>{natal.birthTimeKnown?natal.birthTime:'Không xác định giờ sinh'}</Text>
          <Text style={styles.heading}>Vị trí hành tinh</Text>
          {natal.placements.map(p=><View key={p.body} style={styles.item}><Text style={styles.text}>{p.body} · {p.sign} {p.degreeInSign.toFixed(2)}°</Text><Text style={styles.muted}>{p.house===null?'Không xác định nhà':`Nhà ${p.house}`}{p.retrograde?' · Nghịch hành':''}</Text><Text style={styles.muted}>{p.meaning}</Text></View>)}
          {natal.housesAvailable && <><Text style={styles.heading}>12 nhà</Text>{natal.houses.map(h=><Text key={h.number} style={styles.muted}>Nhà {h.number} · {h.sign}</Text>)}</>}
          <Text style={styles.heading}>Góc chiếu</Text>
          {natal.aspects.map((a,i)=><View key={i} style={styles.item}><Text style={styles.text}>{a.pointA} – {a.pointB} · {a.type}</Text><Text style={styles.muted}>{a.meaning}</Text></View>)}
          {natal.interpretation && Object.entries(natal.interpretation).map(([key,value])=><View key={key} style={styles.item}><Text style={styles.heading}>{sectionNames[key]||key}</Text><Text style={styles.muted}>{value}</Text></View>)}
        </>}
        {numbers && mode==='numbers' && <>
          <Text style={styles.text}>{numbers.birthNameInput}</Text>
          {numbers.values.slice().sort((a,b)=>a.order-b.order).map(v=><View key={v.type} style={styles.item}><Text style={styles.heading}>{v.type}: {v.value}{v.isMasterNumber?' · Master Number':''}</Text>{v.appliesToYear!==null&&<Text style={styles.muted}>Năm {v.appliesToYear}</Text>}</View>)}
          <Text style={styles.heading}>Luận giải</Text><Text style={styles.muted}>{numbers.interpretation||'Chưa có luận giải.'}</Text>
        </>}
        <View style={styles.row}>
          {((mode==='natal'&&!natal?.interpretation)||(mode==='numbers'&&!numbers?.interpretation)) && <Pressable disabled={busy} onPress={()=>change('interpret')}><Text style={styles.link}>Tạo luận giải</Text></Pressable>}
          <Pressable disabled={busy} onPress={()=>change(active.status==='ACTIVE'?'archive':'restore')}><Text style={styles.link}>{active.status==='ACTIVE'?'Lưu trữ':'Khôi phục'}</Text></Pressable>
          {active.status!=='DELETED'&&<Pressable disabled={busy} onPress={()=>change('remove')}><Text style={styles.link}>Xóa</Text></Pressable>}
          <Pressable disabled={busy} onPress={loadHistory}><Text style={styles.link}>Lịch sử</Text></Pressable>
        </View>
        {history?.map(h=><Text key={h.id} style={styles.muted}>{h.createdAt} · {h.action} · {h.detail}</Text>)}
      </View>}
      <View style={styles.card}>
        <Text style={styles.heading}>Kết quả đã lưu</Text>
        <View style={styles.row}>{statuses.map(s=><Pressable key={s} onPress={()=>{setFilter(s);void refresh(s);}}><Text style={[styles.link,filter===s&&styles.text]}>{statusLabels[s]}</Text></Pressable>)}</View>
        {loadingList?<ActivityIndicator color={color.gold}/>:items.map(item=><Pressable key={item.id} onPress={()=>open(item.id)} style={styles.item}><Text style={styles.text}>{item.title}</Text><Text style={styles.muted}>{item.date} · Xem chi tiết</Text></Pressable>)}
        {!loadingList&&!items.length&&<Text style={styles.muted}>Chưa có kết quả trong mục này.</Text>}
        <Text style={styles.muted}>Trang {page} · Tổng {total}</Text>
        <View style={styles.row}><Pressable disabled={loadingList||page<=1} onPress={()=>void refresh(filter,page-1)}><Text style={styles.link}>Trang trước</Text></Pressable><Pressable disabled={loadingList||page*10>=total} onPress={()=>void refresh(filter,page+1)}><Text style={styles.link}>Trang sau</Text></Pressable></View>
      </View>
    </>}
    {busy&&<ActivityIndicator color={color.gold}/>}
    {!!notice&&<Text style={styles.muted}>{notice}</Text>}
    {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </ScrollView></Screen>;
}
const styles=StyleSheet.create({
  content:{padding:spacing.lg,paddingBottom:80,gap:spacing.lg},
  eyebrow:{color:color.gold,letterSpacing:2,fontFamily:font.bodyMedium},
  title:{color:color.textPrimary,fontFamily:font.display,fontSize:28},
  heading:{color:color.goldLight,fontFamily:font.display,fontSize:19},
  text:{color:color.textPrimary,fontFamily:font.bodyMedium},
  muted:{color:color.textSecondary,fontFamily:font.body,lineHeight:21},
  link:{color:color.gold,fontFamily:font.bodyMedium},
  card:{backgroundColor:color.surface,borderColor:color.borderGold,borderWidth:1,borderRadius:16,padding:spacing.lg,gap:spacing.md},
  row:{flexDirection:'row',flexWrap:'wrap',gap:spacing.lg,alignItems:'center'},
  tab:{padding:spacing.md,borderColor:color.borderGold,borderWidth:1,borderRadius:10},
  selected:{borderColor:color.gold,backgroundColor:color.surfaceElevated},
  input:{color:color.textPrimary,borderColor:color.borderGold,borderWidth:1,borderRadius:10,padding:spacing.md},
  button:{backgroundColor:color.gold,padding:spacing.md,borderRadius:10,alignItems:'center'},
  buttonText:{color:color.bg,fontFamily:font.bodySemibold},
  item:{borderTopWidth:1,borderColor:color.borderSubtle,paddingTop:spacing.md,gap:4},
  error:{color:'#F6A59B'},
});
