import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../lib/colors';
export default function SkillsScreen() {
  const router = useRouter();
  useEffect(() => {
    WebBrowser.openBrowserAsync('https://www.jobsaisle.com/skills', { toolbarColor: colors.bg, controlsColor: colors.primary })
      .finally(() => router.back());
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </SafeAreaView>
  );
}
