import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';

const PLATFORM_HANDLE = '@SalonX';

type SocialRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
};

function SocialRow({ icon, label, onPress, isLast }: SocialRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isLast && styles.rowLast]}
      onPress={onPress ?? (() => {})}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.chevronRight}>
        <ChevronIcon size={18} color="#888" />
      </View>
    </Pressable>
  );
}

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
  </Svg>
);

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#833AB4" />
        <Stop offset="50%" stopColor="#E1306C" />
        <Stop offset="100%" stopColor="#F77737" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
      fill="url(#ig)"
    />
  </Svg>
);

const TwitterIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#1DA1F2" />
  </Svg>
);

const PinterestIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.214 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fill="#E60023" />
  </Svg>
);

const YelpIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M20.16 12.594l-4.995 1.392c-.96.267-1.586 1.004-1.52 1.94l.126 1.117c.067.536-.092 1.07-.437 1.453l-2.685 2.969c-.674.745-1.732 1.041-2.711.725l-.943-.302c-.912-.292-1.602-.995-1.9-1.896l-.838-2.558c-.372-1.135-1.366-1.944-2.54-2.043l-1.016-.086c-.998-.084-1.897.473-2.35 1.34l-.484.924c-.447.854-.417 1.875.078 2.7l3.95 6.483c.658 1.081 1.846 1.72 3.13 1.72h.058c1.247-.063 2.392-.614 3.176-1.51l4.7-5.2c.516-.57.767-1.34.692-2.11l-.298-2.95c-.074-.752.277-1.477.97-1.877l4.324-2.46c.67-.38 1.084-1.07 1.084-1.81 0-.406-.12-.803-.347-1.14z" fill="#D32323" />
  </Svg>
);

const WebsiteIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
      fill={highlightColors.neonPink}
    />
  </Svg>
);

const SOCIAL_ITEMS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'facebook', label: 'Facebook', icon: <FacebookIcon /> },
  { id: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
  { id: 'twitter', label: 'Twitter', icon: <TwitterIcon /> },
  { id: 'pinterest', label: 'Pinterest', icon: <PinterestIcon /> },
  { id: 'yelp', label: 'Yelp', icon: <YelpIcon /> },
  { id: 'website', label: 'Website', icon: <WebsiteIcon /> },
];

export function SocialScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Social</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {SOCIAL_ITEMS.map((item, index) => (
            <SocialRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={() => {}}
              isLast={index === SOCIAL_ITEMS.length - 1}
            />
          ))}
        </View>

        <Text style={styles.bodyText}>
          Link your business' social accounts to show them on your booking site.
        </Text>

        <Text style={styles.psText}>
          p.s. follow {PLATFORM_HANDLE} on social to be featured and win giveaways
        </Text>
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
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(6), paddingHorizontal: wp(6), paddingTop: hp(2) },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: wp(3) },
  rowLabel: { flex: 1, fontSize: RFValue(15), color: '#FFFFFF', fontWeight: '500' },
  chevronRight: { transform: [{ rotate: '180deg' }] },
  bodyText: {
    fontSize: RFValue(14),
    color: '#FFFFFF',
    lineHeight: RFValue(20),
    marginTop: hp(2.5),
  },
  psText: {
    fontSize: RFValue(14),
    color: '#FFFFFF',
    lineHeight: RFValue(20),
    marginTop: hp(1.5),
  },
});
