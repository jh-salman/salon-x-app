import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import { format } from 'date-fns';
import { colors } from '../theme';

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

const PersonOutlineIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
      fill="#A3A3A3"
    />
  </Svg>
);

const AddPhotoIcon = () => (
  <View style={styles.addPhotoIconWrap}>
    <Text style={styles.addPhotoPlus}>+</Text>
  </View>
);

const PhoneIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
      fill="#A3A3A3"
    />
  </Svg>
);

const EmailIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
      fill="#A3A3A3"
    />
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

export function NewCustomerScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState('');

  const handleSave = () => {
    // TODO: Save customer to data store
    router.back();
  };

  const handleAddAnother = () => {
    setName('');
    setPhone('');
    setEmail('');
    setBirthday(null);
    // TODO: Save current and reset for another
  };

  const iconSize = moderateScale(18);

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
          <Text style={styles.headerTitle}>New Customer</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Picture Placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarPlaceholder}>
              <PersonOutlineIcon size={moderateScale(48)} />
            </View>
            <TouchableOpacity style={styles.addPhotoButton} activeOpacity={0.8}>
              <AddPhotoIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputField}>
            <TextInput
              style={styles.inputText}
              placeholder="Name"
              placeholderTextColor="#A3A3A3"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputField}>
            <PhoneIcon size={iconSize} />
            <TextInput
              style={styles.inputText}
              placeholder="Phone"
              placeholderTextColor="#A3A3A3"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputField}>
            <EmailIcon size={iconSize} />
            <TextInput
              style={styles.inputText}
              placeholder="Email"
              placeholderTextColor="#A3A3A3"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.inputField}
            onPress={() => setShowBirthdayPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.inputText, birthday ? styles.inputValue : styles.inputPlaceholder]}>
              {birthday ? format(birthday, 'MMM d, yyyy') : 'Birthday'}
            </Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>

        {/* Instructional Text */}
        <Text style={styles.instructionText}>
          Enter a birthday you turn on birthday emails in Booking & Notifications so your clients can receive a beautiful
          birthday email from you on their birthday!
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleSave}>
            <LinearGradient colors={[colors.brand, colors.brand]} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>SAVE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={handleAddAnother}>
            <Text style={styles.secondaryButtonText}>ADD ANOTHER CLIENT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Birthday Date Picker Modal */}
      <Modal visible={showBirthdayPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.datePickerOverlay}
          activeOpacity={1}
          onPress={() => setShowBirthdayPicker(false)}
        >
          <View
            style={styles.datePickerContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowBirthdayPicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Birthday</Text>
              <TouchableOpacity
                onPress={() => {
                  const parsed = new Date(birthdayInput);
                  if (!isNaN(parsed.getTime())) setBirthday(parsed);
                  setShowBirthdayPicker(false);
                }}
              >
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputRow}>
              <TextInput
                style={styles.dateInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#A3A3A3"
                value={birthdayInput}
                keyboardType="numbers-and-punctuation"
                onChangeText={setBirthdayInput}
              />
              <TouchableOpacity
                style={styles.datePickerSelectBtn}
                onPress={() => {
                  const parsed = new Date(birthdayInput);
                  if (!isNaN(parsed.getTime())) {
                    setBirthday(parsed);
                    setShowBirthdayPicker(false);
                  }
                }}
              >
                <Text style={styles.datePickerSelectText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  avatarSection: {
    alignItems: 'center',
    marginTop: verticalScale(24),
    marginBottom: verticalScale(24),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  addPhotoIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoPlus: {
    fontSize: RFValue(20),
    fontWeight: '600',
    color: '#000',
    marginTop: -2,
  },
  formContainer: {
    paddingHorizontal: moderateScale(32),
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
  inputPlaceholder: {
    color: '#A3A3A3',
  },
  inputValue: {
    color: '#FFFFFF',
  },
  instructionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(12),
    color: '#A3A3A3',
    lineHeight: RFValue(18),
    paddingHorizontal: moderateScale(32),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(24),
  },
  buttonsContainer: {
    paddingHorizontal: moderateScale(32),
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    padding: moderateScale(24),
    paddingBottom: verticalScale(40),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  datePickerCancel: {
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#A3A3A3',
  },
  datePickerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(16),
    color: '#FFFFFF',
  },
  datePickerDone: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(14),
    color: colors.brand,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    height: verticalScale(48),
    backgroundColor: '#000108',
    borderRadius: moderateScale(8),
    borderWidth: 0.7,
    borderColor: '#A3A3A3',
    paddingHorizontal: moderateScale(16),
    fontFamily: 'Lato_400Regular',
    fontSize: RFValue(14),
    color: '#FFFFFF',
  },
  datePickerSelectBtn: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.brand,
    borderRadius: moderateScale(8),
  },
  datePickerSelectText: {
    fontFamily: 'Lato_700Bold',
    fontSize: RFValue(14),
    color: '#000',
  },
});
