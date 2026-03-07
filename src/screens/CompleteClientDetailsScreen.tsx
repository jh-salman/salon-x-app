// ClientDetailWireframe.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";
import { format } from "date-fns";
import { RightDecoration } from "../components/RightDecoration";
import { CalendarBackArrow } from "../components/CalendarHeaderDynamic";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-expect-error - @expo/vector-icons resolved via expo
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import type { ClientDetails } from "../data/clients";
import { wp, hp, ms, vs } from "../utils/responsive";

const SOCIAL_ICONS: { name: string }[] = [
  { name: "facebook-f" },
  { name: "twitter" },
  { name: "instagram" },
  { name: "pinterest-p" },
  { name: "snapchat" },
];

interface CompleteClientDetailsScreenProps {
  clientDetails: ClientDetails;
}

export default function CompleteClientDetailsScreen({ clientDetails }: CompleteClientDetailsScreenProps) {
  const {
    clientName,
    phone,
    clientPhoto,
    date,
    duration,
    techniqueNotes,
    personalNotes,
    services,
    recommendations,
    products,
  } = clientDetails;
  const dateStr = format(date, "M.d.yyyy");

  return (


     
     <SafeAreaView style={styles.safeArea} edges={["top"]}>
       
       {/* Header Row */}
       <View style={styles.headerRow}>
     

          <View style={styles.rightDecorationWrap}>
            <RightDecoration date={date} />
          </View>

         
        </View>


        <View style={styles.mainContent}>
         {/* Header Row */}
         <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <CalendarBackArrow />
          </TouchableOpacity>

         

         
        </View>
          {/* Profile - dynamic from clientDetails */}
          <View style={styles.profileWrap}>
            {clientPhoto != null ? (
              <Image source={clientPhoto} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{clientName.charAt(0)}</Text>
              </View>
            )}

            <View style={styles.profileRow}>
              <View style={styles.smallIconGroup}>
                <View style={styles.smallSquare} />
                <View style={styles.smallSquare} />
              </View>

              <View style={styles.nameBlock}>
                <Text style={styles.nameText} numberOfLines={1}>{clientName}</Text>
                <Text style={styles.subText} numberOfLines={1}>{phone ?? "—"}</Text>
              </View>

              <View style={{ flex: 1 }} />

              <TouchableOpacity style={styles.iconBtn} accessibilityLabel="More options">
                <Text style={styles.iconText}>⋮</Text>
              </TouchableOpacity>
            </View>

            {/* Slider placeholder */}
            <View style={styles.sliderWrap}>
              <View style={styles.sliderLine} />
              <View style={styles.sliderKnob} />
            </View>
          </View>

          {/* Cards container: 80% width, centered, professional */}
          <View style={styles.cardsContainer}>
            {/* Consultation Card - from clientDetails (double height) */}
            <SectionCard title="Consultation" cardMinHeight={hp(17)}>
              <View style={styles.consultTopRow}>
                <Text style={styles.blockTitle}>{dateStr}</Text>
                <Text style={styles.blockTitle}>{duration} min</Text>
              </View>
              <View style={styles.hr} />
              {techniqueNotes.length > 0 && techniqueNotes.map((note, i) => (
                <Text key={i} style={styles.bodyText}>{note}</Text>
              ))}
            </SectionCard>

            {/* Services Card - from clientDetails */}
            <SectionCard title="Services">
              {services.map((s) => (
                <WireRow key={s.id} left={s.name} right={`$${s.price.toFixed(2)}`} bullet={s.completed !== false ? "●" : "○"} />
              ))}
              {recommendations.length > 0 && (
                <>
                  <View style={styles.recommendedPill}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                  {recommendations.map((s) => (
                    <WireRow key={s.id} left={s.name} right={`$${s.price.toFixed(2)}`} bullet="○" />
                  ))}
                </>
              )}
            </SectionCard>

            {/* Home Care Card - from clientDetails */}
            {products.length > 0 && (
              <SectionCard title="Home Care">
                {products.map((p) => (
                  <ProductRow key={p.id} name={`${p.brand}: ${p.name}`} price={`$${p.price.toFixed(2)}`} />
                ))}
              </SectionCard>
            )}
          </View>

          {/* Messages/Update */}
          <View style={styles.centerPill}>
            <Text style={styles.pillText}>Messages / update</Text>
          </View>

          {/* Bottom CTAs */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.cta}>
              <Text style={styles.ctaIcon}>⟳</Text>
              <Text style={styles.ctaText}>Rebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cta}>
              <Text style={styles.ctaIcon}>⚑</Text>
              <Text style={styles.ctaText}>Check out</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: vs(44) }} />

          {/* Bottom Social Icons - fixed at bottom, horizontally centered */}
          <View style={styles.bottomIcons}>
            {SOCIAL_ICONS.map(({ name }) => (
              <TouchableOpacity key={name} style={styles.bottomIconCircle} activeOpacity={0.7}>
                <FontAwesome5 name={name} size={ms(24)} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      
      
     </SafeAreaView>

  );
}

/** --- Small components --- */

function SectionCard({
  title,
  children,
  cardMinHeight,
}: {
  title: string;
  children: React.ReactNode;
  cardMinHeight?: number;
}) {
  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardTitlePill}>
        <Text style={styles.cardTitleText}>{title}</Text>
      </View>
      <View style={[styles.card, cardMinHeight != null && { minHeight: cardMinHeight }]}>{children}</View>
    </View>
  );
}

