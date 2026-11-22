import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../lib/colors';
import { COUNTRIES, setSelectedCountry, formatJobCount, flagUrl } from '../lib/countries';

const { width: WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌊',
    title: 'Jobs across India, Gulf & Southeast Asia',
    subtitle: 'Curated roles from top employers in Delhi, Dubai, Riyadh, Singapore, Kuala Lumpur and more.',
  },
  {
    emoji: '⚡',
    title: 'Matched to you',
    subtitle: 'Personalized recommendations based on your skills, experience, and preferred cities.',
  },
  {
    emoji: '💼',
    title: 'Apply with one tap',
    subtitle: 'Save your profile once, then apply to any role instantly. Track your applications.',
  },
];

// Country picker is step 0. Then SLIDES are steps 1..3. Total 4 steps.
const TOTAL_STEPS = 1 + SLIDES.length;

function CountryPicker({ selected, onSelect }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}>
      <Text style={{ fontSize: 28, color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 8 }}>
        Where are you looking for jobs?
      </Text>
      <Text style={{ fontSize: 14, color: colors.textDim, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
        Pick your country to see jobs relevant to you. You can change this anytime.
      </Text>
      <View style={{ gap: 10 }}>
        {COUNTRIES.map(c => (
          <TouchableOpacity
            key={c.code}
            onPress={() => onSelect(c.code)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selected === c.code ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: selected === c.code ? colors.primary : colors.cardBorder,
              borderRadius: 12,
              padding: 14,
              gap: 12,
            }}
          >
            <Image
              source={{ uri: flagUrl(c.iso, 48) }}
              style={{ width: 32, height: 24, borderRadius: 3 }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                color: selected === c.code ? '#FFFFFF' : colors.text,
                fontFamily: 'Inter_600SemiBold',
              }}>{c.name}</Text>
              <Text style={{
                fontSize: 12,
                color: selected === c.code ? 'rgba(255,255,255,0.85)' : colors.textDim,
                fontFamily: 'Inter_400Regular',
                marginTop: 2,
              }}>{formatJobCount(c.jobs)}+ open roles</Text>
            </View>
            {selected === c.code && (
              <Text style={{ fontSize: 20, color: '#FFFFFF' }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pickedCountry, setPickedCountry] = useState('IN');

  const finish = async () => {
    // Save country selection
    if (pickedCountry) await setSelectedCountry(pickedCountry);
    await AsyncStorage.setItem('ja:onboarding_done', '1');
    await AsyncStorage.setItem('ja:country_setup_v1', '1');
    // If user already logged in (existing user going through country setup), go to tabs
    // Otherwise go to auth
    const existingUser = await AsyncStorage.getItem('user');
    router.replace(existingUser ? '/(tabs)' : '/auth');
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };

  // Step 0: country picker
  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, paddingTop: 20 }}>
          <CountryPicker selected={pickedCountry} onSelect={setPickedCountry} />
        </View>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === step ? colors.primary : colors.cardBorder,
            }} />
          ))}
        </View>
        {/* Button */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          <TouchableOpacity
            onPress={next}
            disabled={!pickedCountry}
            style={{
              backgroundColor: pickedCountry ? colors.primary : colors.cardBorder,
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, color: '#FFFFFF', fontFamily: 'Inter_700Bold' }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Steps 1..3: the original slides
  const slide = SLIDES[step - 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 96, marginBottom: 32 }}>{slide.emoji}</Text>
        <Text style={{ fontSize: 24, color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 12 }}>{slide.title}</Text>
        <Text style={{ fontSize: 14, color: colors.textDim, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 }}>{slide.subtitle}</Text>
      </View>
      {/* Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={{
            width: i === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === step ? colors.primary : colors.cardBorder,
          }} />
        ))}
      </View>
      {/* Buttons */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
        <TouchableOpacity
          onPress={() => setStep(step - 1)}
          style={{ flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 14, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={next}
          style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_700Bold' }}>
            {step === TOTAL_STEPS - 1 ? 'Get started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
