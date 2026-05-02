import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetTrends } from "@workspace/api-client-react";

import { CategoryChip } from "@/components/CategoryChip";
import { HeatBar } from "@/components/HeatBar";
import { SignalRow } from "@/components/SignalRow";
import {
  momentumLabelsHi,
  sourceLabelsHi,
  type Trend,
} from "@/data/trends";
import { useColors } from "@/hooks/useColors";

export default function TrendDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useGetTrends();
  const allTrends: Trend[] = (data?.trends as Trend[] | undefined) ?? [];

  const trend = useMemo(
    () => allTrends.find((t) => t.id === id),
    [allTrends, id],
  );

  const related = useMemo(
    () =>
      trend
        ? allTrends
            .filter((t) => t.category === trend.category && t.id !== trend.id)
            .slice(0, 3)
        : [],
    [allTrends, trend],
  );

  const onShare = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const bottomInset = Platform.OS === "web" ? insets.bottom + 110 : insets.bottom + 90;
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;

  if (isLoading && !trend) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, fontWeight: "600", marginTop: 12 }}>
          लोड हो रहा है...
        </Text>
      </View>
    );
  }

  if (!trend) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontWeight: "600", marginTop: 10 }}>
          ट्रेंड नहीं मिला
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>वापस जाएँ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topInset + 16 }]}>
          <View style={styles.heroGlow} />
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="share-2" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.rankRow}>
              <View style={styles.rankPill}>
                <Feather name="award" size={12} color="#F5D679" />
                <Text style={styles.rankPillText}>रैंक #{trend.rank}</Text>
              </View>
              <CategoryChip
                category={trend.category}
                labelHi={trend.categoryLabelHi}
                size="md"
                heroMode
              />
            </View>
            <Text style={styles.heroTitle}>{trend.titleHi}</Text>
            <Text style={styles.heroTag}>{trend.tag}</Text>
            <Text style={styles.heroDesc}>{trend.descriptionHi}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Feather name="map-pin" size={12} color="#F5D679" />
                <Text style={styles.heroMetaText}>{trend.region}</Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Feather name="clock" size={12} color="#F5D679" />
                <Text style={styles.heroMetaText}>{trend.startedHoursAgo} घंटे पहले शुरू</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>

          {/* Stats — all derived from real data */}
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={[styles.statBig, { color: colors.foreground }]}>{trend.heat}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>हीट स्कोर</Text>
                <View style={styles.statNote}>
                  <Text style={[styles.statNoteText, { color: colors.mutedForeground }]}>AI रैंकिंग</Text>
                </View>
                <View style={{ marginTop: 6 }}><HeatBar heat={trend.heat} width={60} /></View>
              </View>
              <View style={[styles.statSep, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statBig, { color: colors.foreground }]}>{trend.headlineCount}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>खबरें</Text>
                <View style={styles.statNote}>
                  <Text style={[styles.statNoteText, { color: colors.mutedForeground }]}>RSS से</Text>
                </View>
              </View>
              <View style={[styles.statSep, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statBig, { color: colors.foreground }]}>{trend.startedHoursAgo}h</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>पहले</Text>
                <View style={styles.statNote}>
                  <Text style={[styles.statNoteText, { color: colors.mutedForeground }]}>AI अनुमान</Text>
                </View>
              </View>
            </View>

            {/* Transparency note */}
            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="info" size={12} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                हीट स्कोर और समय AI का अनुमान है — RSS खबरों की संख्या, विविधता और प्रमुखता से तय होता है। पोस्ट/व्यू काउंट ShareChat के आंतरिक डेटा से नहीं मिल सकते।
              </Text>
            </View>

            <View style={[styles.momentumBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather
                name={trend.momentum === "rising" ? "trending-up" : trend.momentum === "peaking" ? "zap" : "trending-down"}
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.momentumText, { color: colors.primary }]}>
                मोमेंटम: {momentumLabelsHi[trend.momentum]}
              </Text>
            </View>
          </View>

          {/* Signal sources */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              सिग्नल कहाँ से आए
            </Text>
            <SignalRow sources={trend.sources} />
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              मुख्य स्रोत: {sourceLabelsHi[trend.primarySource]}
            </Text>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              किन भाषाओं में चर्चा
            </Text>
            <View style={styles.langWrap}>
              {trend.topLanguages.map((lang) => (
                <View
                  key={lang}
                  style={[styles.langChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Text style={[styles.langText, { color: colors.foreground }]}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Real headlines — verbatim from RSS */}
          {trend.sourceHeadlines.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                  वे खबरें जिनसे यह ट्रेंड बना
                </Text>
                <View style={[styles.realBadge, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
                  <Feather name="rss" size={10} color={colors.primary} />
                  <Text style={[styles.realBadgeText, { color: colors.primary }]}>असली</Text>
                </View>
              </View>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                ये RSS फ़ीड से ली गई असली हेडलाइन हैं — AI ने नहीं बनाई
              </Text>
              <View style={{ gap: 8 }}>
                {trend.sourceHeadlines.map((headline, idx) => (
                  <View
                    key={idx}
                    style={[styles.headlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.headlineIndex, { backgroundColor: colors.primary + "14" }]}>
                      <Text style={[styles.headlineIndexText, { color: colors.primary }]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={[styles.headlineText, { color: colors.foreground }]}>
                      {headline}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Related trends — same category, client-side filter */}
          {related.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                इसी श्रेणी के और ट्रेंड
              </Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                एक ही श्रेणी के ट्रेंड — कोई अलग API नहीं, बस फ़िल्टर
              </Text>
              <View style={{ gap: 8 }}>
                {related.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push(`/trend/${r.id}`)}
                    style={({ pressed }) => [
                      styles.relatedRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.relatedRank, { backgroundColor: colors.primary + "12" }]}>
                      <Text style={[styles.relatedRankText, { color: colors.primary }]}>
                        #{r.rank}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.relatedTitle, { color: colors.foreground }]}>
                        {r.titleHi}
                      </Text>
                      <Text style={[styles.relatedTag, { color: colors.mutedForeground }]}>
                        {r.tag}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          onPress={onShare}
          style={({ pressed }) => [
            styles.shareBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="share-2" size={16} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>शेयर करें</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 16 },
  backBtnText: { fontSize: 14, fontWeight: "700" },

  hero: { paddingHorizontal: 16, paddingBottom: 24, overflow: "hidden" },
  heroGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#7B3FC4",
    opacity: 0.5,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroBody: { marginTop: 18, gap: 8 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rankPillText: { color: "#F5D679", fontSize: 11, fontWeight: "800" },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
    lineHeight: 34,
  },
  heroTag: { color: "#F5D679", fontSize: 16, fontWeight: "700" },
  heroDesc: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaText: { color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: "600" },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },

  statsCard: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  statsRow: { flexDirection: "row", alignItems: "flex-start" },
  statBlock: { flex: 1, alignItems: "center" },
  statSep: { width: 1, height: 56, marginTop: 4 },
  statBig: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  statNote: { marginTop: 2 },
  statNoteText: { fontSize: 9, fontWeight: "600" },

  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: { fontSize: 11, lineHeight: 16, flex: 1 },

  momentumBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  momentumText: { fontSize: 12, fontWeight: "700" },

  section: { gap: 8 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLabel: { fontSize: 14, fontWeight: "800" },
  sectionHint: { fontSize: 11, fontWeight: "600", marginTop: -4 },

  realBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  realBadgeText: { fontSize: 10, fontWeight: "800" },

  headlineCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  headlineIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  headlineIndexText: { fontSize: 11, fontWeight: "800" },
  headlineText: { fontSize: 13, lineHeight: 19, flex: 1 },

  langWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  langText: { fontSize: 12, fontWeight: "700" },

  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  relatedRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedRankText: { fontSize: 13, fontWeight: "800" },
  relatedTitle: { fontSize: 14, fontWeight: "700" },
  relatedTag: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    borderTopWidth: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
