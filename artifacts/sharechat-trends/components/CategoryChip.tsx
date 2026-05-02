import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { TrendCategory } from "@/data/trends";

type Props = {
  category: TrendCategory;
  labelHi: string;
  size?: "sm" | "md";
  heroMode?: boolean; // white text on dark hero background
};

export function CategoryChip({ category, labelHi, size = "sm", heroMode = false }: Props) {
  const colors = useColors();

  const tintMap: Record<TrendCategory, string> = {
    sports: colors.catSports,
    news: colors.catNews,
    entertainment: colors.catEntertainment,
    festival: colors.catFestival,
    finance: colors.catFinance,
    tech: colors.catTech,
    weather: colors.catWeather,
    politics: colors.catPolitics,
    viral: colors.catViral,
  };

  const tint = tintMap[category];

  if (heroMode) {
    return (
      <View
        style={[
          styles.chip,
          size === "md" && styles.chipMd,
          { backgroundColor: "rgba(255,255,255,0.22)", borderColor: "rgba(255,255,255,0.35)" },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: "#FFFFFF" }]} />
        <Text
          style={[
            styles.label,
            size === "md" && styles.labelMd,
            { color: "#FFFFFF" },
          ]}
        >
          {labelHi}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.chip,
        size === "md" && styles.chipMd,
        {
          backgroundColor: tint + "18",
          borderColor: tint + "30",
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text
        style={[
          styles.label,
          size === "md" && styles.labelMd,
          { color: tint },
        ]}
      >
        {labelHi}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  chipMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  labelMd: {
    fontSize: 13,
  },
});
