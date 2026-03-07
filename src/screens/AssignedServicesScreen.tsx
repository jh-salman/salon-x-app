import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useServices } from '../context/ServicesContext';
import { useAssignedServices } from '../context/AssignedServicesContext';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import type { ServiceOption } from '../data/services';
import { CALENDAR_COLORS } from '../data/services';

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}hr ${m}min` : `${h}hr`;
}

const HiddenEyeIcon = ({ size = 24, color = '#888' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.74 1.74c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
      fill={color}
    />
  </Svg>
);

const CheckIcon = ({ size = 22, color = '#E53935' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      fill={color}
    />
  </Svg>
);

type ServiceRowProps = {
  service: ServiceOption;
  index: number;
  selected: boolean;
  onPress: () => void;
};

function ServiceRow({ service, index, selected, onPress }: ServiceRowProps) {
  const barColor = service.calendarColor ?? CALENDAR_COLORS[index % CALENDAR_COLORS.length];
  const hidden = service.showOnWebsite === false;
  const durationStr = service.duration != null ? formatDuration(service.duration) : '—';
  const priceStr = service.price != null ? `$${service.price}` : '$0';
  const categoryStr = service.categoryName ?? 'Service';

  return (
    <Pressable
      style={[styles.serviceRow, selected && styles.serviceRowSelected]}
      onPress={onPress}
    >
      <View style={[styles.colorBar, { backgroundColor: barColor }]} />
      <View style={styles.serviceIconWrap}>
        {service.imageUri ? (
          <Image source={{ uri: service.imageUri }} style={styles.serviceImage} />
        ) : hidden ? (
          <View style={styles.serviceIconPlaceholder}>
            <HiddenEyeIcon size={28} color="#888" />
          </View>
        ) : (
          <View style={styles.serviceIconPlaceholder}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                fill="#666"
              />
            </Svg>
          </View>
        )}
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
        <Text style={styles.serviceMeta} numberOfLines={1}>
          {durationStr} · {priceStr} · {categoryStr}
        </Text>
      </View>
      {selected && (
        <View style={styles.checkWrap}>
          <CheckIcon size={22} color="#E53935" />
        </View>
      )}
    </Pressable>
  );
}

export function AssignedServicesScreen() {
  const router = useRouter();
  const { services } = useServices();
  const { assignedIds, setAssignedIds, toggleAssigned, isAssigned } = useAssignedServices();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(assignedIds));

  useFocusEffect(
    useCallback(() => {
      setSelectedIds(new Set(assignedIds));
    }, [assignedIds])
  );

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.categoryName?.toLowerCase().includes(q) ?? false)
    );
  }, [services, search]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDone = useCallback(() => {
    setAssignedIds(Array.from(selectedIds));
    router.back();
  }, [selectedIds, setAssignedIds, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pick Service.</Text>
        <TouchableOpacity onPress={handleDone} style={styles.doneBtn} activeOpacity={0.7}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Services & Categories."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredServices.map((service, index) => (
          <ServiceRow
            key={service.id}
            service={service}
            index={index}
            selected={selectedIds.has(service.id)}
            onPress={() => handleToggle(service.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: RFValue(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: RFValue(18), fontWeight: '700', color: '#FFFFFF' },
  doneBtn: { paddingVertical: hp(0.5), paddingHorizontal: wp(2) },
  doneText: { fontSize: RFValue(16), fontWeight: '600', color: highlightColors.neonPink },
  searchWrap: { paddingHorizontal: wp(4), paddingVertical: hp(1.5) },
  searchInput: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: wp(4),
    fontSize: RFValue(14),
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(6), paddingHorizontal: wp(4) },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    marginBottom: hp(1),
    overflow: 'hidden',
    minHeight: 72,
  },
  serviceRowSelected: {
    backgroundColor: 'rgba(180, 40, 50, 0.25)',
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    marginLeft: wp(3),
    borderRadius: 8,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceIconPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: wp(3),
    marginRight: wp(2),
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  serviceMeta: {
    fontSize: RFValue(12),
    color: '#999',
  },
  checkWrap: {
    paddingRight: wp(3),
  },
});
