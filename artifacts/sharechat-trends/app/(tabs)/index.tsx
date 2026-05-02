import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CategoryFilter,
  type FilterValue,
} from "@/components/CategoryFilter";
import { HotTrendHero } from "@/components/HotTrendHero";
import { TrendCard } from "@/components/TrendCard";
import { trends } from "@/data/trends";
import { useColors } from "@/hooks/useColors";

function timeStringHi(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "अपराह्न" : "पूर्वाह्न";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${period}`;
}

function dateStringHi(date: Date): string {
  const days = [
    "रविवार", "सोमवार", "मंगलवार", "बुधवार",
    "गुरुवार", "शुक्रवार", "शनिवार",
  ];
  const months = [
    "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

export default function TrendingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? trends
        : trends.filter((t) => t.category === filter);
    return list.slice().sort((a, b) => a.rank - b.rank);
  }, [filter]);

  const hero = filtered[0];
  const rest = filtered.slice(1);

  const onRefresh = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => {
      setNow(new Date());
      setRefreshing(false);
    }, 800);
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomBarHeight = 62 + (Platform.OS === "web" ? 34 : insets.bottom);
  const listBottomPad = bottomBarHeight + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Slim top strip */}
      <View style={[styles.topStrip, { paddingTop: topInset + 6 }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.brand, { color: colors.foreground }]}>ट्रेंड्स</Text>
        </View>
        <Text style={[styles.subhead, { color: colors.mutedForeground }]}>
          {dateStringHi(now)} · अपडेट {timeStringHi(now)}
        </Text>
      </View>

      {/* Scrollable feed */}
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: listBottomPad,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {hero ? <HotTrendHero trend={hero} /> : null}
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                आज भारत में क्या ट्रेंड है
              </Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                {filtered.length} टॉप टैग
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <TrendCard trend={item} />}
        ListEmptyComponent={
          !hero ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                इस श्रेणी में अभी कोई ट्रेंड नहीं
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky bottom category filter */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8,
          },
        ]}
      >
        <CategoryFilter value={filter} onChange={setFilter} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topStrip: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subhead: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
    marginLeft: 16,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 10,
  },
});
