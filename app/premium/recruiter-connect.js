import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Search, Linkedin, Mail, Building2 } from 'lucide-react-native';
import { colors } from '../../lib/colors';

const API_BASE = 'https://www.jobsaisle.com';

export default function RecruiterScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState('');
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [recruiters, setRecruiters] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('user').then(u => { if (u) setUser(JSON.parse(u)); });
  }, []);

  async function search() {
    if (!company.trim()) { setError('Enter a company name'); return; }
    if (!user) { router.push('/auth'); return; }
    setLoading(true); setError(''); setRecruiters(null);
    try {
      const r = await fetch(`${API_BASE}/api/premium/recruiter-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, companyName: company.trim(), department: dept.trim() || undefined }),
      });
      const d = await r.json();
      if (r.status === 429) { setError('Monthly limit reached (3/3). Resets next month.'); }
      else if (d.error) { setError(d.error); }
      else {
        const list = (d.recruiters || []).filter(x => !x.isPositionCard);
        if (list.length === 0) setError('No recruiters found. Try a larger or differently-named company.');
        setRecruiters(list);
        setUsage(d.usage);
      }
    } catch (e) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={st.headerTitle}>Recruiter Connect</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={st.searchCard}>
          <Text style={st.label}>Company Name</Text>
          <TextInput style={st.input} placeholder="e.g. Google, Emaar" placeholderTextColor={colors.textGhost} value={company} onChangeText={setCompany} returnKeyType="search" onSubmitEditing={search} />
          <Text style={[st.label, { marginTop: 12 }]}>Department (optional)</Text>
          <TextInput style={st.input} placeholder="e.g. Engineering, Sales" placeholderTextColor={colors.textGhost} value={dept} onChangeText={setDept} returnKeyType="search" onSubmitEditing={search} />
          <TouchableOpacity style={st.searchBtn} onPress={search} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (<><Search size={16} color="#fff" /><Text style={st.searchBtnText}>Find Recruiters</Text></>)}
          </TouchableOpacity>
          {usage && <Text style={st.usageText}>{usage.remaining} of 3 searches left this month</Text>}
        </View>

        {error ? <Text style={st.error}>{error}</Text> : null}

        {recruiters && recruiters.length > 0 && (
          <View style={{ marginTop: 20, gap: 12 }}>
            {recruiters.map((rec, i) => (
              <View key={rec.prospect_id || i} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={st.avatar}><Text style={st.avatarText}>{(rec.name || 'R').split(' ').map(w => w[0]).slice(0, 2).join('')}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.recName}>{rec.name}</Text>
                    <Text style={st.recTitle} numberOfLines={1}>{rec.title}</Text>
                  </View>
                </View>
                <View style={st.recMeta}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Building2 size={13} color={colors.textDim} />
                    <Text style={st.recMetaText} numberOfLines={1}>{rec.company}{rec.location ? ' · ' + rec.location : ''}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  {rec.email_masked && (
                    <View style={st.emailPill}><Mail size={13} color={colors.primary} /><Text style={st.emailText}>{rec.email_masked}</Text></View>
                  )}
                  {rec.linkedin && (
                    <TouchableOpacity style={st.linkedinBtn} onPress={() => Linking.openURL(rec.linkedin.startsWith('http') ? rec.linkedin : 'https://' + rec.linkedin)} activeOpacity={0.8}>
                      <Linkedin size={14} color="#fff" /><Text style={st.linkedinText}>LinkedIn</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  searchBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  searchBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  usageText: { fontSize: 11, color: colors.textDim, textAlign: 'center', marginTop: 10, fontFamily: 'Inter_400Regular' },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'Inter_400Regular' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(13,147,115,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.primary },
  recName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text },
  recTitle: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter_400Regular', marginTop: 2 },
  recMeta: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  recMetaText: { fontSize: 12, color: colors.textDim, fontFamily: 'Inter_400Regular', flex: 1 },
  emailPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(13,147,115,0.08)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  emailText: { fontSize: 12, color: colors.primary, fontFamily: 'Inter_500Medium' },
  linkedinBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.linkedin, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  linkedinText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_600SemiBold' },
});
