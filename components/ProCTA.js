import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../lib/colors';

export default function ProCTA({ label = "Get recruiters' direct emails" }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (!u) { if (on) setShow(true); return; }
        const uid = JSON.parse(u).uid;
        const r = await fetch('https://www.jobsaisle.com/api/premium/status', { headers: { 'x-user-id': uid } });
        const d = await r.json();
        if (on) setShow(!d.isPremium);
      } catch { if (on) setShow(true); }
    })();
    return () => { on = false; };
  }, []);
  if (!show) return null;
  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)/pro')} activeOpacity={0.85}
      style={{ marginHorizontal: 16, marginTop: 10, marginBottom: 4, padding: 14, backgroundColor: 'rgba(226,192,110,0.06)', borderWidth: 0.5, borderColor: 'rgba(226,192,110,0.2)', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, color: colors.gold, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>✦ PRO</Text>
        <Text style={{ fontSize: 13, color: colors.text, marginTop: 3, fontFamily: 'Inter_600SemiBold' }}>{label}</Text>
      </View>
      <View style={{ backgroundColor: colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
        <Text style={{ fontSize: 11, color: colors.bg, fontFamily: 'Inter_700Bold' }}>Unlock</Text>
      </View>
    </TouchableOpacity>
  );
}
