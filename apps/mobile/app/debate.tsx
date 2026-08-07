import { Text, View, StyleSheet } from "react-native";

export default function DebateStub() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debate (native)</Text>
      <Text style={styles.body}>
        Phase 2+ native debate room will stream opponent turns from the shared API
        (`/api/debates`) using packages from the monorepo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#0e1512", gap: 10 },
  title: { color: "#d6e8dc", fontSize: 28, fontWeight: "700" },
  body: { color: "#8aa394", fontSize: 16, lineHeight: 22 },
});
