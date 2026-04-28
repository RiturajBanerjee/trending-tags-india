import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CategoryChip } from "@/components/CategoryChip";
import { HeatBar } from "@/components/HeatBar";
import {
  formatCount,
  momentumLabelsHi,
  sourceLabelsHi,
  type Trend,
} from "@/data/trends";
import { useColors } from "@/hooks/useColors";

type Props = {
  trend: Trend;
};

export function TrendCard({ trend }: Props) {
  const colors = useColors();

  const onPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    router.push(`/trend/${trend.id}`);
  };

  const momentumIcon =
    trend.momentum === "rising"
      ? "trending-up"
      : trend.momentum === "peaking"
        ? "zap"
        : "trending-down";

  const momentumColor =
    trend.momentum === "rising"
      ? colors.warm
      : trend.momentum === "peaking"
        ? colors.hot
        : colors.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.rankBubble,
            { backgroundColor: colors.primary + "12" },
          ]}
        >
          <Text style={[styles.rankText, { color: colors.primary }]}>
            {trend.rank}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <CategoryChip
              category={trend.category}
              labelHi={trend.categoryLabelHi}
            />
            <View style={styles.momentumRow}>
              <Feather
                name={momentumIcon}
                size={12}
                color={momentumColor}
              />
              <Text
                style={[styles.momentumText, { color: momentumColor }]}
              >
                {momentumLabelsHi[trend.momentum]}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {trend.titleHi}
          </Text>
          <Text style={[styles.tag, { color: colors.primary }]}>
            {trend.tag}
          </Text>
          <Text
            style={[styles.desc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {trend.descriptionHi}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Feather
                name="message-circle"
                size={12}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.metaText,
                  { color: colors.mutedForeground },
                ]}
              >
                {formatCount(trend.postsCount)} पोस्ट
              </Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Feather
                name="eye"
                size={12}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.metaText,
                  { color: colors.mutedForeground },
                ]}
              >
                {formatCount(trend.viewsCount)} व्यू
              </Text>
            </View>
          </View>

          <View style={styles.heatRow}>
            <HeatBar heat={trend.heat} />
            <Text
              style={[styles.heatText, { color: colors.foreground }]}
            >
              {trend.heat}
            </Text>
            <View style={styles.spacer} />
            <Text
              style={[
                styles.sourceText,
                { color: colors.mutedForeground },
              ]}
            >
              {sourceLabelsHi[trend.primarySource]}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rankBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  momentumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  momentumText: {
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  tag: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: -2,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CFC2B0",
  },
  heatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  heatText: {
    fontSize: 12,
    fontWeight: "800",
  },
  spacer: { flex: 1 },
  sourceText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
