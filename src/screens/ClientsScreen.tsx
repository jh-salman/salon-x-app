import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { MOCK_CLIENTS } from '../data/clients';
import type { ClientSummary } from '../data/clients';

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
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: 28,
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#AAA',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: 'white',
  },
  rowContent: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: 'white',
    marginBottom: 2,
  },
  lastVisit: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: '#AAA',
  },
  chevron: {
    fontFamily: 'Lato_400Regular',
    fontSize: 24,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 64,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: '#666',
  },
});
