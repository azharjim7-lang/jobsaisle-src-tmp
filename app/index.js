import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Version-specific onboarding key: bumping this forces existing users to see
// the country picker once when they update to a version with new setup steps
const COUNTRY_SETUP_KEY = 'ja:country_setup_v1';

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [seenCountrySetup, setSeenCountrySetup] = useState(false);

  useEffect(() => {
    (async () => {
      const [u, ob, cs] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('ja:onboarding_done'),
        AsyncStorage.getItem(COUNTRY_SETUP_KEY),
      ]);
      setHasUser(!!u);
      setSeenOnboarding(!!ob);
      setSeenCountrySetup(!!cs);
      setChecked(true);
    })();
  }, []);

  if (!checked) return null;

  // Fresh install: full onboarding (includes country picker at step 0)
  if (!seenOnboarding && !hasUser) return <Redirect href="/onboarding" />;

  // Existing users on new version: show country picker once
  if (!seenCountrySetup) return <Redirect href="/onboarding" />;

  return <Redirect href={hasUser ? '/(tabs)' : '/auth'} />;
}
