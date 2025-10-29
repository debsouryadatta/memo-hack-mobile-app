import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AppProvider } from "./ContextProvider";

const EXPO_PUBLIC_CONVEX_URL = "https://quirky-husky-406.convex.cloud";

const convex = new ConvexReactClient(EXPO_PUBLIC_CONVEX_URL, {
    unsavedChangesWarning: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AppProvider>{children}</AppProvider>
    </ConvexProvider>
  );
}
