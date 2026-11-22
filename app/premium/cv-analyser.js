import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { ChevronLeft, Sparkles, Upload, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors } from '../../lib/colors';

const API_BASE = 'https://www.jobsaisle.com';

function gradeColor(score) {
  if (score >= 75) return colors.primary;
  if (score >= 50) return '#B8860B';
  return '#DC2626';
}

export default function CVAnalyserScreen() {
  const router = useRouter();
  const [cvText, setCvText] = useState('');
  const [role, setRole] = useState('');
  const [region, setRegion] = useState('gulf');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (!file) return;
      setFileName(file.name);
      setError('');
      setLoading(true);
      try {
        const FileSystem = await import('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
        const r = await fetch(`${API_BASE}/api/premium/cv-extract`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64 }),
        });
        const d = await r.json();
        if (d.text && d.text.length > 20) { setCvText(d.text); }
        else { setError(d.error || 'Could not read PDF. Please paste your resume text instead.'); }
      } catch (ex) { setError('Could not read PDF. Please paste your resume text instead.'); }
      setLoading(false);
    } catch (e) { Alert.alert('Error', 'Could not pick file. Paste your resume text instead.'); }
  }

  async function analyse() {
    if (!cvText.trim() || cvText.trim().length < 50) { setError('Paste your resume text (at least a few lines)'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const u = await AsyncStorage.getItem('user');
      const uid = u ? JSON.parse(u).uid : '';
      const r = await fetch(`${API_BASE}/api/premium/cv-analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, cvText: cvText.trim(), targetJobTitle: role.trim(), targetRegion: region, fileName }),
      });
      const d = await r.json();
      if (r.status === 429) { setError('Monthly limit reached (3/3).'); }
      else if (d.error) { setError(d.error); }
      else setResult(d);
    } catch (e) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={st.headerTitle}>CV Analyser</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!result && (
          <View style={st.card}>
            <TouchableOpacity style={st.uploadBtn} onPress={pickFile} activeOpacity={0.8}>
              <Upload size={16} color={colors.primary} />
              <Text style={st.uploadText}>{fileName || 'Pick PDF (optional)'}</Text>
            </TouchableOpacity>
            <Text style={st.label}>Paste your resume text</Text>
            <TextInput style={st.textArea} placeholder="Paste your full resume text here…" placeholderTextColor={colors.textGhost} value={cvText} onChangeText={setCvText} multiline numberOfLines={8} textAlignVertical="top" />
            <Text style={[st.label, { marginTop: 12 }]}>Target Role (optional)</Text>
            <TextInput style={st.input} placeholder="e.g. Marketing Manager" placeholderTextColor={colors.textGhost} value={role} onChangeText={setRole} />
            <Text style={[st.label, { marginTop: 12 }]}>Target Market</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              {[['gulf', 'Gulf'], ['india', 'India']].map(([val, lbl]) => (
                <TouchableOpacity key={val} onPress={() => setRegion(val)} style={[st.regionBtn, region === val && st.regionBtnActive]}>
                  <Text style={[st.regionText, region === val && st.regionTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={st.analyseBtn} onPress={analyse} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (<><Sparkles size={16} color="#fff" /><Text style={st.analyseBtnText}>Analyse My CV</Text></>)}
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={st.error}>{error}</Text> : null}

        {result && (
          <View>
            <View style={st.scoreCard}>
              <Text style={st.scoreLabel}>Overall Score</Text>
              <Text style={[st.scoreBig, { color: gradeColor(result.overall_score) }]}>{result.overall_score}<Text style={st.scoreOutOf}>/100</Text></Text>
              {result.grade && <View style={[st.gradeBadge, { backgroundColor: gradeColor(result.overall_score) + '20' }]}><Text style={[st.gradeText, { color: gradeColor(result.overall_score) }]}>Grade {result.grade}</Text></View>}
              {result.ats_score != null && <Text style={st.atsText}>ATS Score: {result.ats_score}/100</Text>}
            </View>

            {result.summary && <View style={st.card}><Text style={st.summaryText}>{result.summary}</Text></View>}

            {result.strengths?.length > 0 && (
              <View style={st.card}>
                <Text style={st.sectionTitle}>Strengths</Text>
                {result.strengths.map((s, i) => (<View key={i} style={st.bulletRow}><CheckCircle2 size={15} color={colors.primary} /><Text style={st.bulletText}>{s}</Text></View>))}
              </View>
            )}

            {result.weaknesses?.length > 0 && (
              <View style={st.card}>
                <Text style={st.sectionTitle}>Areas to Improve</Text>
                {result.weaknesses.map((w, i) => (<View key={i} style={st.bulletRow}><AlertCircle size={15} color="#B8860B" /><Text style={st.bulletText}>{w}</Text></View>))}
              </View>
            )}

            {result.action_items?.length > 0 && (
              <View style={st.card}>
                <Text style={st.sectionTitle}>Action Items</Text>
                {result.action_items.map((a, i) => (<View key={i} style={st.actionRow}><Text style={st.actionNum}>{i + 1}</Text><Text style={st.bulletText}>{a}</Text></View>))}
              </View>
            )}

            {result.market_tips?.length > 0 && (
              <View style={st.card}>
                <Text style={st.sectionTitle}>Market Tips</Text>
                {result.market_tips.map((t, i) => (<Text key={i} style={st.tipText}>• {t}</Text>))}
              </View>
            )}

            <TouchableOpacity style={st.againBtn} onPress={() => { setResult(null); setCvText(''); }} activeOpacity={0.85}>
              <Text style={st.againText}>Analyse Another CV</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.text },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 16, marginBottom: 12 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, marginBottom: 14 },
  uploadText: { fontSize: 13, color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, marginBottom: 6 },
  textArea: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: colors.text, fontFamily: 'Inter_400Regular', minHeight: 140 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, fontFamily: 'Inter_400Regular' },
  regionBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, alignItems: 'center' },
  regionBtnActive: { backgroundColor: 'rgba(13,147,115,0.1)', borderColor: colors.primary },
  regionText: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter_500Medium' },
  regionTextActive: { color: colors.primary, fontFamily: 'Inter_700Bold' },
  analyseBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  analyseBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginVertical: 12, fontFamily: 'Inter_400Regular' },
  scoreCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 12 },
  scoreLabel: { fontSize: 12, color: colors.textDim, fontFamily: 'Inter_500Medium' },
  scoreBig: { fontSize: 48, fontFamily: 'Inter_700Bold', marginTop: 4 },
  scoreOutOf: { fontSize: 18, color: colors.textGhost },
  gradeBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  gradeText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  atsText: { fontSize: 12, color: colors.textMuted, marginTop: 10, fontFamily: 'Inter_500Medium' },
  summaryText: { fontSize: 13, color: colors.textMuted, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.text, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bulletText: { fontSize: 13, color: colors.textMuted, lineHeight: 19, flex: 1, fontFamily: 'Inter_400Regular' },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  actionNum: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff', backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 10, textAlign: 'center', lineHeight: 20, overflow: 'hidden' },
  tipText: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 6, fontFamily: 'Inter_400Regular' },
  againBtn: { backgroundColor: colors.forest, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  againText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