function WireRow({
  left,
  right,
  bullet,
}: {
  left: string;
  right: string;
  bullet: "●" | "○";
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.bullet}>{bullet}</Text>
      <Text style={styles.rowLeft}>{left}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  );
}

function ProductRow({ name, price }: { name: string; price: string }) {
  return (
    <View style={styles.productRow}>
      <View style={styles.productIcon} />
      <Text style={styles.rowLeft}>{name}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rowRight}>{price}</Text>
    </View>
  );
}

/** --- Styles --- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  headerRow: { flexDirection: "row", backgroundColor: "transparent", alignItems: "center" },
  backButton: { width: ms(44), height: ms(44), justifyContent: "center", alignItems: "center" },
  rightDecorationWrap: { position: "absolute", right: 0, top: 0 },
  mainContent: { flex: 1, backgroundColor: "#000" },
  iconBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#fff", fontSize: ms(16) },
  datePill: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: ms(18),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: { color: "#fff", fontSize: ms(12), lineHeight: ms(14), fontWeight: "600" },
  scrollContent: { paddingHorizontal: 0, paddingBottom: hp(3) },
  profileWrap: { marginTop: hp(-2.5), alignItems: "center" },
  avatar: {
    width: ms(74),
    height: ms(74),
    borderRadius: ms(37),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: hp(1),
  },
  avatarPlaceholder: { backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: ms(28), color: "#fff", fontWeight: "700" },
  profileRow: { width: "80%", flexDirection: "row", alignItems: "center", gap: ms(10) },
  smallIconGroup: { flexDirection: "row", gap: ms(8) },
  smallSquare: {
    width: ms(34),
    height: vs(28),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  nameBlock: { gap: hp(0.25) },
  nameText: { color: "#fff", fontSize: ms(16), fontWeight: "700" },
  subText: { color: "rgba(255,255,255,0.85)", fontSize: ms(12) },
  sliderWrap: { width: "60%", marginTop: hp(0.6), marginBottom: hp(0.75), height: vs(26), justifyContent: "center" },
  sliderLine: { height: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  sliderKnob: {
    position: "absolute",
    right: wp(2.5),
    width: ms(14),
    height: ms(14),
    borderRadius: ms(7),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "#25AFFF",
  },
  cardsContainer: { width: "90%", alignSelf: "center", marginTop: hp(0.5) },
  cardWrap: { marginTop: hp(1.2) },
  cardTitlePill: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: ms(10),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    marginBottom: hp(-1),
    zIndex: 1,
    backgroundColor: "#000",
  },
  cardTitleText: { color: "#fff", fontSize: ms(11), fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: ms(12),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.75),
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  consultTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: hp(0.25) },
  blockTitle: { color: "#fff", fontSize: ms(11), fontWeight: "700" },
  hr: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: hp(0.6) },
  bodyText: { color: "rgba(255,255,255,0.9)", fontSize: ms(11), lineHeight: ms(14) },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: hp(0.6) },
  bullet: { width: ms(14), color: "rgba(255,255,255,0.9)", fontSize: ms(12), marginRight: ms(5) },
  rowLeft: { color: "#fff", fontSize: ms(11), fontWeight: "600" },
  rowRight: { color: "#fff", fontSize: ms(11), fontWeight: "700" },
  recommendedPill: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: ms(8),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.25),
    marginVertical: hp(0.5),
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  recommendedText: { color: "#fff", fontSize: ms(10), fontWeight: "700" },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: hp(0.6), gap: ms(6) },
  productIcon: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  centerPill: {
    alignSelf: "center",
    marginTop: hp(1.2),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: ms(10),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
  },
  pillText: { color: "#fff", fontSize: ms(11), fontWeight: "700" },
  ctaRow: { flexDirection: "row", gap: ms(8), marginTop: hp(1.2), width: "90%", height: vs(85), alignSelf: "center" },
  cta: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: ms(10),
    paddingVertical: hp(1.5),
    alignItems: "center",
    justifyContent: "center",
    gap: hp(0.5),
  },
  ctaIcon: { color: "#fff", fontSize: ms(14) },
  ctaText: { color: "#fff", fontSize: ms(12), fontWeight: "800" },
  bottomIcons: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: wp(4),
    paddingVertical: hp(1.2),
  },
  bottomIconCircle: {
    width: ms(36),
    height: ms(36),
    alignItems: "center",
    justifyContent: "center",
  },
});