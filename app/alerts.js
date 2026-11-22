import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Loader from '../components/Loader';
import { colors } from '../lib/colors';
import { getAlerts, addAlert, removeAlert, toggleAlert } from '../lib/storage';

export default function AlertsScreen() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const [savingAlert, setSavingAlert] = useState(false);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    getAlerts().then(d => { setItems(d); setLoaded(true); });
  }, []));

  const onAdd = async () => {
    if (!newQuery.trim()) return;
    const next = await addAlert({ query: newQuery, country: null, city: null });
    setItems(next || []);
    setNewQuery('');
    setAdding(false);
  };

  const onToggle = async (key) => {
    setItems(await toggleAlert(key));
  };

  const onRemove = (item) => {
    Alert.alert('Delete alert?', `"${item.query}"`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: async () => setItems(await removeAlert(item.key)) },
    ]);
  };

  const enabledCount = items.filter(a => a.enabled).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Loader visible={savingAlert} title="Creating your alert" subtitle="Setting things up..." />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, color: colors.text, lineHeight: 22, marginTop: -2, fontFamily: 'Inter_500Medium' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text }}>Job Alerts</Text>
          <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 2, fontFamily: 'Inter_400Regular' }}>
            {items.length === 0 ? 'Get notified about new matching jobs' : `${enabledCount} active · ${items.length} total`}
          </Text>
        </View>
      </View>

      {/* Add new */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        {adding ? (
          <View style={{ backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.cardBorder, borderRadius: 14, padding: 12, gap: 10 }}>
            <TextInput
              value={newQuery}
              onChangeText={setNewQuery}
              placeholder="e.g. Data Analyst, Marketing Manager"
              placeholderTextColor={colors.textDim}
              autoFocus
              style={{ backgroundColor: colors.inputBg, borderWidth: 0.5, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, fontFamily: 'Inter_400Regular' }}
            />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => { setAdding(false); setNewQuery(''); }} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onAdd} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: colors.bg, fontFamily: 'Inter_700Bold' }}>Create alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setAdding(true)} style={{ backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.cardBorder, borderStyle: 'dashed', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16, color: colors.primary }}>+</Text>
            <Text style={{ fontSize: 13, color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Create new alert</Text>
          </TouchableOpacity>
        )}
      </View>

      {loaded && items.length === 0 && !adding ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>No alerts yet</Text>
          <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 6, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
            Save a search to get notified when matching jobs are posted.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 4 }}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.cardBorder, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: item.enabled ? '#fff' : colors.textMuted }} numberOfLines={1}>{item.query}</Text>
                <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 3, fontFamily: 'Inter_400Regular' }}>
                  {[item.country, item.city].filter(Boolean).join(' · ') || 'All locations'}
                </Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => onToggle(item.key)}
                trackColor={{ false: colors.cardBorder, true: 'rgba(52,211,153,0.3)' }}
                thumbColor={item.enabled ? colors.primary : '#666'}
              />
              <TouchableOpacity onPress={() => onRemove(item)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 14, color: colors.textDim }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            items.length > 0 ? (
              <View style={{ paddingTop: 16, paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 10, color: colors.textGhost, textAlign: 'center', lineHeight: 15, fontFamily: 'Inter_400Regular' }}>
                  Email & push notifications coming soon. For now your alerts are saved on this device.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
