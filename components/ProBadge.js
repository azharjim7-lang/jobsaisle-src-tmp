import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { colors } from '../lib/colors';

// Beautiful Pro member badge — used where non-Pro users see upsell CTAs
export function ProBadge({ compact = false }) {
  if (compact) {
    return (
      <LinearGradient
        colors={['#0D2E23', '#0D9373']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' }}>
        <Crown size={12} color="#E2C06E" fill="#E2C06E" />
        <Text style={{ fontSize: 11, color: '#FFFFFF', fontFamily: 'Inter_700Bold', letterSpacing: 0.3 }}>Pro Member</Text>
      </LinearGradient>
    );
  }
  return (
    <LinearGradient
      colors={['#0C1F17', '#0D2E23', '#124234']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(226,192,110,0.25)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(226,192,110,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(226,192,110,0.3)' }}>
          <Crown size={20} color="#E2C06E" fill="#E2C06E" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, color: '#FFFFFF', fontFamily: 'Inter_700Bold' }}>You're a Pro Member</Text>
          </View>
          <Text style={{ fontSize: 11, color: 'rgba(226,192,110,0.85)', fontFamily: 'Inter_400Regular', marginTop: 2 }}>All premium tools unlocked ✦</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
