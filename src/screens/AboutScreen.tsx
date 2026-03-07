import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';

const MAX_CHARS = 1500;

const ClearIcon = ({ size = 18, color = '#888' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      fill={color}
    />
  </Svg>
);

const SparkleIcon = ({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM6 16l1.2 3.6L11 21l-3.8-1.2L6 16l-1.2-3.6L1 11l3.8 1.2L6 16zm12 0l1.2 3.6L23 11l-3.8-1.2L18 16l-1.2 3.6L13 21l3.8-1.2L18 16z"
      fill={color}
    />
  </Svg>
);

export function AboutScreen() {
  const router = useRouter();
  const [bio, setBio] = useState('I love Hair :)');
  const initialBio = 'I love Hair :)';
  const hasChanges = bio !== initialBio;

  const handleClear = useCallback(() => setBio(''), []);

  const handleRegenerate = useCallback(() => {
    setBio('I love Hair :)');
  }, []);

  const handleSave = useCallback(() => {
    if (!hasChanges) return;
    // TODO: persist bio
    router.back();
  }, [hasChanges, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          activeOpacity={0.7}
          disabled={!hasChanges}
        >
          <Text style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder=""
            placeholderTextColor="#666"
            multiline
            maxLength={MAX_CHARS}
            textAlignVertical="top"
          />
          <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={8}>
            <ClearIcon size={20} color="#888" />
          </Pressable>
        </View>

        <Text style={styles.helperText}>
          Share bio, specialties and certifications with clients. Clients will see this on your booking site.
        </Text>
        <Text style={styles.charLimit}>{MAX_CHARS} character limit.</Text>

        <TouchableOpacity
          style={styles.regenerateBtn}
          onPress={handleRegenerate}
          activeOpacity={0.8}
        >
          <SparkleIcon size={20} color="#FFFFFF" />
          <Text style={styles.regenerateText}>Regenerate description</Text>
        </TouchableOpacity>
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
  title: { fontSize: RFValue(20), fontWeight: '700', color: '#FFFFFF' },
  saveBtn: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  saveText: { fontSize: RFValue(14), fontWeight: '600', color: '#FFFFFF' },
  saveTextDisabled: { color: '#666' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(6), paddingTop: hp(2), paddingBottom: hp(6) },
  inputWrap: {
    position: 'relative',
    minHeight: hp(12),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: hp(1.5),
    paddingBottom: hp(1.5),
    paddingHorizontal: wp(4),
    paddingRight: wp(10),
  },
  input: {
    fontSize: RFValue(15),
    color: '#FFFFFF',
    minHeight: hp(10),
    padding: 0,
  },
  clearBtn: {
    position: 'absolute',
    top: hp(1.2),
    right: wp(3),
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: RFValue(13),
    color: '#999',
    lineHeight: RFValue(18),
    marginTop: hp(1.5),
  },
  charLimit: {
    fontSize: RFValue(12),
    color: '#666',
    marginTop: hp(0.5),
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: hp(3),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  regenerateText: {
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
