import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0e1512" },
          headerTintColor: "#d6e8dc",
          contentStyle: { backgroundColor: "#0e1512" },
        }}
      />
    </>
  );
}