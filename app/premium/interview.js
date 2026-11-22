import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { colors } from '../../lib/colors';

const API_BASE = 'https://www.jobsaisle.com';

export default function InterviewScreen() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState('');

  async function generate() {
    if (!role.trim()) { setError('Enter a job role'); return; }
    setLoading(true); setError(''); setCategories(null);
    try {
      const u = await AsyncStorage.getItem('user');
      const uid = u ? JSON.parse(u).uid : '';
      const r = await fetch(`${API_BASE}/api/premium/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, role: role.trim() }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); }
      else if (d.categories) { setCategories(d); }
      else { setError('Could not generate questions. Try again.'); }
    } catch (e) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  function toggle(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={st.headerTitle}>Interview Prep</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={st.searchCard}>
          <Text style={st.label}>Job Role</Text>
          <TextInput style={st.input} placeholder="e.g. Product Manager" placeholderTextColor={colors.textGhost} value={role} onChangeText={setRole} returnKeyType="go" onSubmitEditing={generate} />
          <TouchableOpacity style={st.genBtn} onPress={generate} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (<><Sparkles size={16} color="#fff" /><Text style={st.genBtnText}>Generate Questions</Text></>)}
          </TouchableOpacity>
        </View>

        {loading && <Text style={st.hint}>Generating tailored interview questions… this takes ~15s</Text>}
        {error ? <Text style={st.error}>{error}</Text> : null}

        {categories && (
          <View style={{ marginTop: 20 }}>
            {categories.level && <Text style={st.levelText}>Level: {categories.level}</Text>}
            {categories.categories.map((cat, ci) => (
              <View key={ci} style={{ marginBottom: 18 }}>
                <Text style={st.catTitle}>{cat.name}</Text>
                {cat.questions.map((qa, qi) => {
                  const key = `${ci}-${qi}`;
                  const isOpen = expanded[key];
                  return (
                    <View key={qi} style={st.qCard}>
                      <TouchableOpacity onPress={() => toggle(key)} activeOpacity={0.7} style={st.qHeader}>
                        <Text style={st.qText}>{qa.q}</Text>
                        {isOpen ? <ChevronUp size={18} color={colors.textDim} /> : <ChevronDown size={18} color={colors.textDim} />}
                      </TouchableOpacity>
                      {isOpen && (
                        <View style={st.aBox}>
                          <Text style={st.aLabel}>MODEL ANSWER</Text>
                          <Text style={st.aText}>{qa.a}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
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
  searchCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, fontFamily: 'Inter_400Regular' },
  genBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  genBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  hint: { fontSize: 12, color: colors.textDim, textAlign: 'center', marginTop: 16, fontFamily: 'Inter_400Regular' },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'Inter_400Regular' },
  levelText: { fontSize: 12, color: colors.textDim, marginBottom: 14, fontFamily: 'Inter_500Medium' },
  catTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.primary, marginBottom: 10 },
  qCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  qHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14, gap: 10 },
  qText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text, flex: 1, lineHeight: 19 },
  aBox: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  aLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  aText: { fontSize: 13, color: colors.textMuted, lineHeight: 20, fontFamily: 'Inter_400Regular' },
});
