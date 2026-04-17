import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import type { Product } from "../../data/types";
import { useRetailCatalog } from "../../context/RetailCatalogContext";
import { WheelPicker, type WheelPickerItem } from "./WheelPicker";
import { ms, vs, wp, hp } from "../../utils/responsive";

type Step = "category" | "brand" | "product";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
};

export function AddRetailProductFlowModal({ visible, onClose, onAddProduct }: Props) {
  const {
    getRetailCategories,
    getBrandsForCategory,
    getProductsForCategoryAndBrand,
    getRetailItemById,
  } = useRetailCatalog();

  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [anotherPrompt, setAnotherPrompt] = useState(false);

  const categories = useMemo(() => getRetailCategories(), []);
  const categoryItems: WheelPickerItem[] = useMemo(
    () => categories.map((c) => ({ id: c, label: c })),
    [categories]
  );

  const brands = useMemo(
    () => (selectedCategory ? getBrandsForCategory(selectedCategory) : []),
    [selectedCategory]
  );
  const brandItems: WheelPickerItem[] = useMemo(
    () => brands.map((b) => ({ id: b, label: b })),
    [brands]
  );

  const products = useMemo(
    () =>
      selectedCategory && selectedBrand
        ? getProductsForCategoryAndBrand(selectedCategory, selectedBrand)
        : [],
    [selectedCategory, selectedBrand]
  );
  const productItems: WheelPickerItem[] = useMemo(
    () => products.map((p) => ({ id: p.id, label: `${p.name}  $${p.price.toFixed(0)}` })),
    [products]
  );

  const selectedCatalogProduct = useMemo(
    () => (selectedProductId ? getRetailItemById(selectedProductId) : undefined),
    [selectedProductId]
  );

  const resetFlow = useCallback(() => {
    const firstCat = categories[0] ?? null;
    setStep("category");
    setSelectedCategory(firstCat);
    setSelectedBrand(null);
    setSelectedProductId(null);
  }, [categories]);

  useEffect(() => {
    if (visible) {
      resetFlow();
      setAnotherPrompt(false);
    }
  }, [visible, resetFlow]);

  useEffect(() => {
    if (step === "category" && categoryItems.length && selectedCategory == null) {
      setSelectedCategory(categoryItems[0].id);
    }
  }, [step, categoryItems, selectedCategory]);

  useEffect(() => {
    if (step === "brand" && brandItems.length) {
      setSelectedBrand((prev) => (prev && brands.includes(prev) ? prev : brandItems[0].id));
    }
  }, [step, brandItems, brands]);

  useEffect(() => {
    if (step === "product" && productItems.length) {
      setSelectedProductId((prev) =>
        prev && products.some((p) => p.id === prev) ? prev : productItems[0].id
      );
    }
  }, [step, productItems, products]);

  const titleForStep = useMemo(() => {
    switch (step) {
      case "category":
        return "Choose category";
      case "brand":
        return "Choose brand";
      case "product":
        return "Choose product";
      default:
        return "";
    }
  }, [step]);

  const goNext = useCallback(() => {
    if (step === "category" && selectedCategory) {
      setStep("brand");
      const b = getBrandsForCategory(selectedCategory);
      setSelectedBrand(b[0] ?? null);
      return;
    }
    if (step === "brand" && selectedBrand && selectedCategory) {
      setStep("product");
      const prods = getProductsForCategoryAndBrand(selectedCategory, selectedBrand);
      setSelectedProductId(prods[0]?.id ?? null);
    }
  }, [step, selectedCategory, selectedBrand]);

  const goBack = useCallback(() => {
    if (step === "brand") setStep("category");
    if (step === "product") setStep("brand");
  }, [step]);

  const confirmAdd = useCallback(() => {
    if (!selectedProductId) return;
    const row = getRetailItemById(selectedProductId);
    if (!row) return;
    const product: Product = {
      id: `retail-${row.id}-${Date.now()}`,
      brand: row.brand,
      name: row.name,
      price: row.price,
      retailCategory: row.category,
      imageUrl: row.imageUrl,
    };
    onAddProduct(product);
    setAnotherPrompt(true);
  }, [selectedProductId, onAddProduct]);

  const onAnotherYes = useCallback(() => {
    setAnotherPrompt(false);
    resetFlow();
  }, [resetFlow]);

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
                <Text style={styles.sheetTitle}>Add products</Text>
                <Text style={styles.stepTitle}>{titleForStep}</Text>

                {step === "category" && (
                  <WheelPicker
                    items={categoryItems}
                    selectedId={selectedCategory}
                    onSelectId={setSelectedCategory}
                  />
                )}
                {step === "brand" && (
                  <WheelPicker
                    items={brandItems}
                    selectedId={selectedBrand}
                    onSelectId={setSelectedBrand}
                  />
                )}
                {step === "product" && (
                  <>
                    <View style={styles.productPreviewWrap}>
                      {selectedCatalogProduct?.imageUrl ? (
                        <Image
                          source={{ uri: selectedCatalogProduct.imageUrl }}
                          style={styles.productPreviewImage}
                          resizeMode="cover"
                          accessibilityIgnoresInvertColors
                        />
                      ) : (
                        <View style={styles.productPreviewPlaceholder}>
                          <Text style={styles.productPreviewPlaceholderText} numberOfLines={2}>
                            {selectedCatalogProduct?.name ?? "—"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <WheelPicker
                      items={productItems}
                      selectedId={selectedProductId}
                      onSelectId={setSelectedProductId}
                    />
                  </>
                )}

                <View style={styles.rowActions}>
                  <View style={styles.rowLeft}>
                    {step !== "category" && (
                      <TouchableOpacity style={styles.btnGhost} onPress={goBack} activeOpacity={0.85}>
                        <Text style={styles.btnGhostText}>Back</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.rowRight}>
                    {step !== "product" ? (
                      <TouchableOpacity
                        style={[
                          styles.btnPrimary,
                          (step === "category" && !selectedCategory) ||
                          (step === "brand" && !selectedBrand)
                            ? styles.btnDisabled
                            : null,
                        ]}
                        onPress={goNext}
                        activeOpacity={0.85}
                        disabled={
                          (step === "category" && !selectedCategory) ||
                          (step === "brand" && !selectedBrand)
                        }
                      >
                        <Text style={styles.btnPrimaryText}>Next</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.btnPrimary, !selectedProductId ? styles.btnDisabled : null]}
                        onPress={confirmAdd}
                        activeOpacity={0.85}
                        disabled={!selectedProductId}
                      >
                        <Text style={styles.btnPrimaryText}>Add product</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.cancel} hitSlop={12}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
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
                <Text style={styles.anotherTitle}>Add another product?</Text>
                <Text style={styles.anotherSub}>
                  Tap Yes to pick category, brand, and product again.
                </Text>
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
  modalRootFill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
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
  productPreviewWrap: {
    alignSelf: "center",
    marginBottom: vs(10),
    borderRadius: ms(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  productPreviewImage: {
    width: wp(52),
    height: hp(18),
  },
  productPreviewPlaceholder: {
    width: wp(52),
    height: hp(12),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(4),
  },
  productPreviewPlaceholderText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(11),
    fontWeight: "600",
    textAlign: "center",
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(14),
  },
  rowLeft: {
    minWidth: ms(72),
  },
  rowRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  btnDisabled: {
    opacity: 0.4,
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
    paddingHorizontal: wp(6),
    paddingVertical: vs(10),
    borderRadius: ms(12),
    backgroundColor: "rgba(255,255,255,0.14)",
    minWidth: wp(28),
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
  },
  cancel: {
    alignSelf: "center",
    marginTop: vs(10),
    paddingVertical: vs(6),
  },
  cancelText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(12),
    fontWeight: "600",
  },
  anotherWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
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
    lineHeight: ms(18),
    marginBottom: vs(16),
  },
  anotherRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ms(12),
  },
});
