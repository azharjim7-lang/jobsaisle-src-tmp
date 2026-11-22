import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, TrendingUp, MapPin } from 'lucide-react-native';
import { colors } from '../../lib/colors';

const API_BASE = 'https://www.jobsaisle.com';

function fmt(n) {
  if (n == null) return '—';
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
}

export default function SalaryScreen() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function search() {
    if (!role.trim()) { setError('Enter a role to search'); return; }
    setLoading(true); setError(''); setData(null);
    try {
      const r = await fetch(`${API_BASE}/api/premium/salary-insights?role=${encodeURIComponent(role.trim())}&city=${encodeURIComponent(city.trim())}`);
      const d = await r.json();
      if (!d.found) { setError('No salary data found for this role. Try a broader term.'); }
      else setData(d);
    } catch (e) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  const cur = data?.currency || 'INR';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Salary Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Search inputs */}
        <View style={s.searchCard}>
          <Text style={s.label}>Job Role</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Marketing Manager"
            placeholderTextColor={colors.textGhost}
            value={role}
            onChangeText={setRole}
            returnKeyType="search"
            onSubmitEditing={search}
          />
          <Text style={[s.label, { marginTop: 12 }]}>City (optional)</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Dubai, Bengaluru"
            placeholderTextColor={colors.textGhost}
            value={city}
            onChangeText={setCity}
            returnKeyType="search"
            onSubmitEditing={search}
          />
          <TouchableOpacity style={s.searchBtn} onPress={search} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Search size={16} color="#fff" />
                <Text style={s.searchBtnText}>Get Salary Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {data && (
          <View style={{ marginTop: 20 }}>
            {/* Sample size */}
            <Text style={s.sampleText}>Based on {data.sampleSize?.toLocaleString()} jobs</Text>

            {/* Range card */}
            <View style={s.rangeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingUp size={18} color={colors.primary} />
                <Text style={s.cardTitle}>Salary Range</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={s.rangeLabel}>Minimum</Text>
                  <Text style={s.rangeVal}>{cur} {fmt(data.range?.min)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.cardBorder }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={s.rangeLabel}>Maximum</Text>
                  <Text style={s.rangeVal}>{cur} {fmt(data.range?.max)}</Text>
                </View>
              </View>
            </View>

            {/* Percentiles */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Percentiles</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                {[['25th', data.percentiles?.p25], ['Median', data.percentiles?.median], ['75th', data.percentiles?.p75]].map(([l, v]) => (
                  <View key={l} style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={s.pctLabel}>{l}</Text>
                    <Text style={s.pctVal}>{cur} {fmt(v)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* By city */}
            {data.byCity?.length > 0 && (
              <View style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={s.cardTitle}>Top Paying Locations</Text>
                </View>
                {data.byCity.slice(0, 6).map((c, i) => (
                  <View key={i} style={s.cityRow}>
                    <Text style={s.cityName} numberOfLines={1}>{c.city}</Text>
                    <Text style={s.cityAvg}>{cur} {fmt(c.avg)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.text },
  searchCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, fontFamily: 'Inter_400Regular' },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  searchBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'Inter_400Regular' },
  sampleText: { fontSize: 12, color: colors.textDim, textAlign: 'center', marginBottom: 14, fontFamily: 'Inter_400Regular' },
  rangeCard: { backgroundColor: 'rgba(13,147,115,0.06)', borderWidth: 1, borderColor: 'rgba(13,147,115,0.2)', borderRadius: 16, padding: 18, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: 18, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.text },
  rangeLabel: { fontSize: 11, color: colors.textDim, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  rangeVal: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary },
  pctLabel: { fontSize: 11, color: colors.textDim, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  pctVal: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  cityName: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter_400Regular', flex: 1, marginRight: 10 },
  cityAvg: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },
});
