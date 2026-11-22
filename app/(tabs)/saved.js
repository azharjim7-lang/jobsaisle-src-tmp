import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '../../lib/colors';
import { getSaved, toggleSaved } from '../../lib/storage';
import ProCTA from '../../components/ProCTA';

const BG = ['rgba(52,211,153,0.12)','rgba(226,192,110,0.12)','rgba(99,102,241,0.12)','rgba(244,114,182,0.12)','rgba(251,146,60,0.12)','rgba(56,189,248,0.12)'];

function timeAgo(t) {
  if (!t) return '';
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return days + 'd ago';
  return Math.floor(days / 7) + 'w ago';
}

function CompanyIcon({ company }) {
  if (!company) return null;
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return <Image source={{ uri: 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64' }} style={{ width: 22, height: 22, borderRadius: 4 }} resizeMode="contain" />;
}

export default function SavedScreen() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    getSaved().then(d => { setItems(d); setLoaded(true); });
  }, []));

  const onUnsave = async (job) => {
    await toggleSaved(job);
    setItems(await getSaved());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ProCTA label="Save more — unlock recruiter emails" />
      <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text }}>Saved Jobs</Text>
        <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 4, fontFamily: 'Inter_400Regular' }}>
          {items.length === 0 ? 'Tap ♡ on any job to save' : `${items.length} saved`}
        </Text>
      </View>

      {loaded && items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>♡</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>No saved jobs yet</Text>
          <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 6, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
            Tap the heart icon on any job to bookmark it for later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(j) => j.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const ci = (item.company || '?').charCodeAt(0) % 6;
            return (
              <TouchableOpacity
                onPress={() => item.slug && router.push('/job/' + item.slug)}
                activeOpacity={0.7}
                style={{ backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: BG[ci], alignItems: 'center', justifyContent: 'center' }}>
                    <CompanyIcon company={item.company} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, fontFamily: 'Inter_400Regular' }} numberOfLines={1}>
                      {item.company}{item.city ? ' · ' + item.city : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onUnsave(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ fontSize: 18, color: colors.primary }}>♥</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontFamily: 'Inter_700Bold' }}>{item.salaryDisplay || 'Competitive'}</Text>
                  <Text style={{ fontSize: 10, color: colors.textGhost, fontFamily: 'Inter_400Regular' }}>Saved {timeAgo(item.savedAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
