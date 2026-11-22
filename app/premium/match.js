import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, MapPin, Building2, Briefcase } from 'lucide-react-native';
import { colors } from '../../lib/colors';

const API_BASE = 'https://www.jobsaisle.com';

function scoreColor(score) {
  if (score >= 60) return colors.primary;
  if (score >= 40) return '#B8860B';
  return colors.textDim;
}

export default function MatchScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError('');
    try {
      const u = await AsyncStorage.getItem('user');
      const uid = u ? JSON.parse(u).uid : '';
      if (!uid) { router.push('/auth'); return; }
      const r = await fetch(`${API_BASE}/api/premium/smart-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const d = await r.json();
      setData(d);
    } catch (e) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={st.headerTitle}>Smart Job Match</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={st.center}><ActivityIndicator color={colors.primary} size="large" /><Text style={st.loadingText}>Finding your best matches…</Text></View>
      ) : error ? (
        <View style={st.center}><Text style={st.error}>{error}</Text><TouchableOpacity onPress={load} style={st.retryBtn}><Text style={st.retryText}>Retry</Text></TouchableOpacity></View>
      ) : data?.needsProfile ? (
        <View style={st.center}>
          <Text style={st.emptyTitle}>Complete your profile</Text>
          <Text style={st.emptyDesc}>Add your title, skills, and experience to get personalized job matches.</Text>
          <View style={st.progressBar}><View style={[st.progressFill, { width: `${data.completeness || 0}%` }]} /></View>
          <Text style={st.progressText}>{data.completeness || 0}% complete</Text>
          <TouchableOpacity onPress={() => router.push('/profile-setup')} style={st.ctaBtn}><Text style={st.ctaText}>Complete Profile →</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={st.countText}>{data?.count || 0} jobs matched to your profile</Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            {(data?.matches || []).map((job, i) => (
              <TouchableOpacity key={job.id || i} style={st.jobCard} activeOpacity={0.85}
                onPress={() => Linking.openURL(`${API_BASE}/job/${job.slug}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={st.jobTitle} numberOfLines={2}>{job.title}</Text>
                  <View style={[st.scoreBadge, { backgroundColor: scoreColor(job.matchScore) + '20' }]}>
                    <Text style={[st.scoreText, { color: scoreColor(job.matchScore) }]}>{job.matchScore}%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Building2 size={13} color={colors.textDim} />
                  <Text style={st.jobMeta}>{job.company}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 }}>
                  {job.city && (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><MapPin size={12} color={colors.textGhost} /><Text style={st.jobSubMeta}>{job.city}{job.country ? ', ' + job.country : ''}</Text></View>)}
                  {job.jobType && (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Briefcase size={12} color={colors.textGhost} /><Text style={st.jobSubMeta}>{job.jobType}</Text></View>)}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 13, color: colors.textDim, marginTop: 14, fontFamily: 'Inter_400Regular' },
  error: { color: '#DC2626', fontSize: 14, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  retryBtn: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  progressBar: { width: '80%', height: 8, backgroundColor: colors.cardBorder, borderRadius: 4, marginTop: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: colors.textDim, marginTop: 8, fontFamily: 'Inter_500Medium' },
  ctaBtn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  countText: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter_500Medium' },
  jobCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16 },
  jobTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text, flex: 1, marginRight: 10, lineHeight: 20 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  scoreText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  jobMeta: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter_500Medium' },
  jobSubMeta: { fontSize: 11, color: colors.textGhost, fontFamily: 'Inter_400Regular' },
});
