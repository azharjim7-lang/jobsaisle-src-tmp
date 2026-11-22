import { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, ArrowRight, Sparkles, Wand2, Plus, Trash2, Download, Check, Eye, X } from 'lucide-react-native';
import { colors } from '../../lib/colors';
import { TEMPLATES, LAYOUTS, renderCV } from '../../lib/cv_templates';

const API_BASE = 'https://www.jobsaisle.com';
const STEPS = ['Template', 'Heading', 'Experience', 'Education', 'Skills', 'Summary', 'Finish'];

export default function CVMaker() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const [layoutFilter, setLayoutFilter] = useState('all');
  const [heading, setHeading] = useState({ name:'', title:'', email:'', phone:'', location:'', linkedin:'' });
  const [experience, setExperience] = useState([{ role:'', company:'', start:'', end:'', bullets:'' }]);
  const [education, setEducation] = useState([{ degree:'', school:'', year:'' }]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [summary, setSummary] = useState('');
  const [sumSug, setSumSug] = useState([]);
  const [skillSug, setSkillSug] = useState([]);
  const [bulSug, setBulSug] = useState({});
  const [busy, setBusy] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const tpl = TEMPLATES.find(t => t.id === tplId) || TEMPLATES[0];
  const data = { personal: heading, summary, experience, education, skills };

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.6, base64:true });
    if (!res.canceled && res.assets?.[0]) { const a=res.assets[0]; setHeading({...heading, photo:`data:image/jpeg;base64,${a.base64}`}); }
  }
  async function getUid() { const u = await AsyncStorage.getItem('user'); return u ? JSON.parse(u).uid : ''; }
  async function ai(kind, extra={}) {
    setBusy(kind + (extra._i ?? ''));
    try {
      const uid = await getUid();
      const r = await fetch(`${API_BASE}/api/premium/cv-ai`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId:uid, kind, role:heading.title, jobTitle:extra.jobTitle||heading.title, company:extra.company, ...extra }) });
      const d = await r.json(); setBusy(''); return d;
    } catch { setBusy(''); return {}; }
  }
  async function getSummaries(){ if(!heading.title.trim()){Alert.alert('Add job title','Fill your job title in Heading first');setStep(1);return;} const d=await ai('suggest_summary',{exp:''}); if(d.suggestions)setSumSug(d.suggestions); }
  async function polishSummary(){ if(!summary.trim())return; const d=await ai('polish_summary',{text:summary}); if(d.text)setSummary(d.text); }
  async function getBullets(i){ const e=experience[i]; const d=await ai('suggest_bullets',{_i:i,jobTitle:e.role||heading.title,company:e.company}); if(d.suggestions)setBulSug({...bulSug,[i]:d.suggestions}); }
  async function polishBullets(i){ const e=experience[i]; if(!e.bullets.trim())return; const d=await ai('polish_bullets',{_i:i,text:e.bullets}); if(d.text){const x=[...experience];x[i].bullets=d.text;setExperience(x);} }
  async function getSkills(){ if(!heading.title.trim()){Alert.alert('Add job title','Fill your job title in Heading first');setStep(1);return;} const d=await ai('suggest_skills',{}); if(d.suggestions)setSkillSug(d.suggestions); }
  function addBullet(i,t){ const x=[...experience]; x[i].bullets=(x[i].bullets?x[i].bullets+'\n':'')+'• '+t; setExperience(x); }
  function addSkill(s){ const v=(s||skillInput).trim(); if(v&&!skills.includes(v))setSkills([...skills,v]); setSkillInput(''); }

  async function exportPDF(){
    if(!heading.name.trim()){Alert.alert('Add name','Fill your name first');setStep(1);return;}
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: renderCV(tpl, data) });
      if(await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri,{mimeType:'application/pdf',dialogTitle:'Your Resume'});
      else Alert.alert('Saved','PDF at: '+uri);
    } catch { Alert.alert('Error','Could not create PDF'); }
    setExporting(false);
  }

  const upd = (arr, set, i, k, v) => { const x=[...arr]; x[i][k]=v; set(x); };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={()=>router.back()}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={st.headerTitle}>Resume Builder</Text>
        {step>0 ? <TouchableOpacity onPress={()=>setShowPreview(true)} style={st.previewBtn}><Eye size={15} color={colors.primary} /><Text style={st.previewTxt}>Preview</Text></TouchableOpacity> : <View style={{width:60}} />}
      </View>
      {/* Progress */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.progress} contentContainerStyle={{ gap:5, paddingHorizontal:14 }}>
        {STEPS.map((s,i)=>(<TouchableOpacity key={s} onPress={()=>setStep(i)} style={[st.pStep, i===step&&st.pActive, i<step&&st.pDone]}><Text style={[st.pTxt, i===step&&{color:'#fff'}, i<step&&{color:colors.primary}]}>{i<step?'✓ ':''}{s}</Text></TouchableOpacity>))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }} keyboardShouldPersistTaps="handled">
        {step===0 && (<View>
          <Text style={st.h2}>Pick a template</Text>
          <Text style={st.hint}>{TEMPLATES.length} professional designs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }} contentContainerStyle={{ gap:7 }}>
            <TouchableOpacity onPress={()=>setLayoutFilter('all')} style={[st.chip, layoutFilter==='all'&&st.chipOn]}><Text style={[st.chipTxt, layoutFilter==='all'&&{color:'#fff'}]}>All</Text></TouchableOpacity>
            {LAYOUTS.map(L=>(<TouchableOpacity key={L.id} onPress={()=>setLayoutFilter(L.id)} style={[st.chip, layoutFilter===L.id&&st.chipOn]}><Text style={[st.chipTxt, layoutFilter===L.id&&{color:'#fff'}]}>{L.name}</Text></TouchableOpacity>))}
          </ScrollView>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
            {TEMPLATES.filter(t=>layoutFilter==='all'||t.layout===layoutFilter).map(t=>{
              const sel=tplId===t.id;
              return (<TouchableOpacity key={t.id} onPress={()=>setTplId(t.id)} style={[st.tplCard, sel&&{borderColor:t.accent,borderWidth:2.5}]}>
                <View style={[st.tplThumb, { backgroundColor:t.dark }]}>{sel && <View style={[st.tplCheck,{backgroundColor:t.accent}]}><Check size={12} color="#fff" /></View>}<View style={{height:6,width:'55%',backgroundColor:t.accent,borderRadius:2,margin:8}} /><View style={{height:3,width:'70%',backgroundColor:'rgba(255,255,255,0.3)',borderRadius:2,marginHorizontal:8,marginTop:3}} /></View>
                <Text style={st.tplName}>{t.name}</Text>
              </TouchableOpacity>);
            })}
          </View>
        </View>)}

        {step===1 && (<View>
          <Text style={st.h2}>Your details</Text><Text style={st.hint}>Your job title powers the AI suggestions.</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:16 }}>
            <TouchableOpacity onPress={pickPhoto} style={{ width:70, height:70, borderRadius:35, backgroundColor:'rgba(13,147,115,0.1)', alignItems:'center', justifyContent:'center', overflow:'hidden', borderWidth:1, borderColor:colors.cardBorder }}>
              {heading.photo ? <Image source={{uri:heading.photo}} style={{width:70,height:70}} /> : <Text style={{ fontSize:22, fontFamily:'Inter_700Bold', color:colors.primary }}>{(heading.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickPhoto} style={st.aiChip}><Text style={st.aiTxt}>{heading.photo?'Change photo':'Add photo'}</Text></TouchableOpacity>
            {heading.photo ? <TouchableOpacity onPress={()=>setHeading({...heading,photo:''})}><Text style={{color:'#C0392B',fontSize:13}}>Remove</Text></TouchableOpacity> : null}
          </View>
          {[['name','Full name'],['title','Job title'],['email','Email'],['phone','Phone'],['location','Location'],['linkedin','LinkedIn (optional)']].map(([k,l])=>(
            <View key={k} style={{ marginBottom:13 }}><Text style={st.label}>{l}</Text><TextInput style={st.field} placeholder={l} placeholderTextColor={colors.textGhost} value={heading[k]} onChangeText={v=>setHeading({...heading,[k]:v})} /></View>))}
        </View>)}

        {step===2 && (<View>
          <Text style={st.h2}>Work experience</Text><Text style={st.hint}>Add roles, then let AI suggest achievement bullets.</Text>
          {experience.map((e,i)=>(<View key={i} style={st.subCard}>
            <TextInput style={st.field} placeholder="Job title" placeholderTextColor={colors.textGhost} value={e.role} onChangeText={v=>upd(experience,setExperience,i,'role',v)} />
            <TextInput style={[st.field,{marginTop:8}]} placeholder="Company" placeholderTextColor={colors.textGhost} value={e.company} onChangeText={v=>upd(experience,setExperience,i,'company',v)} />
            <View style={{ flexDirection:'row', gap:8, marginTop:8 }}><TextInput style={[st.field,{flex:1}]} placeholder="Start" placeholderTextColor={colors.textGhost} value={e.start} onChangeText={v=>upd(experience,setExperience,i,'start',v)} /><TextInput style={[st.field,{flex:1}]} placeholder="End" placeholderTextColor={colors.textGhost} value={e.end} onChangeText={v=>upd(experience,setExperience,i,'end',v)} /></View>
            <TextInput style={[st.field,{marginTop:8,minHeight:80,textAlignVertical:'top'}]} placeholder="Achievements — one per line" placeholderTextColor={colors.textGhost} value={e.bullets} onChangeText={v=>upd(experience,setExperience,i,'bullets',v)} multiline />
            <View style={{ flexDirection:'row', gap:8, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
              <TouchableOpacity onPress={()=>getBullets(i)} style={st.aiChip}>{busy==='suggest_bullets'+i?<ActivityIndicator size="small" color={colors.primary} />:<><Wand2 size={13} color={colors.primary} /><Text style={st.aiTxt}>Suggest bullets</Text></>}</TouchableOpacity>
              <TouchableOpacity onPress={()=>polishBullets(i)} style={st.aiChip}>{busy==='polish_bullets'+i?<ActivityIndicator size="small" color={colors.primary} />:<><Sparkles size={13} color={colors.primary} /><Text style={st.aiTxt}>Polish</Text></>}</TouchableOpacity>
              {experience.length>1 && <TouchableOpacity onPress={()=>setExperience(experience.filter((_,x)=>x!==i))} style={{marginLeft:'auto'}}><Trash2 size={17} color="#C0392B" /></TouchableOpacity>}
            </View>
            {bulSug[i]?.length>0 && (<View style={{ marginTop:10, gap:6 }}>{bulSug[i].map((b,bi)=>(<TouchableOpacity key={bi} onPress={()=>addBullet(i,b)} style={st.sugItem}><Plus size={14} color={colors.primary} /><Text style={st.sugTxt}>{b}</Text></TouchableOpacity>))}</View>)}
          </View>))}
          <TouchableOpacity onPress={()=>setExperience([...experience,{role:'',company:'',start:'',end:'',bullets:''}])} style={st.addBtn}><Plus size={16} color={colors.primary} /><Text style={st.addTxt}>Add another role</Text></TouchableOpacity>
        </View>)}

        {step===3 && (<View>
          <Text style={st.h2}>Education</Text><Text style={st.hint}>Most recent first.</Text>
          {education.map((e,i)=>(<View key={i} style={st.subCard}>
            <TextInput style={st.field} placeholder="Degree" placeholderTextColor={colors.textGhost} value={e.degree} onChangeText={v=>upd(education,setEducation,i,'degree',v)} />
            <TextInput style={[st.field,{marginTop:8}]} placeholder="School / University" placeholderTextColor={colors.textGhost} value={e.school} onChangeText={v=>upd(education,setEducation,i,'school',v)} />
            <TextInput style={[st.field,{marginTop:8}]} placeholder="Year" placeholderTextColor={colors.textGhost} value={e.year} onChangeText={v=>upd(education,setEducation,i,'year',v)} />
            {education.length>1 && <TouchableOpacity onPress={()=>setEducation(education.filter((_,x)=>x!==i))} style={{marginTop:10,alignSelf:'flex-end'}}><Trash2 size={16} color="#C0392B" /></TouchableOpacity>}
          </View>))}
          <TouchableOpacity onPress={()=>setEducation([...education,{degree:'',school:'',year:''}])} style={st.addBtn}><Plus size={16} color={colors.primary} /><Text style={st.addTxt}>Add education</Text></TouchableOpacity>
        </View>)}

        {step===4 && (<View>
          <Text style={st.h2}>Skills</Text><Text style={st.hint}>Tap AI to see what fits your title.</Text>
          <View style={{ flexDirection:'row', gap:8, marginBottom:12 }}><TextInput style={[st.field,{flex:1}]} placeholder="Type a skill" placeholderTextColor={colors.textGhost} value={skillInput} onChangeText={setSkillInput} onSubmitEditing={()=>addSkill()} /><TouchableOpacity onPress={()=>addSkill()} style={st.addSkillBtn}><Text style={{color:'#fff',fontFamily:'Inter_700Bold'}}>Add</Text></TouchableOpacity></View>
          {skills.length>0 && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:14 }}>{skills.map(s=>(<View key={s} style={st.skillPill}><Text style={st.skillPillTxt}>{s}</Text><TouchableOpacity onPress={()=>setSkills(skills.filter(x=>x!==s))}><X size={13} color={colors.primary} /></TouchableOpacity></View>))}</View>}
          <TouchableOpacity onPress={getSkills} style={[st.aiChip,{justifyContent:'center',padding:12}]}>{busy==='suggest_skills'?<ActivityIndicator size="small" color={colors.primary} />:<><Wand2 size={15} color={colors.primary} /><Text style={st.aiTxt}>Suggest skills for my title</Text></>}</TouchableOpacity>
          {skillSug.length>0 && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, marginTop:12 }}>{skillSug.filter(s=>!skills.includes(s)).map(s=>(<TouchableOpacity key={s} onPress={()=>addSkill(s)} style={st.sugSkill}><Plus size={12} color={colors.primary} /><Text style={{fontSize:13,color:colors.text}}>{s}</Text></TouchableOpacity>))}</View>}
        </View>)}

        {step===5 && (<View>
          <Text style={st.h2}>Professional summary</Text><Text style={st.hint}>Generate options or write your own.</Text>
          <TextInput style={[st.field,{minHeight:110,textAlignVertical:'top'}]} placeholder="Write your summary, or generate below" placeholderTextColor={colors.textGhost} value={summary} onChangeText={setSummary} multiline />
          <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
            <TouchableOpacity onPress={getSummaries} style={[st.aiChip,{flex:1,justifyContent:'center',padding:12}]}>{busy==='suggest_summary'?<ActivityIndicator size="small" color={colors.primary} />:<><Wand2 size={15} color={colors.primary} /><Text style={st.aiTxt}>Generate summaries</Text></>}</TouchableOpacity>
            {summary?<TouchableOpacity onPress={polishSummary} style={st.aiChip}>{busy==='polish_summary'?<ActivityIndicator size="small" color={colors.primary} />:<><Sparkles size={14} color={colors.primary} /><Text style={st.aiTxt}>Polish</Text></>}</TouchableOpacity>:null}
          </View>
          {sumSug.length>0 && <View style={{ marginTop:12, gap:8 }}>{sumSug.map((s,i)=>(<TouchableOpacity key={i} onPress={()=>setSummary(s)} style={st.sugItem}><Text style={st.sugTxt}>{s}</Text></TouchableOpacity>))}</View>}
        </View>)}

        {step===6 && (<View style={{ alignItems:'center', paddingVertical:24 }}>
          <View style={st.doneIcon}><Check size={30} color={colors.primary} /></View>
          <Text style={st.h2}>Your resume is ready</Text>
          <Text style={[st.hint,{textAlign:'center'}]}>Download as PDF, or go back to refine.</Text>
          <TouchableOpacity onPress={exportPDF} disabled={exporting} style={st.downloadBtn}>{exporting?<ActivityIndicator color="#fff" />:<><Download size={19} color="#fff" /><Text style={st.downloadTxt}>Download PDF</Text></>}</TouchableOpacity>
          <TouchableOpacity onPress={()=>router.push('/premium/cover-letter')} style={{marginTop:16}}><Text style={{color:colors.primary,fontFamily:'Inter_600SemiBold',fontSize:13.5}}>Also create a cover letter →</Text></TouchableOpacity>
        </View>)}

        {/* Nav */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:24, gap:12 }}>
          <TouchableOpacity onPress={()=>setStep(s=>Math.max(s-1,0))} disabled={step===0} style={[st.navGhost,{opacity:step===0?0.4:1}]}><ChevronLeft size={16} color={colors.textMuted} /><Text style={st.navGhostTxt}>Back</Text></TouchableOpacity>
          {step<STEPS.length-1 && <TouchableOpacity onPress={()=>setStep(s=>Math.min(s+1,STEPS.length-1))} style={st.navPrimary}><Text style={st.navPrimaryTxt}>Continue</Text><ArrowRight size={16} color="#fff" /></TouchableOpacity>}
        </View>
      </ScrollView>

      {/* Preview modal — renders resume via WebView-like (Print preview not inline in RN; show text summary) */}
      <Modal visible={showPreview} animationType="slide" onRequestClose={()=>setShowPreview(false)}>
        <SafeAreaView style={{ flex:1, backgroundColor:colors.forest }}>
          <View style={st.modalHead}><Text style={st.modalTitle}>Preview · {tpl.name}</Text><TouchableOpacity onPress={()=>setShowPreview(false)}><X size={22} color="#fff" /></TouchableOpacity></View>
          <ScrollView style={{ flex:1, backgroundColor:'#fff', margin:14, borderRadius:12 }} contentContainerStyle={{ padding:22 }}>
            <Text style={{ fontSize:22, fontFamily:'Inter_700Bold', color:tpl.dark }}>{heading.name||'Your Name'}</Text>
            <Text style={{ fontSize:13, color:tpl.accent, marginTop:2 }}>{heading.title}</Text>
            <Text style={{ fontSize:10, color:'#888', marginTop:6 }}>{[heading.email,heading.phone,heading.location].filter(Boolean).join('  ·  ')}</Text>
            {summary?<><Text style={[st.pvSec,{color:tpl.accent,borderColor:tpl.accent}]}>SUMMARY</Text><Text style={st.pvBody}>{summary}</Text></>:null}
            {experience.some(e=>e.role||e.company)?<><Text style={[st.pvSec,{color:tpl.accent,borderColor:tpl.accent}]}>EXPERIENCE</Text>{experience.filter(e=>e.role||e.company).map((e,i)=>(<View key={i} style={{marginBottom:8}}><Text style={{fontSize:13,fontFamily:'Inter_700Bold'}}>{e.role}{e.company?' — '+e.company:''}</Text><Text style={{fontSize:9,color:'#999'}}>{[e.start,e.end].filter(Boolean).join(' – ')}</Text><Text style={{fontSize:11,color:'#444',marginTop:2}}>{e.bullets}</Text></View>))}</>:null}
            {education.some(e=>e.degree||e.school)?<><Text style={[st.pvSec,{color:tpl.accent,borderColor:tpl.accent}]}>EDUCATION</Text>{education.filter(e=>e.degree||e.school).map((e,i)=>(<View key={i} style={{marginBottom:5}}><Text style={{fontSize:12,fontFamily:'Inter_600SemiBold'}}>{e.degree}</Text><Text style={{fontSize:10,color:'#999'}}>{e.school}{e.year?' · '+e.year:''}</Text></View>))}</>:null}
            {skills.length>0?<><Text style={[st.pvSec,{color:tpl.accent,borderColor:tpl.accent}]}>SKILLS</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:5}}>{skills.map(s=>(<Text key={s} style={{fontSize:10,color:tpl.accent,backgroundColor:tpl.accent+'18',paddingHorizontal:8,paddingVertical:2,borderRadius:4}}>{s}</Text>))}</View></>:null}
          </ScrollView>
          <TouchableOpacity onPress={()=>{setShowPreview(false);exportPDF();}} style={[st.downloadBtn,{margin:14}]}><Download size={18} color="#fff" /><Text style={st.downloadTxt}>Download PDF</Text></TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  headerTitle:{ fontSize:16, fontFamily:'Inter_700Bold', color:colors.text },
  previewBtn:{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderColor:colors.cardBorder, borderRadius:9, paddingHorizontal:11, paddingVertical:6 },
  previewTxt:{ fontSize:12.5, color:colors.primary, fontFamily:'Inter_600SemiBold' },
  progress:{ maxHeight:44, borderBottomWidth:1, borderBottomColor:colors.cardBorder, paddingVertical:8 },
  pStep:{ paddingHorizontal:11, paddingVertical:6, borderRadius:8, backgroundColor:'#F0EDE7' },
  pActive:{ backgroundColor:colors.primary },
  pDone:{ backgroundColor:'rgba(13,147,115,0.1)' },
  pTxt:{ fontSize:11.5, fontFamily:'Inter_600SemiBold', color:'#A8A196' },
  h2:{ fontSize:21, fontFamily:'Inter_700Bold', color:colors.text, letterSpacing:-0.3 },
  hint:{ fontSize:13, color:colors.textMuted, marginTop:4, marginBottom:16, lineHeight:19 },
  field:{ backgroundColor:'#FCFBF9', borderWidth:1, borderColor:'#D9D3C8', borderRadius:10, paddingHorizontal:14, paddingVertical:12, fontSize:15, color:colors.text, fontFamily:'Inter_400Regular' },
  label:{ fontSize:13, fontFamily:'Inter_600SemiBold', color:colors.text, marginBottom:6 },
  chip:{ paddingHorizontal:13, paddingVertical:6, borderRadius:18, backgroundColor:'#F0EDE7' },
  chipOn:{ backgroundColor:colors.forest },
  chipTxt:{ fontSize:12.5, fontFamily:'Inter_600SemiBold', color:colors.textMuted },
  tplCard:{ width:'47%', borderWidth:1, borderColor:colors.cardBorder, borderRadius:12, overflow:'hidden', backgroundColor:'#fff' },
  tplThumb:{ height:120, position:'relative' },
  tplCheck:{ position:'absolute', top:6, right:6, width:20, height:20, borderRadius:10, alignItems:'center', justifyContent:'center', zIndex:2 },
  tplName:{ fontSize:12, fontFamily:'Inter_600SemiBold', color:colors.text, padding:8, borderTopWidth:1, borderTopColor:colors.cardBorder },
  subCard:{ backgroundColor:colors.bg, borderRadius:14, padding:14, marginBottom:12, borderWidth:1, borderColor:colors.cardBorder },
  aiChip:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(13,147,115,0.08)', borderWidth:1, borderColor:'rgba(13,147,115,0.25)', paddingHorizontal:13, paddingVertical:8, borderRadius:10 },
  aiTxt:{ fontSize:13, color:colors.primary, fontFamily:'Inter_600SemiBold' },
  sugItem:{ flexDirection:'row', gap:7, backgroundColor:'#fff', borderWidth:1, borderColor:'rgba(13,147,115,0.25)', borderRadius:9, padding:10 },
  sugTxt:{ flex:1, fontSize:12.5, color:colors.text, lineHeight:18 },
  addBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderWidth:1, borderColor:'rgba(13,147,115,0.4)', borderStyle:'dashed', borderRadius:12, paddingVertical:12 },
  addTxt:{ fontSize:14, color:colors.primary, fontFamily:'Inter_600SemiBold' },
  addSkillBtn:{ backgroundColor:colors.primary, borderRadius:10, paddingHorizontal:18, alignItems:'center', justifyContent:'center' },
  skillPill:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(13,147,115,0.1)', paddingHorizontal:11, paddingVertical:6, borderRadius:8 },
  skillPillTxt:{ fontSize:13, color:colors.primary, fontFamily:'Inter_500Medium' },
  sugSkill:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#fff', borderWidth:1, borderColor:'rgba(13,147,115,0.3)', borderRadius:8, paddingHorizontal:11, paddingVertical:6 },
  doneIcon:{ width:60, height:60, borderRadius:18, backgroundColor:'rgba(13,147,115,0.15)', alignItems:'center', justifyContent:'center', marginBottom:16 },
  downloadBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:colors.primary, borderRadius:12, paddingVertical:15, paddingHorizontal:34, marginTop:8 },
  downloadTxt:{ color:'#fff', fontSize:16, fontFamily:'Inter_700Bold' },
  navGhost:{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderColor:colors.cardBorder, borderRadius:12, paddingHorizontal:18, paddingVertical:12 },
  navGhostTxt:{ fontSize:14, color:colors.textMuted, fontFamily:'Inter_600SemiBold' },
  navPrimary:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:colors.primary, borderRadius:12, paddingHorizontal:22, paddingVertical:12 },
  navPrimaryTxt:{ fontSize:14, color:'#fff', fontFamily:'Inter_700Bold' },
  modalHead:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16 },
  modalTitle:{ color:'#fff', fontSize:15, fontFamily:'Inter_700Bold' },
  pvSec:{ fontSize:9, fontFamily:'Inter_700Bold', letterSpacing:1, borderBottomWidth:1.5, paddingBottom:3, marginTop:14, marginBottom:7 },
  pvBody:{ fontSize:11, lineHeight:17, color:'#333' },
});
