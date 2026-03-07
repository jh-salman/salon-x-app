import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { wp, hp, ms } from '../utils/responsive';

export interface ServiceOption {
  id: string;
  name: string;
  duration?: number;
  price?: number;
}

interface ServiceDropdownProps {
  visible: boolean;
  services: ServiceOption[];
  selectedService: ServiceOption | null;
  onSelect: (service: ServiceOption) => void;
  onAddNew: () => void;
  onClose?: () => void;
  triggerLayout?: { x: number; y: number; width: number; height: number };
}

const AddNewIcon = () => (
  <View style={styles.addNewIcon}>
    <Text style={styles.addNewPlus}>+</Text>
  </View>
);

export function ServiceDropdown({
  visible,
  services,
  selectedService,
  onSelect,
  onAddNew,
  onClose,
  triggerLayout,
}: ServiceDropdownProps) {
  const { width: screenWidth } = useWindowDimensions();
  const formPadding = wp(8);
  const dropdownWidth = screenWidth - formPadding * 2;
  const dropdownTop = triggerLayout ? triggerLayout.y + triggerLayout.height - 1 : hp(25);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.dropdown, { top: dropdownTop, left: formPadding, width: dropdownWidth }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Pressable
            style={({ pressed }) => [styles.addNewRow, pressed && styles.addNewRowPressed]}
            onPress={() => {
              onAddNew();
              onClose?.();
            }}
          >
            <AddNewIcon />
            <Text style={styles.addNewText}>Add new</Text>
          </Pressable>
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => {
              const isSelected = selectedService?.id === item.id;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.serviceRow,
                    pressed && styles.serviceRowPressed,
                    isSelected && styles.serviceRowSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose?.();
                  }}
                >
                  <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
                  {(item.duration != null || item.price != null) && (
                    <Text style={styles.serviceMeta} numberOfLines={1}>
                      {[item.duration != null && `${item.duration}min`, item.price != null && `$${item.price}`].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dropdown: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    borderWidth: 0.7,
    borderColor: '#A3A3A3',
    maxHeight: hp(30),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: ms(8),
    elevation: 8,
  },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    gap: ms(12),
    backgroundColor: 'rgba(37, 175, 255, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  addNewRowPressed: { opacity: 0.8 },
  addNewIcon: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: '#25AFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewPlus: { fontSize: ms(18), fontWeight: '600', color: '#000', marginTop: -2 },
  addNewText: { fontFamily: 'Lato_700Bold', fontSize: ms(14), color: '#25AFFF' },
  list: { maxHeight: hp(25) },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: ms(8),
  },
  serviceRowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  serviceRowSelected: { backgroundColor: 'rgba(255,255,255,0.08)' },
  serviceName: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: ms(14), color: '#fff' },
  serviceMeta: { fontFamily: 'Lato_400Regular', fontSize: ms(12), color: '#A3A3A3' },
});
