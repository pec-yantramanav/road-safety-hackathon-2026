import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/state/queryClient";
import { useThemeStore } from "../src/state/themeStore";
import React from "react";

export default function RootLayout() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Slot />
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

