import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TarotReadingDto, TarotReadingTypeValue } from '@beaconvie/types';
import { AppHeader } from '@/components/app-header';
import { GoldButton, SecondaryButton } from '@/components/buttons';
import { MysticCard } from '@/components/mystic-card';
import { Screen } from '@/components/screen';
import { discoveryError } from '@/lib/discovery-error';
import { tarotApi } from '@/features/tarot/api';
import { TarotReadingResult } from '@/features/tarot/reading-result';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

const TYPES: {value:TarotReadingTypeValue;label:string;count:number}[]=[{value:'DAILY_DRAW',label:'Lá bài hôm nay',count:1},{value:'SINGLE_CARD',label:'Một lá',count:1},{value:'THREE_CARD',label:'Ba lá',count:3}];

export default function TarotScreen(){
 const [type,setType]=useState<TarotReadingTypeValue>('DAILY_DRAW'); const [question,setQuestion]=useState(''); const [positions,setPositions]=useState<number[]>([]); const [token,setToken]=useState(''); const [deckSize,setDeckSize]=useState(0); const [result,setResult]=useState<TarotReadingDto|null>(null); const [history,setHistory]=useState<TarotReadingDto[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const need=TYPES.find(x=>x.value===type)?.count??1;
 async function prepare(){setBusy(true);setError('');setResult(null);setPositions([]);try{const x=await tarotApi.createSelectionSession(type);setToken(x.token);setDeckSize(x.deckSize);}catch(e){setError(discoveryError(e,'Chưa thể chuẩn bị bộ bài.').message);}finally{setBusy(false);}}
 async function pick(i:number){if(!token||positions.includes(i)||busy)return;const next=[...positions,i];setPositions(next);if(next.length===need){setBusy(true);try{setResult(await tarotApi.draw(type,token,next,type==='DAILY_DRAW'?undefined:question.trim()||undefined));setToken('');}catch(e){setError(discoveryError(e,'Chưa thể rút bài lúc này.').message);}finally{setBusy(false);}}}
 return <Screen><AppHeader/><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>TAROT · 78 LÁ</Text><Text style={s.title}>Một khoảng lặng để soi chiếu</Text><Text style={s.copy}>Chọn kiểu trải, giữ câu hỏi trong lòng rồi tự tay chọn vị trí trong bộ bài. Kết quả được rút và lưu bởi API Mệnh Vi.</Text>
 {result?<View style={{gap:spacing.md}}><TarotReadingResult reading={result} onRetry={async()=>{setBusy(true);try{setResult(await tarotApi.retryInterpretation(result.id));}finally{setBusy(false);}}}/><SecondaryButton label="Rút trải bài khác" onPress={()=>{setResult(null);setPositions([]);}}/></View>:<>
 <View style={s.types}>{TYPES.map(x=><Pressable key={x.value} onPress={()=>{setType(x.value);setToken('');setPositions([]);}} style={[s.type,type===x.value&&s.typeOn]}><Text style={[s.typeText,type===x.value&&s.typeTextOn]}>{x.label}</Text></Pressable>)}</View>
 {type!=='DAILY_DRAW'?<TextInput value={question} onChangeText={setQuestion} maxLength={500} multiline placeholder="Câu hỏi của bạn (không bắt buộc)" placeholderTextColor={color.textMuted} style={[s.input,{minHeight:84,textAlignVertical:'top'}]}/>:null}
 {!token?<GoldButton label="Xáo bài và bắt đầu" onPress={prepare}/>:<MysticCard style={s.card}><Text style={s.cardTitle}>Chọn {need} lá</Text><Text style={s.copy}>Đã chọn {positions.length}/{need}. Chạm vào các lá úp bên dưới.</Text><View style={s.deck}>{Array.from({length:deckSize},(_,i)=><Pressable accessibilityLabel={`Lá úp ${i+1}`} key={i} onPress={()=>pick(i)} style={[s.back,positions.includes(i)&&s.backSelected]}><Text style={s.star}>✦</Text></Pressable>)}</View></MysticCard>}
 </>}
 {busy?<ActivityIndicator color={color.gold}/>:null}{error?<Text style={s.error}>{error}</Text>:null}
 <View style={{gap:spacing.sm,marginTop:spacing.md}}><Text style={s.cardTitle}>Lịch sử Tarot</Text><SecondaryButton label="Tải lịch sử" onPress={async()=>{setBusy(true);setError('');try{const d=await tarotApi.listReadings();setHistory(d.items);}catch(e){setError(discoveryError(e,'Chưa thể tải lịch sử Tarot.').message);}finally{setBusy(false)}}}/>{history.map(x=><Pressable key={x.id} onPress={async()=>{setBusy(true);try{setResult(await tarotApi.getReading(x.id));}finally{setBusy(false)}}}><MysticCard style={s.card}><Text style={s.value}>{x.cards.map(y=>y.card.nameVi||y.card.name).join(' · ')}</Text><Text style={s.copy}>{x.question?`“${x.question}”`:'Trải bài đã lưu'}</Text></MysticCard></Pressable>)}</View>
 </ScrollView></Screen>;
}
const s=StyleSheet.create({page:{padding:spacing.lg,paddingBottom:48,gap:spacing.md},eyebrow:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:'#C6A9DF',letterSpacing:2},title:{fontFamily:font.display,fontSize:fontSize.displayMd,color:color.textPrimary},copy:{fontFamily:font.body,fontSize:fontSize.bodySm,color:color.textSecondary,lineHeight:20},card:{padding:spacing.lg,gap:spacing.md},cardTitle:{fontFamily:font.display,fontSize:fontSize.headingMd,color:color.textPrimary},value:{fontFamily:font.bodySemibold,color:color.textPrimary},types:{gap:spacing.sm},type:{minHeight:48,borderWidth:1,borderColor:color.borderSubtle,borderRadius:radius.sm,justifyContent:'center',paddingHorizontal:14},typeOn:{borderColor:'#8D78B6',backgroundColor:'rgba(107,70,140,0.18)'},typeText:{fontFamily:font.bodySemibold,color:color.textSecondary},typeTextOn:{color:color.textPrimary},input:{borderWidth:1,borderColor:color.borderGold,borderRadius:radius.sm,padding:14,color:color.textPrimary,backgroundColor:color.surface,fontFamily:font.body},deck:{flexDirection:'row',flexWrap:'wrap',gap:7},back:{width:38,height:58,borderRadius:5,borderWidth:1,borderColor:'rgba(198,169,223,.35)',backgroundColor:'#17172D',alignItems:'center',justifyContent:'center'},backSelected:{opacity:.25,borderColor:color.gold},star:{color:'#C6A9DF'},error:{color:'#E49A8F',fontFamily:font.body}});
