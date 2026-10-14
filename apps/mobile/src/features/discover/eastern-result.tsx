import { StyleSheet, Text, View } from 'react-native';
import type { EasternHoroscopeProfileDto } from '@beaconvie/types';
import { MysticCard } from '@/components/mystic-card';
import { color, font, fontSize, spacing } from '@/theme/tokens';
const REL: Record<string,string> = { GENERATES:'Tương sinh', GENERATED_BY:'Được tương sinh', CONTROLS:'Tương khắc', CONTROLLED_BY:'Bị tương khắc', SAME:'Đồng hành' };
export function EasternResult({profile}:{profile:EasternHoroscopeProfileDto}) {
 return <View style={s.root}>
  <MysticCard style={s.card}><Text style={s.kicker}>DỮ KIỆN CỐ ĐỊNH · KHÔNG DO AI TẠO</Text><Text style={s.title}>Bản mệnh của bạn</Text><Fact k="Con giáp" v={profile.zodiacAnimal.vi}/><Fact k="Ngũ hành" v={profile.element}/><Fact k="Âm / Dương" v={profile.yinYang}/><Fact k="Thiên Can / Địa Chi" v={profile.stem+' '+profile.branch}/><Text style={s.note}>Tính từ ngày sinh {profile.birthDate} bằng lịch âm dương của hệ thống.</Text></MysticCard>
  <MysticCard style={s.card}><Text style={s.kicker}>VẬN KHÍ {profile.yearEnergy.calendarYear}</Text><Fact k="Con giáp năm" v={profile.yearEnergy.yearZodiacAnimal.vi}/><Fact k="Ngũ hành năm" v={profile.yearEnergy.yearElement}/><Fact k="Quan hệ" v={REL[profile.yearEnergy.relationship] ?? profile.yearEnergy.relationship}/></MysticCard>
  <MysticCard style={s.card}><Text style={s.kicker}>CHIÊM NGHIỆM · DIỄN GIẢI AI</Text><Text style={s.body}>{profile.interpretationStale ? 'Chiêm nghiệm hiện tại đã cũ; cần tạo lại cho năm nay.' : profile.interpretation ?? 'Chưa có chiêm nghiệm cho năm nay.'}</Text></MysticCard>
 </View>;
}
function Fact({k,v}:{k:string;v:string}) { return <View><Text style={s.label}>{k}</Text><Text style={s.body}>{v}</Text></View>; }
const s=StyleSheet.create({root:{gap:spacing.md},card:{padding:spacing.lg,gap:spacing.sm},kicker:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:color.gold,letterSpacing:1},title:{fontFamily:font.display,fontSize:fontSize.headingMd,color:color.textPrimary},label:{fontFamily:font.bodySemibold,fontSize:fontSize.caption,color:color.textMuted,textTransform:'uppercase'},body:{fontFamily:font.body,fontSize:fontSize.bodySm,color:color.textPrimary,lineHeight:20},note:{fontFamily:font.body,fontSize:fontSize.caption,color:color.textSecondary}});
