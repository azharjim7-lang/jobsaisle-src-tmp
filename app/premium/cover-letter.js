import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Sparkles, Wand2, Download } from 'lucide-react-native';
import { colors } from '../../lib/colors';

const API_BASE = 'https://www.jobsaisle.com';

export default function CoverLetter() {
  const router = useRouter();
  const [d, setD] = useState({ name:'', jobTitle:'', company:'', email:'', phone:'' });
  const [body, setBody] = useState('');
  const [intros, setIntros] = useState([]);
  const [busy, setBusy] = useState('');
  const [exporting, setExporting] = useState(false);

  async function getUid(){ const u=await AsyncStorage.getItem('user'); return u?JSON.parse(u).uid:''; }
  async function ai(kind, extra={}){
    setBusy(kind);
    try {
      const uid=await getUid();
      const r=await fetch(`${API_BASE}/api/premium/cv-ai`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:uid, kind, jobTitle:d.jobTitle, company:d.company, name:d.name, role:d.jobTitle, ...extra }) });
      const j=await r.json(); setBusy(''); return j;
    } catch { setBusy(''); return {}; }
  }
  async function generate(){ if(!d.jobTitle.trim()){Alert.alert('Add job title','Which role are you applying for?');return;} const j=await ai('cover_letter'); if(j.text)setBody(j.text); }
  async function getIntros(){ if(!d.jobTitle.trim()){Alert.alert('Add job title','Fill the job title first');return;} const j=await ai('cover_intro'); if(j.suggestions)setIntros(j.suggestions); }

  function buildHTML(){
    const date=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    return `<html><head><meta charset="utf-8"></head><body style="font-family:Georgia,serif;margin:0;color:#1a1a1a;background:#fff"><div style="padding:52px 56px;line-height:1.7;font-size:13px"><div style="font-size:18px;font-weight:700;color:#0D2E23">${d.name||'Your Name'}</div><div style="font-size:11px;color:#666;margin-bottom:24px">${[d.email,d.phone].filter(Boolean).join('  ·  ')}</div><div style="font-size:11px;color:#666;margin-bottom:24px">${date}</div>${d.company?`<div style="margin-bottom:24px;font-size:12px"><div style="font-weight:600">Hiring Team</div><div>${d.company}</div></div>`:''}<div style="white-space:pre-line">${body||''}</div><div style="margin-top:28px">Sincerely,<br><span style="font-weight:600">${d.name||'Your Name'}</span></div></div></body></html>`;
  }
  async function exportPDF(){
    if(!d.name.trim()){Alert.alert('Add name','Fill your name');return;}
    if(!body.trim()){Alert.alert('No letter','Generate or write the letter first');return;}
    setExporting(true);
    try { const {uri}=await Print.printToFileAsync({html:buildHTML()}); if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:'application/pdf',dialogTitle:'Cover Letter'}); else Alert.alert('Saved',uri); }
    catch { Alert.alert('Error','Could not create PDF'); }
    setExporting(false);
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:colors.bg }} edges={['top']}>
      <View style={st.header}>
        <TouchableOpacity onPress={()=>router.back()}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={st.headerTitle}>Cover Letter</Text><View style={{width:24}} />
      </View>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }} keyboardShouldPersistTaps="handled">
        <Text style={st.h2}>Write a cover letter</Text>
        <Text style={st.hint}>Add details and let AI draft a tailored letter you can edit.</Text>
        {[['name','Your name'],['jobTitle','Job you\'re applying for'],['company','Company'],['email','Email'],['phone','Phone']].map(([k,l])=>(
          <View key={k} style={{ marginBottom:13 }}><Text style={st.label}>{l}</Text><TextInput style={st.field} placeholder={l} placeholderTextColor={colors.textGhost} value={d[k]} onChangeText={v=>setD({...d,[k]:v})} /></View>))}
        <TouchableOpacity onPress={generate} style={[st.aiChip,{justifyContent:'center',padding:14,marginTop:4,marginBottom:16}]}>{busy==='cover_letter'?<ActivityIndicator size="small" color={colors.primary} />:<><Wand2 size={16} color={colors.primary} /><Text style={st.aiTxt}>Generate cover letter</Text></>}</TouchableOpacity>
        <Text style={st.label}>Letter</Text>
        <TextInput style={[st.field,{minHeight:240,textAlignVertical:'top'}]} placeholder="Your letter appears here — edit freely" placeholderTextColor={colors.textGhost} value={body} onChangeText={setBody} multiline />
        <TouchableOpacity onPress={getIntros} style={[st.aiChip,{marginTop:12,alignSelf:'flex-start'}]}>{busy==='cover_intro'?<ActivityIndicator size="small" color={colors.primary} />:<><Sparkles size={14} color={colors.primary} /><Text style={st.aiTxt}>Suggest opening lines</Text></>}</TouchableOpacity>
        {intros.length>0 && <View style={{ marginTop:10, gap:7 }}>{intros.map((s,i)=>(<TouchableOpacity key={i} onPress={()=>setBody(s+'\n\n'+body)} style={st.sugItem}><Text style={st.sugTxt}>{s}</Text></TouchableOpacity>))}</View>}
        <TouchableOpacity onPress={exportPDF} disabled={exporting} style={st.downloadBtn}>{exporting?<ActivityIndicator color="#fff" />:<><Download size={18} color="#fff" /><Text style={st.downloadTxt}>Download PDF</Text></>}</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  headerTitle:{ fontSize:16, fontFamily:'Inter_700Bold', color:colors.text },
  h2:{ fontSize:21, fontFamily:'Inter_700Bold', color:colors.text, letterSpacing:-0.3 },
  hint:{ fontSize:13, color:colors.textMuted, marginTop:4, marginBottom:18, lineHeight:19 },
  field:{ backgroundColor:'#FCFBF9', borderWidth:1, borderColor:'#D9D3C8', borderRadius:10, paddingHorizontal:14, paddingVertical:12, fontSize:15, color:colors.text, fontFamily:'Inter_400Regular' },
  label:{ fontSize:13, fontFamily:'Inter_600SemiBold', color:colors.text, marginBottom:6 },
  aiChip:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(13,147,115,0.08)', borderWidth:1, borderColor:'rgba(13,147,115,0.25)', paddingHorizontal:14, paddingVertical:10, borderRadius:10 },
  aiTxt:{ fontSize:13.5, color:colors.primary, fontFamily:'Inter_600SemiBold' },
  sugItem:{ backgroundColor:'#fff', borderWidth:1, borderColor:'rgba(13,147,115,0.25)', borderRadius:9, padding:10 },
  sugTxt:{ fontSize:12.5, color:colors.text, lineHeight:18 },
  downloadBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:colors.primary, borderRadius:12, paddingVertical:15, marginTop:20 },
  downloadTxt:{ color:'#fff', fontSize:16, fontFamily:'Inter_700Bold' },
});
