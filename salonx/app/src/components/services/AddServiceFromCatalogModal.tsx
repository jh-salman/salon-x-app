import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { MOCK_SERVICES } from "../../data/mockData";
import type { Service } from "../../data/types";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useServices } from "../../context/ServicesContext";
import { WheelPicker, type WheelPickerItem } from "../retail/WheelPicker";
import { ms, vs, wp, hp } from "../../utils/responsive";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddService: (service: Service) => void;
  /** Catalog ids (`MOCK_SERVICES.id`) already on today’s visit — hide from wheel. */
  excludeCatalogServiceIds: string[];
};

export function AddServiceFromCatalogModal({
  visible,
  onClose,
  onAddService,
  excludeCatalogServiceIds,
}: Props) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const { services: salonCatalog } = useServices();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [anotherPrompt, setAnotherPrompt] = useState(false);

  const apiCatalog = Boolean(token && currentSalonId);

  /** Logged-in tenant: only API ids. Guest/offline: mock seed if list empty. */
  const catalogSource = useMemo(() => {
    if (apiCatalog) return salonCatalog;
    return salonCatalog.length > 0 ? salonCatalog : MOCK_SERVICES;
  }, [apiCatalog, salonCatalog]);

  const catalogItems: WheelPickerItem[] = useMemo(() => {
    const exclude = new Set(excludeCatalogServiceIds);
    return catalogSource.filter((s) => !exclude.has(s.id)).map((s) => ({
      id: s.id,
      label: `${s.name}  $${Number(s.price ?? 0).toFixed(0)}`,
    }));
  }, [excludeCatalogServiceIds, catalogSource]);

  useEffect(() => {
    if (visible) {
      setAnotherPrompt(false);
      setSelectedServiceId(catalogItems[0]?.id ?? null);
    }
  }, [visible, catalogItems]);

  const confirmAdd = useCallback(() => {
    if (!selectedServiceId) return;
    const row = catalogSource.find((s) => s.id === selectedServiceId);
    if (!row) return;
    const service: Service = {
      id: `added-${row.id}-${Date.now()}`,
      name: row.name,
      price: Number(row.price ?? 0),
      completed: false,
      catalogServiceId: row.id,
    };
    onAddService(service);
    setAnotherPrompt(true);
  }, [selectedServiceId, onAddService, catalogSource]);

  const onAnotherYes = useCallback(() => {
    setAnotherPrompt(false);
    setSelectedServiceId(catalogItems[0]?.id ?? null);
  }, [catalogItems]);

  const onAnotherDone = useCallback(() => {
    setAnotherPrompt(false);
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRootFill}>
        {!anotherPrompt ? (
          <>
            <Pressable style={styles.backdrop} onPress={onClose}>
              <BlurView
                intensity={48}
                tint="dark"
                style={StyleSheet.absoluteFill}
                {...(Platform.OS === "android"
                  ? { experimentalBlurMethod: "dimezisBlurView" as const }
                  : {})}
              />
            </Pressable>
            <View style={styles.center} pointerEvents="box-none">
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>Salon service catalog</Text>
                <Text style={styles.stepTitle}>Scroll and select a service</Text>
                {catalogItems.length === 0 ? (
                  <Text style={styles.emptyCatalog}>
                    {apiCatalog && salonCatalog.length === 0
                      ? 'No services in your salon catalog yet. Add one from the calendar (+) or Services flow.'
                      : 'Everything from the catalog is already on today’s visit.'}
                  </Text>
                ) : (
                  <WheelPicker
                    items={catalogItems}
                    selectedId={selectedServiceId}
                    onSelectId={setSelectedServiceId}
                  />
                )}
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.btnGhost} onPress={onClose} activeOpacity={0.85}>
                    <Text style={styles.btnGhostText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnPrimary, (!selectedServiceId || catalogItems.length === 0) && styles.btnDisabled]}
                    onPress={confirmAdd}
                    activeOpacity={0.85}
                    disabled={!selectedServiceId || catalogItems.length === 0}
                  >
                    <Text style={styles.btnPrimaryText}>Add service</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.anotherWrap}>
            <BlurView
              intensity={56}
              tint="dark"
              style={StyleSheet.absoluteFill}
              {...(Platform.OS === "android"
                ? { experimentalBlurMethod: "dimezisBlurView" as const }
                : {})}
            />
            <View style={styles.anotherCenter}>
              <View style={styles.anotherCard}>
                <Text style={styles.anotherTitle}>Add another service?</Text>
                <Text style={styles.anotherSub}>Yes opens the catalog wheel again.</Text>
                <View style={styles.anotherRow}>
                  <TouchableOpacity style={styles.btnGhost} onPress={onAnotherDone} activeOpacity={0.85}>
                    <Text style={styles.btnGhostText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={onAnotherYes} activeOpacity={0.85}>
                    <Text style={styles.btnPrimaryText}>Yes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRootFill: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
  },
  sheet: {
    width: wp(90),
    maxHeight: hp(72),
    borderRadius: ms(18),
    backgroundColor: "rgba(18,16,24,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: wp(4),
    paddingTop: vs(16),
    paddingBottom: vs(14),
  },
  sheetTitle: {
    color: "#fff",
    fontSize: ms(18),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: vs(6),
  },
  stepTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(12),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: vs(10),
  },
  emptyCatalog: {
    color: "rgba(255,255,255,0.65)",
    fontSize: ms(12),
    textAlign: "center",
    paddingVertical: vs(24),
    lineHeight: ms(18),
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(14),
    gap: ms(12),
  },
  btnGhost: {
    paddingHorizontal: wp(4),
    paddingVertical: vs(10),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  btnGhostText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: ms(14),
    fontWeight: "600",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: vs(10),
    borderRadius: ms(12),
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
  },
  btnDisabled: { opacity: 0.4 },
  anotherWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  anotherCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(6),
  },
  anotherCard: {
    width: wp(84),
    borderRadius: ms(16),
    overflow: "hidden",
    paddingHorizontal: wp(4),
    paddingVertical: vs(18),
    backgroundColor: "rgba(22,22,28,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  anotherTitle: {
    color: "#fff",
    fontSize: ms(17),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: vs(8),
  },
  anotherSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: ms(12),
    textAlign: "center",
    marginBottom: vs(16),
  },
  anotherRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ms(12),
  },
});
