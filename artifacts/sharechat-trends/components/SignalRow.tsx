import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { sourceLabelsHi, type TrendSource } from "@/data/trends";
import { useColors } from "@/hooks/useColors";

type Props = {
  sources: TrendSource[];
};

const ICONS: Record<TrendSource, keyof typeof Feather.glyphMap> = {
  search: "search",
  social: "users",
  news: "tv",
  video: "play-circle",
  "cross-platform": "share-2",
};

export function SignalRow({ sources }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      {sources.map((s) => (
        <View
          key={s}
          style={[
            styles.chip,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather
            name={ICONS[s]}
            size={12}
            color={colors.secondaryForeground}
          />
          <Text
            style={[
              styles.text,
              { color: colors.secondaryForeground },
            ]}
          >
            {sourceLabelsHi[s]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});
