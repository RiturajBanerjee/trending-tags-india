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
  momentumLabelsHi,
  type Trend,
} from "@/data/trends";
import { useColors } from "@/hooks/useColors";

type Props = { trend: Trend };

export function TrendCard({ trend }: Props) {
  const colors = useColors();

  const onPress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
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
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      {/* ── Tag banner — the star of the show ── */}
      <View style={[styles.tagBanner, { backgroundColor: colors.primary + "10" }]}>
        <View style={styles.tagBannerInner}>
          <Text style={[styles.tagBig, { color: colors.primary }]} numberOfLines={1}>
            {trend.tag}
          </Text>
          <View style={styles.momentumRow}>
            <Feather name={momentumIcon} size={12} color={momentumColor} />
            <Text style={[styles.momentumText, { color: momentumColor }]}>
              {momentumLabelsHi[trend.momentum]}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Card body ── */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.rankBubble, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.rankText, { color: colors.primary }]}>
              {trend.rank}
            </Text>
          </View>
          <CategoryChip category={trend.category} labelHi={trend.categoryLabelHi} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {trend.titleHi}
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {trend.descriptionHi}
        </Text>

        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Feather name="rss" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {trend.headlineCount} खबरें
            </Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {trend.region}
            </Text>
          </View>
          <View style={styles.spacer} />
          <HeatBar heat={trend.heat} width={48} />
          <Text style={[styles.heatNum, { color: colors.foreground }]}>{trend.heat}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },

  tagBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tagBig: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    flex: 1,
  },
  momentumRow: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 },
  momentumText: { fontSize: 11, fontWeight: "700" },

  body: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8, gap: 5 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 13, fontWeight: "800" },

  title: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  desc: { fontSize: 13, lineHeight: 18 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, fontWeight: "600" },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#CCCCCC" },
  spacer: { flex: 1 },
  heatNum: { fontSize: 12, fontWeight: "800" },
});
