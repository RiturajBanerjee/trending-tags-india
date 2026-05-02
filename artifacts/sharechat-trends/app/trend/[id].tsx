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
  formatCount,
  momentumLabelsHi,
  sourceLabelsHi,
  trends as fallbackTrends,
  type Trend,
} from "@/data/trends";
import { useColors } from "@/hooks/useColors";

export default function TrendDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useGetTrends();
  const allTrends: Trend[] = (data?.trends as Trend[] | undefined) ?? fallbackTrends;

  const trend = useMemo(
    () => allTrends.find((t) => t.id === id),
    [allTrends, id],
  );

  const related = useMemo(
    () =>
      trend
        ? allTrends.filter((t) => t.category === trend.category && t.id !== trend.id).slice(0, 3)
        : [],
    [allTrends, trend],
  );

  const onShare = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const onFollow = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                <Feather name="award" size={12} color="#FFE48A" />
                <Text style={styles.rankPillText}>रैंक #{trend.rank}</Text>
              </View>
              <CategoryChip category={trend.category} labelHi={trend.categoryLabelHi} size="md" />
            </View>
            <Text style={styles.heroTitle}>{trend.titleHi}</Text>
            <Text style={styles.heroTag}>{trend.tag}</Text>
            <Text style={styles.heroDesc}>{trend.descriptionHi}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Feather name="map-pin" size={12} color="#FFE48A" />
                <Text style={styles.heroMetaText}>{trend.region}</Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Feather name="clock" size={12} color="#FFE48A" />
                <Text style={styles.heroMetaText}>{trend.startedHoursAgo} घंटे पहले शुरू</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Stats card */}
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={[styles.statBig, { color: colors.foreground }]}>{trend.heat}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>हीट</Text>
                <View style={{ marginTop: 6 }}><HeatBar heat={trend.heat} width={60} /></View>
              </View>
              <View style={[styles.statSep, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statBig, { color: colors.foreground }]}>{formatCount(trend.postsCount)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>पोस्ट</Text>
              </View>
              <View style={[styles.statSep, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statBig, { color: colors.foreground }]}>{formatCount(trend.viewsCount)}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>व्यू</Text>
              </View>
            </View>
            <View style={[styles.momentumBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather
                name={trend.momentum === "rising" ? "trending-up" : trend.momentum === "peaking" ? "zap" : "trending-down"}
                size={14}
                color={colors.secondaryForeground}
              />
              <Text style={[styles.momentumText, { color: colors.secondaryForeground }]}>
                मोमेंटम: {momentumLabelsHi[trend.momentum]}
              </Text>
            </View>
          </View>

          {/* Signal sources */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>सिग्नल कहाँ से आए</Text>
            <SignalRow sources={trend.sources} />
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              मुख्य स्रोत: {sourceLabelsHi[trend.primarySource]}
            </Text>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>किन भाषाओं में चर्चा</Text>
            <View style={styles.langWrap}>
              {trend.topLanguages.map((lang) => (
                <View key={lang} style={[styles.langChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[styles.langText, { color: colors.foreground }]}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Related posts */}
          {trend.relatedPosts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                इस ट्रेंड पर क्या कह रहे हैं लोग
              </Text>
              <View style={{ gap: 10 }}>
                {trend.relatedPosts.map((post, idx) => (
                  <View key={idx} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.postHeader}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {post.author.slice(0, 1)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.postAuthor, { color: colors.foreground }]}>{post.author}</Text>
                        <Text style={[styles.postHandle, { color: colors.mutedForeground }]}>
                          {post.handle} · {post.language}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.postText, { color: colors.foreground }]}>{post.text}</Text>
                    <View style={styles.postMeta}>
                      <View style={styles.postMetaItem}>
                        <Feather name="heart" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.postMetaText, { color: colors.mutedForeground }]}>{formatCount(post.likes)}</Text>
                      </View>
                      <View style={styles.postMetaItem}>
                        <Feather name="share-2" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.postMetaText, { color: colors.mutedForeground }]}>{formatCount(post.shares)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Related trends */}
          {related.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>इसी श्रेणी के और ट्रेंड</Text>
              <View style={{ gap: 8 }}>
                {related.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push(`/trend/${r.id}`)}
                    style={({ pressed }) => [
                      styles.relatedRow,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={styles.relatedRank}>
                      <Text style={[styles.relatedRankText, { color: colors.primary }]}>#{r.rank}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.relatedTitle, { color: colors.foreground }]}>{r.titleHi}</Text>
                      <Text style={[styles.relatedTag, { color: colors.mutedForeground }]}>{r.tag}</Text>
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
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Pressable
          onPress={onFollow}
          style={({ pressed }) => [styles.followBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Feather name="bell" size={16} color="#FFFFFF" />
          <Text style={styles.followText}>ट्रेंड फ़ॉलो करें</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          style={({ pressed }) => [
            styles.shareBtn,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="share-2" size={18} color={colors.foreground} />
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
    position: "absolute", top: -80, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#FF6F2C", opacity: 0.55,
  },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroBody: { marginTop: 18, gap: 8 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.22)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  rankPillText: { color: "#FFE48A", fontSize: 11, fontWeight: "800" },
  heroTitle: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", marginTop: 6, lineHeight: 36 },
  heroTag: { color: "#FFE48A", fontSize: 16, fontWeight: "700" },
  heroDesc: { color: "rgba(255,255,255,0.95)", fontSize: 14, lineHeight: 20, marginTop: 6 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaText: { color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: "600" },
  heroMetaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.5)" },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 18 },

  statsCard: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statBlock: { flex: 1, alignItems: "center" },
  statSep: { width: 1, height: 40 },
  statBig: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  momentumBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignSelf: "flex-start",
  },
  momentumText: { fontSize: 12, fontWeight: "700" },

  section: { gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: "800" },
  sectionHint: { fontSize: 11, fontWeight: "600", marginTop: -2 },

  langWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  langText: { fontSize: 12, fontWeight: "700" },

  postCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  postAuthor: { fontSize: 13, fontWeight: "700" },
  postHandle: { fontSize: 11, fontWeight: "600" },
  postText: { fontSize: 14, lineHeight: 20 },
  postMeta: { flexDirection: "row", gap: 16 },
  postMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  postMetaText: { fontSize: 12, fontWeight: "600" },

  relatedRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  relatedRank: { width: 36, alignItems: "center" },
  relatedRankText: { fontSize: 14, fontWeight: "800" },
  relatedTitle: { fontSize: 14, fontWeight: "700" },
  relatedTag: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  actionBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", gap: 10, padding: 12, borderTopWidth: 1,
  },
  followBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16,
  },
  followText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  shareBtn: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
});
