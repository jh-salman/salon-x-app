import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalSalonMembership, LocalSalonSummary } from '../data/types';
import { useAuth } from './AuthContext';
import { listMySalons, type MeSalonRow } from '../lib/salonApi';
import { setActiveOrganization as setActiveOrganizationRequest } from '../lib/orgApi';

const TENANT_KEY_PREFIX = '@salonx_tenant_v2_';

export type PersistedTenant = {
  currentSalonId: string | null;
  memberships: LocalSalonMembership[];
  activeOrganizationId?: string | null;
  /** @deprecated migrated into workspaceDisplayBySalonId */
  workspaceDisplayName?: string | null;
  /** @deprecated migrated into workspaceInfoBySalonId */
  workspaceInfo?: string | null;
  /** Custom label per salon (Settings / workspace setup) */
  workspaceDisplayBySalonId?: Record<string, string>;
  workspaceInfoBySalonId?: Record<string, string>;
};

type TenantContextType = {
  currentSalonId: string | null;
  currentSalonName: string | null;
  workspaceInfo: string | null;
  memberships: LocalSalonMembership[];
  /** Salon rows from API (names, slugs, organization links). */
  salons: LocalSalonSummary[];
  activeOrganizationId: string | null;
  isReady: boolean;
  /** Reload memberships from `GET /api/v1/me/salons` (requires token). Returns fresh rows. */
  refreshSalons: () => Promise<MeSalonRow[] | undefined>;
  /**
   * Switch active salon. Use `force` + `organizationId` right after creating a workspace
   * (membership state may not have flushed yet).
   */
  setCurrentSalonId: (
    salonId: string,
    opts?: { force?: boolean; organizationId?: string | null },
  ) => Promise<void>;
  /** Better Auth: set active org; updates local salon when linked. */
  setActiveOrganizationId: (organizationId: string) => Promise<void>;
  saveWorkspaceProfile: (input: { displayName: string | null; info: string | null }) => Promise<void>;
};

const TenantContext = React.createContext<TenantContextType | null>(null);

function storageKey(userId: string) {
  return `${TENANT_KEY_PREFIX}${userId}`;
}

function emptySeed(): PersistedTenant {
  return {
    currentSalonId: null,
    memberships: [],
    activeOrganizationId: null,
    workspaceDisplayBySalonId: {},
    workspaceInfoBySalonId: {},
  };
}

/** Merge legacy global workspaceDisplayName / workspaceInfo into per-salon maps; strip old keys. */
function migrateLegacyTenant(data: PersistedTenant): PersistedTenant {
  const sid = data.currentSalonId;
  const displayMap = { ...(data.workspaceDisplayBySalonId ?? {}) };
  const infoMap = { ...(data.workspaceInfoBySalonId ?? {}) };
  if (sid && data.workspaceDisplayName?.trim() && !displayMap[sid]) {
    displayMap[sid] = data.workspaceDisplayName.trim();
  }
  if (sid && data.workspaceInfo?.trim() && !infoMap[sid]) {
    infoMap[sid] = data.workspaceInfo.trim();
  }
  const next: PersistedTenant = {
    ...data,
    workspaceDisplayBySalonId: displayMap,
    workspaceInfoBySalonId: infoMap,
  };
  delete next.workspaceDisplayName;
  delete next.workspaceInfo;
  return next;
}

