import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image, Alert, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COUNTRIES, getSelectedCountry, setSelectedCountry, DEFAULT_COUNTRY, flagUrl } from '../lib/countries';
import { colors } from '../lib/colors';

export default function CountrySwitcher({ onChange }) {
  const [selected, setSelected] = useState(DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getSelectedCountry();
      if (c) setSelected(c);
    })();
  }, []);

  const handlePick = async (country) => {
    if (country.code === selected.code) { setOpen(false); return; }
    setSelected(country);
    setOpen(false);
    await setSelectedCountry(country.code);
    DeviceEventEmitter.emit('ja:countryChanged', country.code);
    if (onChange) onChange(country);
    // Trigger re-fetch on home screen — brute-force via a small delay + AsyncStorage nudge
    // Home screen re-reads country on focus, so this reload isn't strictly required in RN
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <Image
          source={{ uri: flagUrl(selected.iso, 24) }}
          style={{ width: 18, height: 13, borderRadius: 2 }}
          resizeMode="cover"
        />
        <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{selected.name}</Text>
        <Text style={{ fontSize: 10, color: colors.textDim }}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent={false} onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 24, color: colors.text, fontFamily: 'Inter_500Medium' }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 16, color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center', marginRight: 20 }}>Select Country</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {COUNTRIES.map(c => (
              <TouchableOpacity
                key={c.code}
                onPress={() => handlePick(c)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  gap: 12,
                  borderRadius: 12,
                  backgroundColor: c.code === selected.code ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: c.code === selected.code ? colors.primary : colors.cardBorder,
                }}
              >
                <Image
                  source={{ uri: flagUrl(c.iso, 48) }}
                  style={{ width: 30, height: 22, borderRadius: 3 }}
                  resizeMode="cover"
                />
                <Text style={{
                  flex: 1,
                  fontSize: 15,
                  color: c.code === selected.code ? '#FFFFFF' : colors.text,
                  fontFamily: 'Inter_600SemiBold',
                }}>{c.name}</Text>
                {c.code === selected.code && <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
