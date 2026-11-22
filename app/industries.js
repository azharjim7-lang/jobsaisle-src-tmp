import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { fetchProfile } from '../lib/profile';
import { colors } from '../lib/colors';

export default function IndustriesScreen() {
  const router = useRouter();
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('India');
  const [preferredCity, setPreferredCity] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          const p = await fetchProfile(parsed.uid);
          if (p?.preferredCities?.[0]) setPreferredCity(p.preferredCities[0]);
        }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`https://www.jobsaisle.com/api/industries?country=${country}&limit=25`);
        const d = await r.json();
        setIndustries(d?.industries || []);
      } catch {}
      setLoading(false);
    })();
  }, [country]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: 0.5, borderBottomColor: colors.cardBorder }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, color: colors.text, lineHeight: 22, marginTop: -2, fontFamily: 'Inter_500Medium' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: colors.text, fontFamily: 'Inter_700Bold' }}>Industries</Text>
          <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 1, fontFamily: 'Inter_400Regular' }}>Browse jobs by sector · {country}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingBottom: 32 }}>
          {industries.map((ind) => (
            <TouchableOpacity
              key={ind.id}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { sector: ind.id, preferredCity } })}
              activeOpacity={0.85}
              style={{ marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.cardBorder, borderRadius: 14, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 26 }}>{ind.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.text, fontFamily: 'Inter_700Bold' }}>{ind.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2, fontFamily: 'Inter_500Medium' }}>{ind.jobCount.toLocaleString()} jobs · {ind.companyCount} companies</Text>
                </View>
                <Text style={{ fontSize: 16, color: colors.textDim }}>›</Text>
              </View>
              {(ind.topCompanies || []).length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.cardBorder }}>
                  {ind.topCompanies.slice(0, 4).map(c => (
                    <Text key={c.name} style={{ fontSize: 10, color: colors.textMuted, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', fontFamily: 'Inter_400Regular' }}>
                      {c.name.slice(0, 20)} ({c.jobCount})
                    </Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
