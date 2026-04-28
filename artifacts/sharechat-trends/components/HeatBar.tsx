import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  heat: number;
  width?: number;
};

export function HeatBar({ heat, width = 80 }: Props) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(100, heat));
  const tint =
    pct >= 85 ? colors.hot : pct >= 70 ? colors.warm : colors.cool;

  return (
    <View style={[styles.track, { width, backgroundColor: colors.muted }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: tint },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
