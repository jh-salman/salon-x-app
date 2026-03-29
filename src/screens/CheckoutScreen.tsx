import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { format, addWeeks } from "date-fns";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClientDetails } from "../data/clients";
import { colors } from "../theme";
import { wp, hp, ms, vs } from "../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { CalendarBackArrow } from "../components/CalendarHeaderDynamic";

type Props = {
  clientDetails: ClientDetails;
};

const FUTURE_BOOKING_FEE = 20;

export default function CheckoutScreen({ clientDetails }: Props) {
  const { primaryColor } = useTheme();
  const { clientName, date, services, recommendations } = clientDetails;
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const dateStr = format(safeDate, "MMMM d, yyyy");

  const suggestedItems = useMemo(() => {
    const recs = Array.isArray(recommendations) ? recommendations : [];
    if (recs.length >= 2) {
      return recs.slice(0, 2).map((r) => ({
        id: r.id,
        name: r.name,
        price: r.price,
      }));
    }
    return [
      { id: "sug-fallback-1", name: "Suggested add-on A", price: 20 },
      { id: "sug-fallback-2", name: "Suggested add-on B", price: 15 },
    ];
  }, [recommendations]);

  const [toggleOn, setToggleOn] = useState<Record<string, boolean>>({});

  const setToggle = useCallback((id: string, value: boolean) => {
    setToggleOn((prev) => ({ ...prev, [id]: value }));
  }, []);

  const servicesTotal = useMemo(
    () => services.reduce((sum, s) => sum + (Number.isFinite(s.price) ? s.price : 0), 0),
    [services]
  );

  const suggestedTotal = useMemo(() => {
    return suggestedItems.reduce((sum, item) => {
      if (!toggleOn[item.id]) return sum;
      return sum + (Number.isFinite(item.price) ? item.price : 0);
    }, 0);
  }, [suggestedItems, toggleOn]);

  const total = servicesTotal + suggestedTotal + FUTURE_BOOKING_FEE;

  const futureDate = addWeeks(safeDate, 5);
  const futureLine = `${format(futureDate, "M/d/yyyy")} — ${services[0]?.name ?? "Service"}`;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12} accessibilityRole="button">
            <CalendarBackArrow />
          </Pressable>
          <Text style={styles.checkoutLabel}>CHECKOUT</Text>
          <View style={styles.topbarSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 42 : 32}
          tint="dark"
          style={styles.glassCard}
          {...(Platform.OS === "android"
            ? { experimentalBlurMethod: "dimezisBlurView" as const }
            : {})}
        >
          <View style={styles.brandArea}>
            <Text style={styles.brandAreaText}>BRAND AREA</Text>
          </View>

          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.visitDate}>{dateStr}</Text>

          <Text style={styles.sectionTitle}>SERVICES</Text>
          {services.map((s) => (
            <View key={s.id} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={2}>
                {s.name}
              </Text>
              <Text style={styles.linePrice}>${Number(s.price).toFixed(2)}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, styles.sectionSpaced]}>SUGGESTED PRODUCTS</Text>
          {suggestedItems.map((item) => (
            <View key={item.id} style={styles.suggestedRow}>
              <Text style={[styles.lineName, styles.suggestedName]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.linePrice}>${Number(item.price).toFixed(2)}</Text>
              <Switch
                value={Boolean(toggleOn[item.id])}
                onValueChange={(v) => setToggle(item.id, v)}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: withAlpha(primaryColor, 0.45) }}
                thumbColor={toggleOn[item.id] ? "#fff" : "rgba(255,255,255,0.85)"}
              />
            </View>
          ))}

          <Text style={[styles.sectionTitle, styles.sectionSpaced]}>FUTURE APPOINTMENT</Text>
          <View style={styles.lineRow}>
            <Text style={styles.lineName} numberOfLines={2}>
              {futureLine}
            </Text>
            <Text style={styles.linePrice}>${FUTURE_BOOKING_FEE.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>

          <View style={styles.payRow}>
            {(["CASH", "CREDIT", "OTHER"] as const).map((label) => (
              <Pressable
                key={label}
                style={[styles.payBtn, { borderColor: "rgba(255,255,255,0.35)" }]}
                onPress={() => {}}
                accessibilityRole="button"
                accessibilityLabel={`Pay ${label}`}
              >
                <Text style={styles.payBtnText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </BlurView>
      </ScrollView>
    </View>
  );
}

function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return hexColor;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    zIndex: 20,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingBottom: vs(8),
  },
  backButton: {
    width: ms(44),
    height: ms(44),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  checkoutLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: ms(11),
    fontWeight: "800",
    letterSpacing: ms(2),
  },
  topbarSpacer: {
    width: ms(44),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  glassCard: {
    borderRadius: ms(20),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: wp(4),
    paddingTop: vs(16),
    paddingBottom: vs(20),
    backgroundColor: "rgba(12, 12, 16, 0.55)",
  },
  brandArea: {
    height: hp(10),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(14),
  },
  brandAreaText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    fontWeight: "700",
    letterSpacing: ms(1),
  },
  clientName: {
    color: "#FFFFFF",
    fontSize: ms(22),
    fontWeight: "800",
    marginBottom: vs(4),
  },
  visitDate: {
    color: "rgba(255,255,255,0.75)",
    fontSize: ms(13),
    fontWeight: "600",
    marginBottom: vs(18),
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: ms(10),
    fontWeight: "800",
    letterSpacing: ms(1.2),
    marginBottom: vs(10),
  },
  sectionSpaced: {
    marginTop: vs(16),
  },
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: ms(12),
    marginBottom: vs(8),
  },
  lineName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: ms(14),
    fontWeight: "600",
  },
  linePrice: {
    color: "#FFFFFF",
    fontSize: ms(14),
    fontWeight: "700",
  },
  suggestedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    marginBottom: vs(10),
  },
  suggestedName: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginTop: vs(10),
    marginBottom: vs(12),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(18),
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: ms(17),
    fontWeight: "800",
  },
  totalAmount: {
    color: "#FFFFFF",
    fontSize: ms(20),
    fontWeight: "800",
  },
  payRow: {
    flexDirection: "row",
    gap: ms(10),
    justifyContent: "space-between",
  },
  payBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: ms(999),
    borderWidth: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: ms(11),
    fontWeight: "800",
    letterSpacing: ms(0.5),
  },
});
