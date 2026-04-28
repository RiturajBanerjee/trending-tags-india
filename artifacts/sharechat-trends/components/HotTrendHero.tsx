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
import { formatCount, type Trend } from "@/data/trends";
import { useColors } from "@/hooks/useColors";

type Props = {
  trend: Trend;
};

export function HotTrendHero({ trend }: Props) {
  const colors = useColors();

  const onPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/trend/${trend.id}`);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.hero,
        {
          backgroundColor: colors.primary,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.glow} />
      <View style={styles.glow2} />

      <View style={styles.topRow}>
        <View style={styles.flameRow}>
          <Feather name="zap" size={14} color="#FFE48A" />
          <Text style={styles.topLabel}>आज का सबसे हॉट</Text>
        </View>
        <CategoryChip
          category={trend.category}
          labelHi={trend.categoryLabelHi}
        />
      </View>

      <Text style={styles.title}>{trend.titleHi}</Text>
      <Text style={styles.tag}>{trend.tag}</Text>
      <Text style={styles.desc} numberOfLines={3}>
        {trend.descriptionHi}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{trend.heat}</Text>
          <Text style={styles.statLabel}>हीट स्कोर</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatCount(trend.postsCount)}
          </Text>
          <Text style={styles.statLabel}>पोस्ट</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatCount(trend.viewsCount)}
          </Text>
          <Text style={styles.statLabel}>व्यू</Text>
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>विस्तार से देखें</Text>
        <Feather name="arrow-right" size={16} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF6F2C",
    opacity: 0.5,
  },
  glow2: {
    position: "absolute",
    bottom: -80,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFB627",
    opacity: 0.25,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  topLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 16,
    lineHeight: 32,
  },
  tag: {
    color: "#FFE48A",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  desc: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
