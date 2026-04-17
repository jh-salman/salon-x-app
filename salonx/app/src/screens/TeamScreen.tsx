import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { highlightColors } from '../theme';
import { wp, hp, ms } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import {
  setActiveOrganization,
  listOrgMembers,
  getActiveOrgMemberRole,
  inviteOrgMember,
  listOrgInvitations,
  listUserInvitations,
  cancelOrgInvitation,
  acceptOrgInvitation,
  rejectOrgInvitation,
  updateOrgMemberRole,
  removeOrgMember,
  leaveOrganization,
  type BaOrgMember,
} from '../lib/orgApi';

function parseOrgRoles(role: string): string[] {
  return role.split(',').map((r) => r.trim()).filter(Boolean);
}

/** Better Auth org roles — used for API; UI still says “Team”. */
function canManageTeam(myRole: string | null): boolean {
  if (!myRole) return false;
  const r = parseOrgRoles(myRole);
  return r.includes('owner') || r.includes('admin');
}

const INVITE_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
] as const;

const CHANGE_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
] as const;

export function TeamScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { token, user } = useAuth();
  const { currentSalonId, salons, refreshSalons } = useTenant();

  const organizationId = React.useMemo(() => {
    if (!currentSalonId) return null;
    return salons.find((s) => s.id === currentSalonId)?.organizationId ?? null;
  }, [currentSalonId, salons]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [members, setMembers] = useState<BaOrgMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<
    Array<{
      id: string;
      email: string;
      role: string | null;
      status: string;
      expiresAt: string;
    }>
  >([]);
  const [incomingInvites, setIncomingInvites] = useState<
    Array<{
      id: string;
      organizationName: string;
      organizationId: string;
      role: string;
      expiresAt: string;
    }>
  >([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [roleChangeMember, setRoleChangeMember] = useState<BaOrgMember | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);
  const [resendBusyId, setResendBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !organizationId) {
      setMembers([]);
      setMyRole(null);
      setPendingInvites([]);
      setIncomingInvites([]);
      setLoading(false);
      return;
    }
    try {
      await setActiveOrganization(token, { organizationId });
      const [roleRes, listRes, invitesOut, invitesIn] = await Promise.all([
        getActiveOrgMemberRole(token, organizationId),
        listOrgMembers(token, organizationId),
        listOrgInvitations(token, organizationId),
        listUserInvitations(token),
      ]);
      setMyRole(roleRes.role);
      setMembers(listRes.members);
      const pending = invitesOut.filter((i) => i.status === 'pending');
      setPendingInvites(pending);
      setIncomingInvites(
        invitesIn.map((i) => ({
          id: i.id,
          organizationName: i.organizationName,
          organizationId: i.organizationId,
          role: i.role,
          expiresAt: i.expiresAt,
        })),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load team';
      Alert.alert('Team', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, organizationId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const onInvite = async () => {
    if (!token || !organizationId) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      Alert.alert('Invite', 'Enter a valid email address.');
      return;
    }
    setInviteBusy(true);
    try {
      await inviteOrgMember(token, { email, role: inviteRole, organizationId });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      await load();
      Alert.alert(
        'Invite sent',
        'They should sign in to SalonX with that email, then open Settings → Team and accept under Invites for you.',
      );
    } catch (e) {
      Alert.alert('Invite failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setInviteBusy(false);
    }
  };

  const onResendInviteEmail = async (inv: {
    id: string;
    email: string;
    role: string | null;
  }) => {
    if (!token || !organizationId) return;
    setResendBusyId(inv.id);
    try {
      await inviteOrgMember(token, {
        email: inv.email.trim().toLowerCase(),
        role: inv.role ?? 'member',
        organizationId,
        resend: true,
      });
      await load();
      Alert.alert('Email sent', 'Invitation email was sent again.');
    } catch (e) {
      Alert.alert('Resend failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setResendBusyId(null);
    }
  };

  const onCancelInvite = (id: string) => {
    if (!token) return;
    Alert.alert('Cancel invite?', 'This pending invite will be removed.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel invite',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrgInvitation(token, id);
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
          }
        },
      },
    ]);
  };

  const onAcceptIncoming = async (id: string) => {
    if (!token) return;
    try {
      await acceptOrgInvitation(token, id);
      await refreshSalons();
      await load();
      Alert.alert('Welcome', 'You joined the team.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const onRejectIncoming = (id: string) => {
    if (!token) return;
    Alert.alert('Decline invite?', undefined, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectOrgInvitation(token, id);
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
          }
        },
      },
    ]);
  };

  const applyRoleChange = async (newRole: string) => {
    if (!token || !organizationId || !roleChangeMember) return;
    setRoleBusy(true);
    try {
      await updateOrgMemberRole(token, {
        memberId: roleChangeMember.id,
        role: newRole,
        organizationId,
      });
      setRoleChangeMember(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setRoleBusy(false);
    }
  };

  const onRemoveMember = (member: BaOrgMember) => {
    if (!token || !organizationId || !canManageTeam(myRole ?? '')) return;
    const uid = user?.userId;
    if (member.userId === uid) {
      Alert.alert('Remove', 'Use “Leave team” to remove yourself.');
      return;
    }
    Alert.alert(
      'Remove from team?',
      `${member.user.email} will lose access to this workspace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeOrgMember(token, { memberIdOrEmail: member.id, organizationId });
              await load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
            }
          },
        },
      ],
    );
  };

  const onLeaveTeam = () => {
    if (!token || !organizationId) return;
    Alert.alert(
      'Leave this team?',
      'You will lose access to this workspace unless invited again.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveOrganization(token, organizationId);
              await refreshSalons();
              router.replace('/select-salon');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
            }
          },
        },
      ],
    );
  };

  const manage = canManageTeam(myRole ?? '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={primaryColor} />
          <Text style={[styles.backText, { color: primaryColor }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Team</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>
        People who can access this workspace. Invites and roles are managed here.
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : !organizationId ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No team for this workspace yet</Text>
          <Text style={styles.emptyBody}>
            Create a workspace that includes a team, or switch to a salon that has one.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { borderColor: primaryColor }]}
            onPress={() => router.push('/workspace-setup')}
          >
            <Text style={[styles.primaryBtnText, { color: primaryColor }]}>Create workspace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
          }
          showsVerticalScrollIndicator={false}
        >
          {incomingInvites.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>INVITES FOR YOU</Text>
              <View style={styles.section}>
                {incomingInvites.map((inv, i) => (
                  <View
                    key={inv.id}
                    style={[styles.row, i === incomingInvites.length - 1 && styles.rowLast]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{inv.organizationName}</Text>
                      <Text style={styles.rowMeta}>
                        Role: {inv.role} · {new Date(inv.expiresAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable
                        style={[styles.smallBtn, { borderColor: primaryColor }]}
                        onPress={() => void onAcceptIncoming(inv.id)}
                      >
                        <Text style={[styles.smallBtnText, { color: primaryColor }]}>Accept</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.smallBtn, styles.smallBtnMuted]}
                        onPress={() => onRejectIncoming(inv.id)}
                      >
                        <Text style={styles.smallBtnTextMuted}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>MEMBERS</Text>
            {manage ? (
              <TouchableOpacity onPress={() => setInviteOpen(true)} activeOpacity={0.7}>
                <Text style={[styles.inviteLink, { color: primaryColor }]}>Invite</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.section}>
            {members.map((m, i) => {
              const isSelf = m.userId === user?.userId;
              const label = m.user.name?.trim() || m.user.email;
              return (
                <View key={m.id} style={[styles.row, i === members.length - 1 && styles.rowLast]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {label}
                      {isSelf ? ' (you)' : ''}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {m.user.email} · {parseOrgRoles(m.role).join(', ') || m.role}
                    </Text>
                  </View>
                  {manage && !isSelf ? (
                    <View style={styles.rowActions}>
                      <Pressable
                        style={[styles.smallBtn, styles.smallBtnMuted]}
                        onPress={() => setRoleChangeMember(m)}
                      >
                        <Text style={styles.smallBtnTextMuted}>Role</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.smallBtn, styles.smallBtnMuted]}
                        onPress={() => onRemoveMember(m)}
                      >
                        <Text style={styles.smallBtnTextMuted}>Remove</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {manage && pendingInvites.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>PENDING INVITES</Text>
              <View style={styles.section}>
                {pendingInvites.map((inv, i) => (
                  <View
                    key={inv.id}
                    style={[styles.row, i === pendingInvites.length - 1 && styles.rowLast]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{inv.email}</Text>
                      <Text style={styles.rowMeta}>
                        {inv.role ?? 'member'} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable
                        style={[styles.smallBtn, styles.smallBtnMuted]}
                        onPress={() => void onResendInviteEmail(inv)}
                        disabled={resendBusyId === inv.id}
                      >
                        {resendBusyId === inv.id ? (
                          <ActivityIndicator size="small" color="#AAA" />
                        ) : (
                          <Text style={styles.smallBtnTextMuted}>Resend email</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={[styles.smallBtn, styles.smallBtnMuted]}
                        onPress={() => onCancelInvite(inv.id)}
                      >
                        <Text style={styles.smallBtnTextMuted}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <TouchableOpacity style={styles.leaveBtn} onPress={onLeaveTeam} activeOpacity={0.7}>
            <Text style={styles.leaveBtnText}>Leave team</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={!!roleChangeMember} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
            onPress={() => !roleBusy && setRoleChangeMember(null)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set role</Text>
            <Text style={styles.rowMeta} numberOfLines={2}>
              {roleChangeMember?.user.email}
            </Text>
            <Text style={[styles.modalLabel, { marginTop: hp(1.5) }]}>New role</Text>
            <View style={styles.roleRow}>
              {CHANGE_ROLES.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.roleChip,
                    roleChangeMember && parseOrgRoles(roleChangeMember.role).includes(opt.value)
                      ? { borderColor: 'rgba(255,255,255,0.35)' }
                      : undefined,
                  ]}
                  onPress={() => void applyRoleChange(opt.value)}
                  disabled={roleBusy}
                >
                  <Text style={styles.roleChipText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <TouchableOpacity
              style={{ marginTop: hp(1.5), alignSelf: 'flex-end' }}
              onPress={() => setRoleChangeMember(null)}
              disabled={roleBusy}
            >
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={inviteOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite to team</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <Text style={styles.modalLabel}>Role</Text>
            <View style={styles.roleRow}>
              {INVITE_ROLES.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.roleChip,
                    inviteRole === opt.value && { borderColor: primaryColor, backgroundColor: 'rgba(255,255,255,0.08)' },
                  ]}
                  onPress={() => setInviteRole(opt.value)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      inviteRole === opt.value && { color: primaryColor, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setInviteOpen(false)} disabled={inviteBusy}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void onInvite()} disabled={inviteBusy}>
                <Text style={[styles.modalSend, { color: primaryColor }]}>
                  {inviteBusy ? 'Sending…' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backText: { fontSize: ms(14), fontWeight: '600' },
  title: { fontSize: ms(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  subtitle: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1),
    fontSize: ms(13),
    color: '#888',
    lineHeight: ms(18),
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(8) },
  emptyTitle: { fontSize: ms(17), fontWeight: '700', color: '#FFF', textAlign: 'center', marginBottom: hp(1) },
  emptyBody: { fontSize: ms(14), color: '#888', textAlign: 'center', marginBottom: hp(2) },
  primaryBtn: {
    borderWidth: 1,
    borderRadius: ms(10),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
  },
  primaryBtnText: { fontSize: ms(15), fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(4), paddingHorizontal: wp(4) },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  inviteLink: { fontSize: ms(14), fontWeight: '700' },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: ms(12),
    overflow: 'hidden',
    marginBottom: hp(1),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowTitle: { fontSize: ms(15), fontWeight: '600', color: '#FFF' },
  rowMeta: { fontSize: ms(12), color: '#888', marginTop: 4 },
  rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ms(8),
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smallBtnMuted: { borderColor: 'rgba(255,255,255,0.12)' },
  smallBtnText: { fontSize: ms(12), fontWeight: '600' },
  smallBtnTextMuted: { fontSize: ms(12), color: '#AAA', fontWeight: '600' },
  leaveBtn: { marginTop: hp(2), paddingVertical: hp(1.5), alignItems: 'center' },
  leaveBtnText: { color: highlightColors.neonPink, fontSize: ms(15), fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: ms(14),
    padding: wp(5),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: ms(18), fontWeight: '700', color: '#FFF', marginBottom: hp(1.5) },
  modalLabel: { fontSize: ms(12), color: '#888', marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(10),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: ms(15),
    color: '#FFF',
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ms(10),
    paddingVertical: hp(1),
    alignItems: 'center',
  },
  roleChipText: { fontSize: ms(14), color: '#CCC' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: hp(2),
  },
  modalCancel: { fontSize: ms(16), color: '#888' },
  modalSend: { fontSize: ms(16), fontWeight: '700' },
});
