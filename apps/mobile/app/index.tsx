import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>ArguMentor</Text>
      <Text style={styles.lede}>Train against an elite debate mind.</Text>
      <Text style={styles.note}>
        Expo shell shares `@argumentor/debate-core` with the web monorepo and will call the
        Next.js debate API. Use the web app for the full Phase 1 experience.
      </Text>
      <Link href="/debate" style={styles.link}>
        Debate stub
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0e1512",
  },
  brand: {
    fontSize: 40,
    fontWeight: "700",
    color: "#d6e8dc",
    letterSpacing: -1,
  },
  lede: {
    fontSize: 18,
    color: "#8aa394",
    marginBottom: 12,
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
    color: "#d6e8dc",
  },
  link: {
    marginTop: 16,
    color: "#3ecf8e",
    fontSize: 16,
    fontWeight: "600",
  },
});
