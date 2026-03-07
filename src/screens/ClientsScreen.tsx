import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { MOCK_CLIENTS } from '../data/clients';
import type { ClientSummary } from '../data/clients';
import { wp, hp, ms } from '../utils/responsive';

function ClientRow({ item }: { item: ClientSummary }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push({ pathname: '/client/[id]', params: { id: item.id } })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.clientName.charAt(0)}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.lastVisit}>
          Last visit: {format(item.lastVisit, 'MMM d, yyyy')}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function ClientsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Text style={styles.subtitle}>{MOCK_CLIENTS.length} clients</Text>
      </View>
      <FlatList
        data={MOCK_CLIENTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClientRow item={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No clients yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(28),
    color: 'white',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: '#AAA',
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: ms(4),
  },
  rowPressed: { opacity: 0.7 },
  avatar: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  avatarText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(18),
    color: 'white',
  },
  rowContent: { flex: 1 },
  clientName: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
    color: 'white',
    marginBottom: hp(0.25),
  },
  lastVisit: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(12),
    color: '#AAA',
  },
  chevron: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(24),
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: ms(64),
  },
  empty: {
    paddingVertical: hp(6),
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(16),
    color: '#666',
  },
});
