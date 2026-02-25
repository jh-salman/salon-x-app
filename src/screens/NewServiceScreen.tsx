import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import { useWindowDimensions } from 'react-native';
import { colors } from '../theme';

const SERVICE_CATEGORIES = [
  { id: 'hair', name: 'Hair' },
  { id: 'color', name: 'Color' },
  { id: 'nails', name: 'Nails' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'makeup', name: 'Makeup' },
  { id: 'massage', name: 'Massage' },
  { id: 'other', name: 'Other' },
];

// Icons
const BackIcon = () => (
  <Svg width={moderateScale(15)} height={verticalScale(10)} viewBox="0 0 15.6059 10.1073">
    <G>
      <Path
        d="M4.74241 4.97939L8.48012 0.307264L4.11946 0.307263L0.381754 4.97939L4.11946 9.80726L8.48011 9.80726L4.74241 4.97939Z"
        stroke={colors.brand}
        strokeWidth={0.6}
        fill="none"
      />
      <Path
        d="M14.8228 0.299999L12.0195 0.299999L8.12607 4.97213L12.0195 9.8L14.9785 9.8L11.0851 4.97213L14.8228 0.299999Z"
        stroke={colors.brand}
        strokeWidth={0.6}
        fill="none"
      />
    </G>
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width={moderateScale(10)} height={verticalScale(5)} viewBox="0 0 10 5">
    <Path
      d="M1.53244 0.222096L5.00447 3.16819L8.47651 0.222096C8.8255 -0.0740319 9.38926 -0.0740319 9.73826 0.222096C10.0872 0.518223 10.0872 0.996583 9.73826 1.29271L5.63087 4.7779C5.28188 5.07403 4.71812 5.07403 4.36913 4.7779L0.261745 1.29271C-0.0872483 0.996583 -0.0872483 0.518223 0.261745 0.222096C0.610738 -0.0664389 1.18345 -0.0740319 1.53244 0.222096V0.222096Z"
      fill="#A3A3A3"
    />
  </Svg>
);

const DollarIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"
      fill="#A3A3A3"
    />
  </Svg>
);

const ClockIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
      fill="#A3A3A3"
    />
  </Svg>
);

interface CategoryDropdownProps {
  visible: boolean;
  options: { id: string; name: string }[];
  selected: { id: string; name: string } | null;
  onSelect: (item: { id: string; name: string }) => void;
  onClose: () => void;
  triggerLayout?: { x: number; y: number; width: number; height: number };
}

function CategoryDropdown({ visible, options, selected, onSelect, onClose, triggerLayout }: CategoryDropdownProps) {
  const { width: screenWidth } = useWindowDimensions();
  const formPadding = moderateScale(32);
  const dropdownWidth = screenWidth - formPadding * 2;
  const dropdownTop = triggerLayout ? triggerLayout.y + triggerLayout.height - 1 : 150;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.dropdownOverlay} onPress={onClose}>
        <Pressable
          style={[styles.dropdownPanel, { top: dropdownTop, left: formPadding, width: dropdownWidth }]}
          onPress={(e) => e.stopPropagation()}
        >
          {options.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.dropdownRow,
                pressed && styles.dropdownRowPressed,
                selected?.id === item.id && styles.dropdownRowSelected,
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.dropdownRowText}>{item.name}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function NewServiceScreen() {
  const router = useRouter();
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState<{ id: string; name: string } | null>(null);
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const categoryFieldRef = useRef<View>(null);

  const iconSize = moderateScale(18);

  const handleSave = () => {
    // TODO: Save service to data store
    router.back();
  };

  const handleAddAnother = () => {
    setServiceName('');
    setCategory(null);
    setDuration('');
    setPrice('');
    setDescription('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#010010', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Service</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputField}>
              <TextInput
                style={styles.inputText}
                placeholder="Service Name"
                placeholderTextColor="#A3A3A3"
                value={serviceName}
                onChangeText={setServiceName}
              />
            </View>

            <View ref={categoryFieldRef} collapsable={false}>
              <TouchableOpacity
                style={styles.inputField}
                onPress={() => {
                  categoryFieldRef.current?.measureInWindow((x, y, width, height) => {
                    setTriggerLayout({ x, y, width, height });
                    setCategoryDropdownOpen(true);
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.inputText, !category ? styles.inputPlaceholder : styles.inputValue]}>
                  {category?.name || 'Select Category'}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.inputField}>
              <ClockIcon size={iconSize} />
              <TextInput
                style={styles.inputText}
                placeholder="Duration (min)"
                placeholderTextColor="#A3A3A3"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputField}>
              <DollarIcon size={iconSize} />
              <TextInput
                style={styles.inputText}
                placeholder="Price ($)"
                placeholderTextColor="#A3A3A3"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.descriptionField}>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Description (optional)"
                placeholderTextColor="#A3A3A3"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleSave}>
              <LinearGradient colors={[colors.brand, colors.brand]} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>SAVE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={handleAddAnother}>
              <Text style={styles.secondaryButtonText}>ADD ANOTHER SERVICE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CategoryDropdown
          visible={categoryDropdownOpen}
          options={SERVICE_CATEGORIES}
          selected={category}
          onSelect={setCategory}
          onClose={() => setCategoryDropdownOpen(false)}
          triggerLayout={triggerLayout}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingBottom: verticalScale(40) },
  header: {
    height: verticalScale(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32),
  },
  backButton: { padding: moderateScale(4) },
  headerTitle: {
    flex: 1,
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(16),
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: moderateScale(8),
  },
  headerSpacer: { width: moderateScale(15) },
  formContainer: {
    paddingHorizontal: moderateScale(32),
    marginTop: verticalScale(24),
    gap: verticalScale(6),
  },
  inputField: {
    minHeight: verticalScale(43),
    backgroundColor: '#000108',
    borderRadius: moderateScale(8),
    borderWidth: 0.7,
    borderColor: '#A3A3A3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
    gap: moderateScale(8),
  },
  inputText: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#FFFFFF',
  },
  inputPlaceholder: { color: '#A3A3A3' },
  inputValue: { color: '#FFFFFF' },
  descriptionField: {
    minHeight: verticalScale(80),
    backgroundColor: '#000108',
    borderRadius: moderateScale(8),
    borderWidth: 0.7,
    borderColor: '#A3A3A3',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
  },
  descriptionInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#FFFFFF',
    minHeight: verticalScale(60),
    padding: 0,
  },
  buttonsContainer: {
    paddingHorizontal: moderateScale(32),
    marginTop: verticalScale(24),
    gap: verticalScale(12),
  },
  saveButton: {
    height: verticalScale(48),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: '#0677B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(12),
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: verticalScale(48),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(12),
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dropdownPanel: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderRadius: moderateScale(8),
    borderWidth: 0.7,
    borderColor: '#A3A3A3',
    maxHeight: verticalScale(280),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownRow: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
  },
  dropdownRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dropdownRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dropdownRowText: {
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#FFFFFF',
  },
});
