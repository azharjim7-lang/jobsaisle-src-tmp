import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../lib/colors';

export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#E8E4DC', opacity }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={15} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={12} />
    </View>
  );
}

export function SkeletonJobCard() {
  return (
    <View style={s.card}>
      <Skeleton width="80%" height={16} style={{ marginBottom: 10 }} />
      <Skeleton width="50%" height={13} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Skeleton width={70} height={22} radius={6} />
        <Skeleton width={90} height={22} radius={6} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5, type = 'card' }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        type === 'job' ? <SkeletonJobCard key={i} /> : <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 16 },
});
