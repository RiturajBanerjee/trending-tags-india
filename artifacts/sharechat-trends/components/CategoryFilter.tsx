import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import type { TrendCategory } from "@/data/trends";

export type FilterValue = TrendCategory | "all";

const ALL_FILTERS: { value: FilterValue; labelHi: string }[] = [
  { value: "all",           labelHi: "सभी" },
  { value: "sports",        labelHi: "खेल" },
  { value: "entertainment", labelHi: "मनोरंजन" },
  { value: "news",          labelHi: "ख़बरें" },
  { value: "festival",      labelHi: "त्यौहार" },
  { value: "viral",         labelHi: "वायरल" },
  { value: "finance",       labelHi: "वित्त" },
  { value: "tech",          labelHi: "टेक" },
  { value: "weather",       labelHi: "मौसम" },
  { value: "politics",      labelHi: "राजनीति" },
];

type Props = {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  /** Categories that have at least one trend — only these are shown (plus "all") */
  availableCategories: Set<TrendCategory>;
};

export function CategoryFilter({ value, onChange, availableCategories }: Props) {
  const colors = useColors();

  const visible = ALL_FILTERS.filter(
    (f) => f.value === "all" || availableCategories.has(f.value as TrendCategory)
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {visible.map((f) => {
        const active = value === f.value;
        return (
          <TouchableOpacity
            key={f.value}
            onPress={() => onChange(f.value)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.foreground : colors.card,
                  borderColor:     active ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.background : colors.foreground },
                ]}
              >
                {f.labelHi}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
