import React, { useRef } from "react";
import { View, Text, Animated, Easing, Pressable, type StyleProp, type ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { NEUTRAL_BORDER, NEUTRAL_PILL_BORDER, withAlpha } from "./constants";
import { clientDetailsStyles as styles } from "./completeClientDetailsStyles";
import { ms } from "../../utils/responsive";

export function InteractiveSectionCard({
  title,
  children,
  height,
  completed,
  primaryColor,
  glowPulse,
  onOpen,
  wrapStyle,
}: {
  title: string;
  children: React.ReactNode;
  height: number;
  completed: boolean;
  primaryColor: string;
  glowPulse: Animated.Value;
  onOpen: () => void;
  wrapStyle?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const borderPulseOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  const onPressIn = () => {
    Animated.timing(scale, { toValue: 1.02, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const completedBorder = completed ? withAlpha(primaryColor, 0.32) : NEUTRAL_BORDER;

  return (
    <View style={[styles.sectionWrap, wrapStyle]}>
      {/* Title overlaps the card; without pointerEvents none it steals taps from Pressable below. */}
      <View
        style={[styles.sectionTitlePill, { borderColor: NEUTRAL_PILL_BORDER }]}
        pointerEvents="none"
      >
        <Text style={styles.sectionTitleText}>{title}</Text>
      </View>
      <Pressable
        onPress={onOpen}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <View
            style={[
              styles.sectionCard,
              {
                height,
                borderColor: completedBorder,
                shadowColor: completed ? primaryColor : "transparent",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: completed ? 0.22 : 0,
                shadowRadius: completed ? ms(10) : 0,
                elevation: completed ? 4 : 0,
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.sectionGlowPulse,
                {
                  borderColor: primaryColor,
                  opacity: borderPulseOpacity,
                },
              ]}
            />
            {children}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function BottomActionButton({
  label,
  iconName,
  completed,
  primaryColor,
  glowPulse,
  onPress,
}: {
  label: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  completed: boolean;
  primaryColor: string;
  glowPulse: Animated.Value;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const borderPulseOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const onPressIn = () => {
    Animated.timing(scale, { toValue: 1.02, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const completedBorder = completed ? withAlpha(primaryColor, 0.32) : NEUTRAL_BORDER;

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.bottomBtn, { borderColor: completedBorder }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bottomBtnGlow,
              {
                borderColor: primaryColor,
                opacity: borderPulseOpacity,
              },
            ]}
          />
          <MaterialCommunityIcons name={iconName} size={ms(16)} color="rgba(255,255,255,0.9)" />
          <Text style={styles.bottomBtnText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function ServiceItem({ name, price }: { name: string; price: string }) {
  return (
    <View style={styles.serviceItemRow}>
      <View style={styles.serviceLeft}>
        <View style={styles.bulletDot} />
        <Text style={styles.serviceName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={styles.priceText}>{price}</Text>
    </View>
  );
}

export function ProductItem({ name, price }: { name: string; price: string }) {
  return (
    <View style={styles.productItemRow}>
      <View style={styles.productLeft}>
        <View style={styles.productImg} />
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>
      </View>
      <Text style={styles.priceText}>{price}</Text>
    </View>
  );
}

export function TinyRow({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.tinyRow}>
      <View style={styles.tinyLeft}>
        <View style={styles.neutralCheck}>
          <MaterialCommunityIcons name="check" size={ms(10)} color="#fff" />
        </View>
        <Text style={styles.tinyText} numberOfLines={1}>
          {left}
        </Text>
      </View>
      <Text style={styles.tinyPrice}>{right}</Text>
    </View>
  );
}
