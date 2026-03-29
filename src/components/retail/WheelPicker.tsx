import React, { useCallback, useEffect, useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ms, vs } from "../../utils/responsive";

export type WheelPickerItem = { id: string; label: string };

const ITEM_HEIGHT = vs(44);
const VISIBLE_ROWS = 5;

type Props = {
  items: WheelPickerItem[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
};

export function WheelPicker({ items, selectedId, onSelectId }: Props) {
  const listRef = useRef<FlatList<WheelPickerItem>>(null);
  const listHeight = ITEM_HEIGHT * VISIBLE_ROWS;
  const pad = (listHeight - ITEM_HEIGHT) / 2;

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (items.length === 0) return;
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const item = items[clamped];
      if (item) onSelectId(item.id);
    },
    [items, onSelectId]
  );

  useEffect(() => {
    if (items.length === 0) return;
    const idx = selectedId != null ? items.findIndex((i) => i.id === selectedId) : 0;
    const target = idx >= 0 ? idx : 0;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: target * ITEM_HEIGHT, animated: false });
    });
  }, [items, selectedId]);

  const renderItem = useCallback(
    ({ item }: { item: WheelPickerItem }) => {
      const isCenter = selectedId != null && item.id === selectedId;
      return (
        <View style={[styles.row, { height: ITEM_HEIGHT }]}>
          <Text
            style={[styles.rowText, isCenter && styles.rowTextCenter]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
        </View>
      );
    },
    [selectedId]
  );

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { height: listHeight }]}>
        <Text style={styles.emptyText}>No items</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height: listHeight }]}>
      <View pointerEvents="none" style={styles.highlightBar} />
      <FlatList
        ref={listRef}
        data={items}
        extraData={selectedId}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        contentContainerStyle={{ paddingVertical: pad }}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    position: "relative",
  },
  highlightBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -vs(22),
    height: vs(44),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 1,
  },
  row: {
    justifyContent: "center",
    paddingHorizontal: ms(8),
  },
  rowText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(12),
    textAlign: "center",
  },
  rowTextCenter: {
    color: "rgba(255,255,255,0.95)",
    fontSize: ms(14),
    fontWeight: "600",
  },
  empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(12),
  },
});