function applyPersistedToState(data: PersistedTenant): {
  memberships: LocalSalonMembership[];
  currentSalonId: string | null;
  workspaceDisplayBySalonId: Record<string, string>;
  workspaceInfoBySalonId: Record<string, string>;
  activeOrganizationId: string | null;
} {
  const migrated = migrateLegacyTenant(data);
  return {
    memberships: migrated.memberships,
    currentSalonId: migrated.currentSalonId,
    workspaceDisplayBySalonId: migrated.workspaceDisplayBySalonId ?? {},
    workspaceInfoBySalonId: migrated.workspaceInfoBySalonId ?? {},
    activeOrganizationId: migrated.activeOrganizationId ?? null,
  };
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [currentSalonId, setCurrentSalonIdState] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<LocalSalonMembership[]>([]);
  const [salons, setSalons] = useState<LocalSalonSummary[]>([]);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);
  const [workspaceDisplayBySalonId, setWorkspaceDisplayBySalonId] = useState<Record<string, string>>(
    {},
  );
  const [workspaceInfoBySalonId, setWorkspaceInfoBySalonId] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);

  const mergeAndPersist = useCallback(
    async (patch: Partial<PersistedTenant>) => {
      if (!user) return;
      const raw = await AsyncStorage.getItem(storageKey(user.userId));
      const prev: PersistedTenant = raw ? (JSON.parse(raw) as PersistedTenant) : emptySeed();
      const migratedPrev = migrateLegacyTenant(prev);
      const next: PersistedTenant = {
        ...migratedPrev,
        ...patch,
        memberships: patch.memberships ?? migratedPrev.memberships,
        currentSalonId:
          patch.currentSalonId !== undefined ? patch.currentSalonId : migratedPrev.currentSalonId,
        activeOrganizationId:
          patch.activeOrganizationId !== undefined
            ? patch.activeOrganizationId
            : migratedPrev.activeOrganizationId,
        workspaceDisplayBySalonId:
          patch.workspaceDisplayBySalonId ?? migratedPrev.workspaceDisplayBySalonId ?? {},
        workspaceInfoBySalonId:
          patch.workspaceInfoBySalonId ?? migratedPrev.workspaceInfoBySalonId ?? {},
      };
      delete next.workspaceDisplayName;
      delete next.workspaceInfo;
      await AsyncStorage.setItem(storageKey(user.userId), JSON.stringify(next));
      const applied = applyPersistedToState(next);
      setMemberships(applied.memberships);
      setCurrentSalonIdState(applied.currentSalonId);
      setWorkspaceDisplayBySalonId(applied.workspaceDisplayBySalonId);
      setWorkspaceInfoBySalonId(applied.workspaceInfoBySalonId);
      setActiveOrganizationIdState(applied.activeOrganizationId);
    },
    [user],
  );

  const applyServerSalons = useCallback(
    async (rows: MeSalonRow[]) => {
      const nextMemberships: LocalSalonMembership[] = rows.map((r) => ({
        salonId: r.salon.id,
        role: r.role,
      }));
      const nextSalons = rows.map((r) => r.salon);
      setSalons(nextSalons);
      setMemberships(nextMemberships);

      if (!user) return;

      const raw = await AsyncStorage.getItem(storageKey(user.userId));
      const prev: PersistedTenant = raw ? (JSON.parse(raw) as PersistedTenant) : emptySeed();
      const migratedPrev = migrateLegacyTenant(prev);
      let nextSalonId = migratedPrev.currentSalonId;
      if (nextSalonId && !nextMemberships.some((m) => m.salonId === nextSalonId)) {
        nextSalonId = nextMemberships[0]?.salonId ?? null;
      }
      if (!nextSalonId && nextMemberships.length > 0) {
        nextSalonId = nextMemberships[0].salonId;
      }

      const next: PersistedTenant = {
        ...migratedPrev,
        memberships: nextMemberships,
        currentSalonId: nextSalonId,
        workspaceDisplayBySalonId: migratedPrev.workspaceDisplayBySalonId ?? {},
        workspaceInfoBySalonId: migratedPrev.workspaceInfoBySalonId ?? {},
      };
      delete next.workspaceDisplayName;
      delete next.workspaceInfo;
      await AsyncStorage.setItem(storageKey(user.userId), JSON.stringify(next));
      const applied = applyPersistedToState(next);
      setCurrentSalonIdState(applied.currentSalonId);
      setWorkspaceDisplayBySalonId(applied.workspaceDisplayBySalonId);
      setWorkspaceInfoBySalonId(applied.workspaceInfoBySalonId);
      setActiveOrganizationIdState(applied.activeOrganizationId);
    },
    [user],
  );

  const refreshSalons = useCallback(async (): Promise<MeSalonRow[] | undefined> => {
    if (!token) return undefined;
    try {
      const { data } = await listMySalons(token);
      await applyServerSalons(data);
      return data;
    } catch {
      return undefined;
    }
  }, [token, applyServerSalons]);

  useEffect(() => {
    if (!user) {
      setCurrentSalonIdState(null);
      setMemberships([]);
      setSalons([]);
      setActiveOrganizationIdState(null);
      setWorkspaceDisplayBySalonId({});
      setWorkspaceInfoBySalonId({});
      setIsReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsReady(false);
      try {
        const raw = await AsyncStorage.getItem(storageKey(user.userId));
        let data: PersistedTenant;
        if (raw) {
          data = migrateLegacyTenant(JSON.parse(raw) as PersistedTenant);
        } else {
          data = emptySeed();
          await AsyncStorage.setItem(storageKey(user.userId), JSON.stringify(data));
        }
        if (cancelled) return;
        const applied = applyPersistedToState(data);
        setMemberships(applied.memberships);
        setCurrentSalonIdState(applied.currentSalonId);
        setWorkspaceDisplayBySalonId(applied.workspaceDisplayBySalonId);
        setWorkspaceInfoBySalonId(applied.workspaceInfoBySalonId);
        setActiveOrganizationIdState(applied.activeOrganizationId);

        if (token) {
          try {
            const { data: rows } = await listMySalons(token);
            if (!cancelled) await applyServerSalons(rows);
          } catch {
            if (!cancelled) setSalons([]);
          }
        }
      } catch {
        if (!cancelled) {
          const seed = emptySeed();
          const applied = applyPersistedToState(seed);
          setMemberships(applied.memberships);
          setCurrentSalonIdState(applied.currentSalonId);
          setWorkspaceDisplayBySalonId(applied.workspaceDisplayBySalonId);
          setWorkspaceInfoBySalonId(applied.workspaceInfoBySalonId);
          setActiveOrganizationIdState(applied.activeOrganizationId);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, token, applyServerSalons]);

  const setCurrentSalonId = useCallback(
    async (
      salonId: string,
      opts?: { force?: boolean; organizationId?: string | null },
    ) => {
      if (!opts?.force) {
        const allowed = memberships.some((m) => m.salonId === salonId);
        if (!allowed) return;
      }
      await mergeAndPersist({ currentSalonId: salonId });

      const orgId =
        opts?.organizationId ??
        salons.find((s) => s.id === salonId)?.organizationId ??
        null;
      if (token && orgId) {
        try {
          await setActiveOrganizationRequest(token, { organizationId: orgId });
          await mergeAndPersist({ activeOrganizationId: orgId });
        } catch {
          // BA sync best-effort
        }
      }
    },
    [memberships, mergeAndPersist, salons, token],
  );

  const setActiveOrganizationId = useCallback(
    async (organizationId: string) => {
      if (!token) return;
      await setActiveOrganizationRequest(token, { organizationId });
      const salon = salons.find((s) => s.organizationId === organizationId);
      await mergeAndPersist({
        activeOrganizationId: organizationId,
        currentSalonId: salon?.id ?? currentSalonId,
      });
    },
    [token, salons, currentSalonId, mergeAndPersist],
  );

  const saveWorkspaceProfile = useCallback(
    async (input: { displayName: string | null; info: string | null }) => {
      if (!user) return;
      const raw = await AsyncStorage.getItem(storageKey(user.userId));
      const prev: PersistedTenant = raw ? migrateLegacyTenant(JSON.parse(raw) as PersistedTenant) : emptySeed();
      const sid = currentSalonId;
      if (!sid) return;

      const displayMap = { ...(prev.workspaceDisplayBySalonId ?? {}) };
      const infoMap = { ...(prev.workspaceInfoBySalonId ?? {}) };

      if (input.displayName?.trim()) {
        displayMap[sid] = input.displayName.trim();
      } else {
        delete displayMap[sid];
      }
      if (input.info?.trim()) {
        infoMap[sid] = input.info.trim();
      } else {
        delete infoMap[sid];
      }

      await mergeAndPersist({
        workspaceDisplayBySalonId: displayMap,
        workspaceInfoBySalonId: infoMap,
      });
    },
    [user, currentSalonId, mergeAndPersist],
  );

  const currentSalonName = useMemo(() => {
    if (!currentSalonId) return null;
    const custom = workspaceDisplayBySalonId[currentSalonId]?.trim();
    if (custom) return custom;
    return salons.find((s) => s.id === currentSalonId)?.name ?? null;
  }, [currentSalonId, workspaceDisplayBySalonId, salons]);

  const workspaceInfo = useMemo(() => {
    if (!currentSalonId) return null;
    return workspaceInfoBySalonId[currentSalonId]?.trim() || null;
  }, [currentSalonId, workspaceInfoBySalonId]);

  const value = useMemo(
    () => ({
      currentSalonId,
      currentSalonName,
      workspaceInfo,
      memberships,
      salons,
      activeOrganizationId,
      isReady,
      refreshSalons,
      setCurrentSalonId,
      setActiveOrganizationId,
      saveWorkspaceProfile,
    }),
    [
      currentSalonId,
      currentSalonName,
      workspaceInfo,
      memberships,
      salons,
      activeOrganizationId,
      isReady,
      refreshSalons,
      setCurrentSalonId,
      setActiveOrganizationId,
      saveWorkspaceProfile,
    ],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
