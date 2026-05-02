import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetTrends } from "@workspace/api-client-react";

import {
  CategoryFilter,
  type FilterValue,
} from "@/components/CategoryFilter";
import { HotTrendHero } from "@/components/HotTrendHero";
import { TrendCard } from "@/components/TrendCard";
import type { Trend, TrendCategory } from "@/data/trends";
import { useColors } from "@/hooks/useColors";

function timeStringHi(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "अपराह्न" : "पूर्वाह्न";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${period}`;
}

function dateStringHi(date: Date): string {
  const days = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
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
  const [now, setNow] = useState(new Date());

  const { data, isLoading, isError, refetch, isFetching } = useGetTrends();

  const allTrends: Trend[] = (data?.trends as Trend[] | undefined) ?? [];

  // Which categories actually have trends right now
  const availableCategories = useMemo(
    () => new Set(allTrends.map((t) => t.category as TrendCategory)),
    [allTrends],
  );

  // If the selected category disappeared from fresh data, reset to "all"
  useEffect(() => {
    if (filter !== "all" && !availableCategories.has(filter as TrendCategory)) {
      setFilter("all");
    }
  }, [availableCategories, filter]);

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? allTrends
        : allTrends.filter((t) => t.category === filter);
    return list.slice().sort((a, b) => a.rank - b.rank);
  }, [allTrends, filter]);

  const hero = filtered[0];
  const rest = filtered.slice(1);

  const onRefresh = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNow(new Date());
    refetch();
  };

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomBarHeight = 62 + (Platform.OS === "web" ? 34 : insets.bottom);
  const listBottomPad = bottomBarHeight + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Top strip */}
      <View style={[styles.topStrip, { paddingTop: topInset + 6 }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.brand, { color: colors.foreground }]}>ट्रेंड्स</Text>
          {data && (
            <View style={[styles.liveBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.liveText, { color: colors.primary }]}>लाइव</Text>
            </View>
          )}
        </View>
        <Text style={[styles.subhead, { color: colors.mutedForeground }]}>
          {dateStringHi(now)} · अपडेट {timeStringHi(now)}
        </Text>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            आज के ट्रेंड ढूंढे जा रहे हैं...
          </Text>
          <Text style={[styles.loadingHint, { color: colors.mutedForeground }]}>
            RSS फ़ीड और AI विश्लेषण जारी है
          </Text>
        </View>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <Pressable
          onPress={() => refetch()}
          style={[styles.errorBanner, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "28" }]}
        >
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            फ़ीड लोड नहीं हुई — टैप करके दोबारा कोशिश करें
          </Text>
        </Pressable>
      )}

      {/* Feed */}
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
            {!isLoading && allTrends.length > 0 && (
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  आज भारत में क्या ट्रेंड है
                </Text>
                <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                  {filtered.length} टॉप टैग
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <TrendCard trend={item} />}
        ListEmptyComponent={
          !hero && !isLoading ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {isError
                  ? "डेटा लोड नहीं हुआ"
                  : "इस श्रेणी में अभी कोई ट्रेंड नहीं"}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
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
        <CategoryFilter
          value={filter}
          onChange={setFilter}
          availableCategories={availableCategories}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topStrip: { paddingHorizontal: 16, paddingBottom: 8 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { width: 8, height: 8, borderRadius: 4 },
  brand: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5 },
  liveText: { fontSize: 10, fontWeight: "800" },
  subhead: { fontSize: 11, marginTop: 2, fontWeight: "600", marginLeft: 16 },

  loadingWrap: { alignItems: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 13, fontWeight: "700" },
  loadingHint: { fontSize: 11, fontWeight: "500" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, fontWeight: "600", flex: 1 },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  sectionCount: { fontSize: 12, fontWeight: "600" },

  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 10,
  },
});
