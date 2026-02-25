import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Image,
  useWindowDimensions,
} from 'react-native';

export interface CustomerOption {
  id: string;
  name: string;
  image?: string;
}

interface CustomerDropdownProps {
  visible: boolean;
  customers: CustomerOption[];
  selectedCustomer: CustomerOption | null;
  onSelect: (customer: CustomerOption) => void;
  onAddNew: () => void;
  onClose?: () => void;
  /** Layout of the trigger (Select Customer field) for positioning */
  triggerLayout?: { x: number; y: number; width: number; height: number };
}

const AddNewIcon = () => (
  <View style={styles.addNewIcon}>
    <Text style={styles.addNewPlus}>+</Text>
  </View>
);

export function CustomerDropdown({
  visible,
  customers,
  selectedCustomer,
  onSelect,
  onAddNew,
  onClose,
  triggerLayout,
}: CustomerDropdownProps) {
  const { width: screenWidth } = useWindowDimensions();
  const formPadding = 32;
  const dropdownWidth = screenWidth - formPadding * 2;
  const dropdownTop = triggerLayout ? triggerLayout.y + triggerLayout.height - 1 : 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.dropdown,
            {
              top: dropdownTop,
              left: formPadding,
              width: dropdownWidth,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
      {/* Add new - blue highlighted row */}
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

      {/* Customer list */}
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        renderItem={({ item }) => {
          const isSelected = selectedCustomer?.id === item.id;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.customerRow,
                pressed && styles.customerRowPressed,
                isSelected && styles.customerRowSelected,
              ]}
              onPress={() => {
                onSelect(item);
                onClose?.();
              }}
            >
              <View style={styles.avatar}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                )}
              </View>
              <Text style={styles.customerName} numberOfLines={1}>{item.name}</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 0.7,
    borderColor: '#A3A3A3',
    maxHeight: 240,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: 'rgba(37, 175, 255, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  addNewRowPressed: {
    opacity: 0.8,
  },
  addNewIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#25AFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewPlus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: -2,
  },
  addNewText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: '#25AFFF',
  },
  list: {
    maxHeight: 260,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  customerRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  customerRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  customerName: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#fff',
  },
});
