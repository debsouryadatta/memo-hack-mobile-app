import { Stack } from "expo-router";

export default function ChangePasswordLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
