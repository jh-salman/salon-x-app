import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { LocalAuthSession } from '../data/types';

const KEY = 'salonx_auth_session_v2';

export type PersistedAuth = {
  token: string;
  user: LocalAuthSession;
};

async function setItem(raw: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY, raw);
  } else {
    await SecureStore.setItemAsync(KEY, raw);
  }
}

async function getItem(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

async function removeItem(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(KEY);
  } else {
    await SecureStore.deleteItemAsync(KEY);
  }
}

export async function loadPersistedAuth(): Promise<PersistedAuth | null> {
  try {
    const raw = await getItem();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    if (!parsed?.token || !parsed?.user?.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function savePersistedAuth(data: PersistedAuth): Promise<void> {
  await setItem(JSON.stringify(data));
}

export async function clearPersistedAuth(): Promise<void> {
  await removeItem();
}
