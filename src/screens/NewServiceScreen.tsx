import React, { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useServices } from '../context/ServicesContext';
import { useCategories } from '../context/CategoriesContext';
import { useDurationResult } from '../context/DurationResultContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import { wp, hp, ms, vs } from '../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import { colors, highlightColors } from '../theme';
import { CALENDAR_COLORS, type ServiceOption, type PriceType } from '../data/services';
import { type DurationValues } from '../components/DurationSetupSection';

const PRICE_TYPES: { id: PriceType; name: string }[] = [
  { id: 'fixed', name: 'Fixed' },
  { id: 'starts_from', name: 'Starts from' },
  { id: 'varies', name: 'Varies' },
];

const MOCK_TEAM_MEMBERS = [
  { id: 'tm1', name: 'You' },
  { id: 'tm2', name: 'Stylist 1' },
  { id: 'tm3', name: 'Stylist 2' },
];

const BackIcon = () => (
  <Svg width={ms(15)} height={vs(10)} viewBox="0 0 15.6059 10.1073">
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

const ChevronRightIcon = () => (
  <Svg width={ms(10)} height={vs(10)} viewBox="0 0 24 24" fill="none">
    <Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" fill="#A3A3A3" />
  </Svg>
);

const AddImagePlaceholder = () => (
  <View style={styles.addImagePlaceholder}>
    <Text style={styles.addImageText}>+ Add Image</Text>
  </View>
);

function OptionPickerModal<T extends { id: string; name: string }>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  renderOption,
}: {
  visible: boolean;
  title: string;
  options: T[];
  selected: T | null;
  onSelect: (opt: T) => void;
  onClose: () => void;
  renderOption?: (opt: T) => React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  styles.modalRow,
                  pressed && styles.modalRowPressed,
                  selected?.id === opt.id && styles.modalRowSelected,
                ]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                {renderOption ? renderOption(opt) : <Text style={styles.modalRowText}>{opt.name}</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ADD_NEW_CATEGORY_ID = '__add_new_category__';

export function NewServiceScreen() {
  const router = useRouter();
  const { addService } = useServices();
  const { categories, addCategory } = useCategories();
  const { pendingResult, setPendingResult } = useDurationResult();

  useFocusEffect(
    React.useCallback(() => {
      if (pendingResult) {
        setDurationValues(pendingResult);
        setPendingResult(null);
      }
    }, [pendingResult, setPendingResult])
  );

  // Basic Info
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<{ id: string; name: string } | null>(null);
  const [calendarColor, setCalendarColor] = useState(CALENDAR_COLORS[0]);
  const [showOnWebsite, setShowOnWebsite] = useState(true);

  // Duration (wheel picker model)
  const [durationValues, setDurationValues] = useState<DurationValues>({
    startMin: 40,
    processingEnabled: true,
    processingMin: 20,
    processingBlocks: false,
    endMin: 15,
    bufferEnabled: false,
    bufferMin: 10,
  });

  // Pricing
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Assignment & Options
  const [teamMember, setTeamMember] = useState<{ id: string; name: string } | null>(MOCK_TEAM_MEMBERS[0]);
  const [createOptions, setCreateOptions] = useState(false);
  const [options, setOptions] = useState<{ name: string; duration?: number; price?: number }[]>([]);

  const [categoryModal, setCategoryModal] = useState(false);
  const [addCategoryModal, setAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [colorModal, setColorModal] = useState(false);
  const [priceTypeModal, setPriceTypeModal] = useState(false);
  const [teamModal, setTeamModal] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const clientDuration =
    durationValues.startMin +
    (durationValues.processingEnabled ? durationValues.processingMin : 0) +
    durationValues.endMin;
  const totalDuration = clientDuration + (durationValues.bufferEnabled ? durationValues.bufferMin : 0);

  const buildService = (): Omit<ServiceOption, 'id'> => {
    const pr = parseFloat(price);
    const dep = parseFloat(depositAmount);
    const v = durationValues;
    const dur = clientDuration;
    return {
      name: serviceName.trim() || 'Service',
      duration: dur,
      price: isNaN(pr) ? undefined : pr,
      imageUri: imageUri || undefined,
      description: description.trim() || undefined,
      categoryId: category?.id,
      categoryName: category?.name,
      calendarColor,
      showOnWebsite,
      processingTimeStart: v.processingEnabled ? v.startMin : undefined,
      processingTimeEnd: v.processingEnabled ? v.startMin + v.processingMin : undefined,
      processingBlocksStylist: v.processingEnabled ? v.processingBlocks : undefined,
      blockTimeAfter: v.bufferEnabled ? v.bufferMin : undefined,
      priceType,
      requireDeposit,
      depositAmount: requireDeposit && !isNaN(dep) ? dep : undefined,
      teamMemberId: teamMember?.id,
      teamMemberName: teamMember?.name,
      options: createOptions && options.length > 0 ? options : undefined,
    };
  };

  const handleSave = () => {
    if (!serviceName.trim()) return;
    addService(buildService());
    router.back();
  };

  const iconSize = ms(18);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Service</Text>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={[styles.saveHeaderButton, !serviceName.trim() && styles.saveHeaderButtonDisabled]}
            disabled={!serviceName.trim()}
          >
            <Text style={styles.saveHeaderButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.section}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imageBox}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.serviceImage} resizeMode="cover" />
              ) : (
                <AddImagePlaceholder />
              )}
            </TouchableOpacity>
            <Text style={styles.imageHint}>Add Image (Optional)</Text>

            <View style={styles.inputField}>
              <Text style={styles.label}>Service Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter service name"
                placeholderTextColor="#A3A3A3"
                value={serviceName}
                onChangeText={setServiceName}
              />
            </View>

            <Pressable style={styles.rowField} onPress={() => {}}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.rowValue}>
                <Text style={[styles.rowText, !description && styles.placeholder]}>
                  {description || 'Add description'}
                </Text>
                <ChevronRightIcon />
              </View>
            </Pressable>

            <Pressable style={styles.rowField} onPress={() => setCategoryModal(true)}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.rowValue}>
                <Text style={[styles.rowText, !category && styles.placeholder]}>
                  {category?.name || 'Select Category'}
                </Text>
                <ChevronRightIcon />
              </View>
            </Pressable>

            <Pressable style={styles.rowField} onPress={() => setColorModal(true)}>
              <Text style={styles.label}>Calendar Color</Text>
              <View style={styles.rowValue}>
                <View style={[styles.colorSwatch, { backgroundColor: calendarColor }]} />
                <ChevronRightIcon />
              </View>
            </Pressable>

            <View style={styles.rowField}>
              <Text style={styles.label}>Show on Website</Text>
              <Switch
                value={showOnWebsite}
                onValueChange={setShowOnWebsite}
                trackColor={{ false: '#444', true: highlightColors.neonPink }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.hint}>Turning this off means clients won't see this service online.</Text>
          </View>

          {/* Duration Setup */}
          <Text style={styles.sectionTitle}>Duration Setup</Text>
          <View style={styles.section}>
            <Pressable
              style={styles.rowField}
              onPress={() =>
                router.push({
                  pathname: '/duration',
                  params: {
                    startMin: String(durationValues.startMin),
                    processingEnabled: String(durationValues.processingEnabled),
                    processingMin: String(durationValues.processingMin),
                    processingBlocks: String(durationValues.processingBlocks),
                    endMin: String(durationValues.endMin),
                    bufferEnabled: String(durationValues.bufferEnabled),
                    bufferMin: String(durationValues.bufferMin),
                  },
                })
              }
            >
              <Text style={styles.label}>Total Duration</Text>
              <View style={styles.rowValue}>
                <Text style={styles.rowText}>{clientDuration} min</Text>
                <ChevronRightIcon />
              </View>
            </Pressable>
            <Text style={styles.hint}>
              Service time shown to clients. Tap to configure Start, Processing, End and block time.
            </Text>
          </View>

          {/* Pricing Setup */}
          <Text style={styles.sectionTitle}>Pricing Setup</Text>
          <View style={styles.section}>
            <View style={styles.inputField}>
              <Text style={styles.label}>Price</Text>
              <View style={styles.priceRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="0"
                  placeholderTextColor="#A3A3A3"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Pressable style={styles.rowField} onPress={() => setPriceTypeModal(true)}>
              <Text style={styles.label}>Price Type</Text>
              <View style={styles.rowValue}>
                <Text style={styles.rowText}>
                  {PRICE_TYPES.find((p) => p.id === priceType)?.name || 'Fixed'}
                </Text>
                <ChevronRightIcon />
              </View>
            </Pressable>
            <View style={styles.rowField}>
              <Text style={styles.label}>Require Deposit</Text>
              <Switch
                value={requireDeposit}
                onValueChange={setRequireDeposit}
                trackColor={{ false: '#444', true: highlightColors.neonPink }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.hint}>Require clients to pay a deposit when booking online.</Text>
            {requireDeposit && (
              <View style={styles.inputField}>
                <Text style={styles.label}>Deposit Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#A3A3A3"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Assignment */}
          <Text style={styles.sectionTitle}>Assignment</Text>
          <View style={styles.section}>
            <Pressable style={styles.rowField} onPress={() => setTeamModal(true)}>
              <Text style={styles.label}>Assign to Team Member</Text>
              <View style={styles.rowValue}>
                <Text style={styles.rowText}>{teamMember?.name || 'Select'}</Text>
                <ChevronRightIcon />
              </View>
            </Pressable>
            <View style={styles.rowField}>
              <Text style={styles.label}>Create Options? (Variations)</Text>
              <Switch
                value={createOptions}
                onValueChange={setCreateOptions}
                trackColor={{ false: '#444', true: highlightColors.neonPink }}
                thumbColor="#fff"
              />
            </View>
            {createOptions && (
              <Text style={styles.hint}>Add duration/price variations for this service.</Text>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      <OptionPickerModal
        visible={categoryModal}
        title="Select Category"
        options={[
          { id: ADD_NEW_CATEGORY_ID, name: '+ Add new category' },
          ...categories,
        ]}
        selected={category}
        onSelect={(opt) => {
          if (opt.id === ADD_NEW_CATEGORY_ID) {
            setCategoryModal(false);
            setAddCategoryModal(true);
          } else {
            setCategory(opt);
            setCategoryModal(false);
          }
        }}
        onClose={() => setCategoryModal(false)}
      />
      <Modal visible={addCategoryModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddCategoryModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Category name"
              placeholderTextColor="#A3A3A3"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <View style={styles.addCategoryActions}>
              <TouchableOpacity
                style={styles.addCategoryCancel}
                onPress={() => {
                  setAddCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.addCategoryCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addCategorySave, !newCategoryName.trim() && styles.saveHeaderButtonDisabled]}
                onPress={() => {
                  const trimmed = newCategoryName.trim();
                  if (!trimmed) return;
                  const c = addCategory(trimmed);
                  setCategory(c);
                  setAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                disabled={!newCategoryName.trim()}
              >
                <Text style={styles.saveHeaderButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <OptionPickerModal
        visible={colorModal}
        title="Calendar Color"
        options={CALENDAR_COLORS.map((c, i) => ({ id: String(i), name: c }))}
        selected={{ id: String(CALENDAR_COLORS.indexOf(calendarColor)), name: calendarColor }}
        onSelect={(opt) => setCalendarColor(opt.name)}
        onClose={() => setColorModal(false)}
        renderOption={(opt) => (
          <View style={styles.colorOptionRow}>
            <View style={[styles.colorSwatch, { backgroundColor: opt.name }]} />
            <Text style={styles.modalRowText}>{opt.name}</Text>
          </View>
        )}
      />
      <OptionPickerModal
        visible={priceTypeModal}
        title="Price Type"
        options={PRICE_TYPES}
        selected={PRICE_TYPES.find((p) => p.id === priceType) || null}
        onSelect={(opt) => setPriceType(opt.id)}
        onClose={() => setPriceTypeModal(false)}
      />
      <OptionPickerModal
        visible={teamModal}
        title="Team Member"
        options={MOCK_TEAM_MEMBERS}
        selected={teamMember}
        onSelect={setTeamMember}
        onClose={() => setTeamModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: wp(8), paddingBottom: hp(4) },
  bottomSpacer: { height: hp(4) },
  header: {
    height: vs(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: { padding: ms(4) },
  headerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(16),
    color: '#FFFFFF',
  },
  saveHeaderButton: {
    backgroundColor: highlightColors.neonPink,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: 20,
  },
  saveHeaderButtonDisabled: { opacity: 0.5 },
  saveHeaderButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(14),
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(13),
    color: '#A3A3A3',
    marginTop: hp(2.5),
    marginBottom: hp(1),
  },
  section: { gap: hp(1.2) },
  imageBox: {
    width: wp(40),
    height: wp(40),
    borderRadius: ms(8),
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  serviceImage: { width: '100%', height: '100%' },
  addImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  addImageText: { fontFamily: 'Lato_400Regular', fontSize: RFValue(13), color: '#A3A3A3' },
  imageHint: { fontFamily: 'Lato_400Regular', fontSize: RFValue(12), color: '#A3A3A3', marginBottom: hp(0.5) },
  inputField: {
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: { fontFamily: 'Lato_400Regular', fontSize: RFValue(13), color: '#FFFFFF', marginBottom: hp(0.4) },
  input: {
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#FFFFFF',
    padding: 0,
  },
  inputInline: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: RFValue(14), color: '#FFFFFF', padding: 0 },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  rowText: { fontFamily: 'Lato_400Regular', fontSize: RFValue(14), color: '#FFFFFF' },
  placeholder: { color: '#A3A3A3' },
  colorSwatch: { width: ms(24), height: ms(24), borderRadius: ms(4) },
  hint: {
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(11),
    color: '#666',
    marginTop: -hp(0.5),
    marginBottom: hp(0.5),
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  priceInput: { flex: 1, minWidth: 0 },
  dollarSign: { fontFamily: 'Lato_400Regular', fontSize: RFValue(14), color: '#FFFFFF' },
  twoColRow: { flexDirection: 'row', gap: ms(12) },
  smallInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: wp(8) },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: ms(12), width: '100%', maxHeight: hp(50), padding: wp(4) },
  modalTitle: { fontFamily: 'Lato_700Bold', fontSize: RFValue(16), color: '#FFFFFF', marginBottom: hp(1.5) },
  modalScroll: { maxHeight: hp(35) },
  modalRow: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: ms(6),
  },
  modalRowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  modalRowSelected: { backgroundColor: 'rgba(255,255,255,0.08)' },
  modalRowText: { fontFamily: 'Lato_400Regular', fontSize: RFValue(14), color: '#FFFFFF' },
  colorOptionRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12) },
  addCategoryActions: { flexDirection: 'row', gap: ms(12), marginTop: hp(1.5), justifyContent: 'flex-end' },
  addCategoryCancel: { paddingVertical: hp(1), paddingHorizontal: wp(4) },
  addCategoryCancelText: { fontFamily: 'Lato_400Regular', fontSize: RFValue(14), color: '#A3A3A3' },
  addCategorySave: {
    backgroundColor: highlightColors.neonPink,
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    borderRadius: 20,
  },
});
