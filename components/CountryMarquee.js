import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, TouchableOpacity, Linking } from 'react-native';
import { COUNTRIES, formatJobCount, flagUrl } from '../lib/countries';
import { colors } from '../lib/colors';

export default function CountryMarquee() {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out + slide up slightly
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -4, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setIdx(prev => (prev + 1) % COUNTRIES.length);
        // Reset position (below) then fade in + slide to 0
        translateY.setValue(4);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const c = COUNTRIES[idx];

  const openCountry = () => {
    // Open web view for that country's jobs listing
    Linking.openURL(`https://www.jobsaisle.com/jobs-in-${c.slug}`).catch(() => {});
  };

  return (
    <View style={{
      backgroundColor: colors.bg,
      
      
      paddingVertical: 0,
      paddingHorizontal: 16,
      alignItems: 'center',
    }}>
      <TouchableOpacity onPress={openCountry} activeOpacity={0.7}>
        <Animated.View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          opacity,
          transform: [{ translateY }],
        }}>
          <Text style={{ fontSize: 12, color: colors.textDim, fontFamily: 'Inter_400Regular' }}>Discover jobs in</Text>
          <Image
            source={{ uri: flagUrl(c.iso, 24) }}
            style={{ width: 16, height: 12, borderRadius: 2 }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{c.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textDim, fontFamily: 'Inter_400Regular' }}>·</Text>
          <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Inter_500Medium' }}>{formatJobCount(c.jobs)}+ open roles</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
