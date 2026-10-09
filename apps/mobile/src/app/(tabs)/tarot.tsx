import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TarotReadingDto, TarotReadingTypeValue } from '@beaconvie/types';
import { AppHeader } from '@/components/app-header';
import { GoldButton, SecondaryButton } from '@/components/buttons';
import { MysticCard } from '@/components/mystic-card';
import { Screen } from '@/components/screen';
import { discoveryError } from '@/lib/discovery-error';
import { tarotApi } from '@/features/tarot/api';
import { TarotReadingResult } from '@/features/tarot/reading-result';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

const BACK_ART = `${process.env.EXPO_PUBLIC_WEB_URL??'https://tuvitarot.vn'}/assets/tarot/card-back.webp`;

const TYPES: {value:TarotReadingTypeValue;label:string;count:number}[]=[{value:'DAILY_DRAW',label:'Lá bài hôm nay',count:1},{value:'SINGLE_CARD',label:'Một lá',count:1},{value:'THREE_CARD',label:'Ba lá',count:3}];

export default function TarotScreen(){
 const [backFailed,setBackFailed]=useState(false); const [type,setType]=useState<TarotReadingTypeValue>('DAILY_DRAW'); const [question,setQuestion]=useState(''); const [positions,setPositions]=useState<number[]>([]); const [token,setToken]=useState(''); const [deckSize,setDeckSize]=useState(0); const [result,setResult]=useState<TarotReadingDto|null>(null); const [history,setHistory]=useState<TarotReadingDto[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const [ritualMotion]=useState(()=>new Animated.Value(1));
 const [revealMotion]=useState(()=>new Animated.Value(1));
 useEffect(()=>{if(!token)return;ritualMotion.setValue(0);const animation=Animated.timing(ritualMotion,{toValue:1,duration:850,easing:Easing.out(Easing.cubic),useNativeDriver:true});animation.start();return ()=>animation.stop();},[token,ritualMotion]);
 useEffect(()=>{if(!result)return;revealMotion.setValue(0);const animation=Animated.timing(revealMotion,{toValue:1,duration:650,easing:Easing.out(Easing.cubic),useNativeDriver:true});animation.start();return ()=>animation.stop();},[result,revealMotion]);
 const need=TYPES.find(x=>x.value===type)?.count??1;
 async function prepare(){setBusy(true);setError('');setResult(null);setPositions([]);try{const x=await tarotApi.createSelectionSession(type);setToken(x.token);setDeckSize(x.deckSize);}catch(e){setError(discoveryError(e,'Chưa thể chuẩn bị bộ bài.').message);}finally{setBusy(false);}}
 async function pick(i:number){if(!token||positions.includes(i)||busy||positions.length>=need)return;const next=[...positions,i];setPositions(next);if(next.length===need){setBusy(true);try{setResult(await tarotApi.draw(type,token,next,type==='DAILY_DRAW'?undefined:question.trim()||undefined));setToken('');}catch(e){setToken('');setPositions([]);setError(discoveryError(e,'Chưa thể rút bài lúc này.').message+' Vui lòng xáo bài để thử lại.');}finally{setBusy(false);}}}
 return <Screen><AppHeader/><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>TAROT · 78 LÁ</Text><Text style={s.title}>Một khoảng lặng để soi chiếu</Text><Text style={s.copy}>Chọn kiểu trải, giữ câu hỏi trong lòng rồi tự tay chọn vị trí trong bộ bài. Kết quả được rút và lưu bởi API Mệnh Vi.</Text>
 {result?<Animated.View style={{gap:spacing.md,opacity:revealMotion,transform:[{scale:revealMotion.interpolate({inputRange:[0,1],outputRange:[0.94,1]})}]}}><TarotReadingResult reading={result} onRetry={async()=>{setBusy(true);try{setResult(await tarotApi.retryInterpretation(result.id));}finally{setBusy(false);}}}/><SecondaryButton label="Rút trải bài khác" onPress={()=>{setResult(null);setPositions([]);}}/></Animated.View>:<>
 <View style={s.types}>{TYPES.map(x=><Pressable key={x.value} onPress={()=>{setType(x.value);setToken('');setPositions([]);setError('');}} style={[s.type,type===x.value&&s.typeOn]}><Text style={[s.typeText,type===x.value&&s.typeTextOn]}>{x.label}</Text></Pressable>)}</View>
 {type!=='DAILY_DRAW'?<TextInput value={question} onChangeText={setQuestion} maxLength={500} multiline placeholder="Câu hỏi của bạn (không bắt buộc)" placeholderTextColor={color.textMuted} style={[s.input,{minHeight:84,textAlignVertical:'top'}]}/>:null}
 {!token?<GoldButton label="Xáo bài và bắt đầu" onPress={prepare}/>:<Animated.View style={{opacity:ritualMotion,transform:[{translateY:ritualMotion.interpolate({inputRange:[0,1],outputRange:[18,0]})}]}}><MysticCard style={s.card}>
 <Text style={s.eyebrow}>MỆNH VI · NGHI THỨC TAROT</Text>
 <Text style={s.selectionTitle}>Chọn lá bài úp</Text>
 <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={s.selectionCount}>Đã chọn {positions.length} / {need}</Text>
 <Text style={s.copy}>Lướt ngang bộ bài và chạm vào {need===1?'một lá':'ba lá'} bạn cảm thấy kết nối. Mỗi vị trí chỉ được chọn một lần.</Text>
 <View style={s.placements}>{Array.from({length:need},(_,slot)=><View key={slot} style={s.placement}>
 {positions[slot]===undefined?<><Text style={s.placementNumber}>{slot+1}</Text><Text style={s.placementLabel}>{need===3?['Quá khứ','Hiện tại','Tương lai'][slot]:'Lá của bạn'}</Text></>:<>{!backFailed?<Image source={{uri:BACK_ART}} style={s.placementImage} contentFit="contain" onError={()=>setBackFailed(true)}/>:<View style={s.artFallback}><Text style={s.artFallbackGlyph}>☾</Text><Text style={s.artFallbackGlyph}>✦</Text></View>}<Text style={s.placementBadge}>{slot+1}</Text></>}
 </View>)}</View>
 <Text style={s.deckHeading}>BỘ BÀI 78 LÁ · LƯỚT ĐỂ CHỌN</Text>
 <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={s.deckTrack} accessibilityLabel="Bộ bài Tarot, lướt ngang để chọn vị trí">
 {Array.from({length:deckSize},(_,i)=><Pressable accessibilityRole="button" accessibilityLabel={`Lá úp ${i+1}`} accessibilityState={{disabled:busy||positions.includes(i),selected:positions.includes(i)}} key={i} onPress={()=>pick(i)} disabled={busy||positions.includes(i)} style={[s.deckCard,positions.includes(i)&&s.deckCardSelected]}>
 {!backFailed?<Image source={{uri:BACK_ART}} style={s.deckImage} contentFit="contain" onError={()=>setBackFailed(true)}/>:<View style={s.artFallback}><Text style={s.artFallbackGlyph}>☾</Text><Text style={s.artFallbackGlyph}>✦</Text></View>}
 <View style={s.deckBadge}><Text style={s.deckBadgeText}>{i+1}</Text></View>
 </Pressable>)}
 </ScrollView>
 <Text style={s.copy}>{busy?'Đã nhận lựa chọn của bạn. Đang mở bài…':'Danh tính và chiều lá bài được giữ kín cho đến khi bạn chọn đủ số lá.'}</Text>
 </MysticCard></Animated.View>}
 </>}
 {busy?<ActivityIndicator color={color.gold}/>:null}{error?<Text style={s.error}>{error}</Text>:null}
 <View style={{gap:spacing.sm,marginTop:spacing.md}}><Text style={s.cardTitle}>Lịch sử Tarot</Text><SecondaryButton label="Tải lịch sử" onPress={async()=>{setBusy(true);setError('');try{const d=await tarotApi.listReadings();setHistory(d.items);}catch(e){setError(discoveryError(e,'Chưa thể tải lịch sử Tarot.').message);}finally{setBusy(false)}}}/>{history.map(x=><Pressable key={x.id} onPress={async()=>{setBusy(true);try{setResult(await tarotApi.getReading(x.id));}finally{setBusy(false)}}}><MysticCard style={s.card}><Text style={s.value}>{x.cards.map(y=>y.card.nameVi||y.card.name).join(' · ')}</Text><Text style={s.copy}>{x.question?`“${x.question}”`:'Trải bài đã lưu'}</Text></MysticCard></Pressable>)}</View>
 </ScrollView></Screen>;
}
const s=StyleSheet.create({artFallback:{flex:1,width:'100%',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:color.goldMuted,borderRadius:radius.sm,backgroundColor:'#101827'},artFallbackGlyph:{fontFamily:font.display,fontSize:22,color:color.goldLight},selectionTitle:{fontFamily:font.display,fontSize:fontSize.headingLg,color:color.goldLight,textAlign:'center'},selectionCount:{fontFamily:font.bodySemibold,fontSize:fontSize.bodyMd,color:color.goldLight,textAlign:'center'},placements:{flexDirection:'row',justifyContent:'center',gap:8,marginVertical:8},placement:{width:88,height:136,borderWidth:1,borderColor:color.goldMuted,borderRadius:radius.sm,backgroundColor:'#081522',alignItems:'center',justifyContent:'center',overflow:'hidden',gap:8},placementNumber:{fontFamily:font.display,fontSize:fontSize.headingLg,color:color.goldLight},placementLabel:{fontFamily:font.body,fontSize:fontSize.caption,color:color.textSecondary},placementImage:{width:'100%',height:'100%'},placementBadge:{position:'absolute',bottom:4,right:5,fontFamily:font.bodySemibold,color:color.goldLight},deckHeading:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:color.goldLight,letterSpacing:1},deckTrack:{paddingVertical:12,paddingHorizontal:4,gap:9},deckCard:{width:76,height:122,borderWidth:1,borderColor:color.goldMuted,borderRadius:radius.sm,overflow:'hidden',backgroundColor:'#101827'},deckCardSelected:{opacity:0.25},deckImage:{width:'100%',height:'100%'},deckBadge:{position:'absolute',bottom:3,right:4,backgroundColor:'#07111D',paddingHorizontal:4,borderRadius:3},deckBadgeText:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:color.goldLight},page:{padding:spacing.lg,paddingBottom:48,gap:spacing.md},eyebrow:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:'#C6A9DF',letterSpacing:2},title:{fontFamily:font.display,fontSize:fontSize.displayMd,color:color.textPrimary},copy:{fontFamily:font.body,fontSize:fontSize.bodySm,color:color.textSecondary,lineHeight:20},card:{padding:spacing.lg,gap:spacing.md},cardTitle:{fontFamily:font.display,fontSize:fontSize.headingMd,color:color.textPrimary},value:{fontFamily:font.bodySemibold,color:color.textPrimary},types:{gap:spacing.sm},type:{minHeight:48,borderWidth:1,borderColor:color.borderSubtle,borderRadius:radius.sm,justifyContent:'center',paddingHorizontal:14},typeOn:{borderColor:'#8D78B6',backgroundColor:'rgba(107,70,140,0.18)'},typeText:{fontFamily:font.bodySemibold,color:color.textSecondary},typeTextOn:{color:color.textPrimary},input:{borderWidth:1,borderColor:color.borderGold,borderRadius:radius.sm,padding:14,color:color.textPrimary,backgroundColor:color.surface,fontFamily:font.body},deck:{flexDirection:'row',flexWrap:'wrap',gap:7},back:{width:44,height:62,borderRadius:5,borderWidth:1,borderColor:'rgba(198,169,223,.35)',backgroundColor:'#17172D',alignItems:'center',justifyContent:'center'},backSelected:{opacity:.25,borderColor:color.gold},star:{color:'#C6A9DF'},error:{color:'#E49A8F',fontFamily:font.body}});
