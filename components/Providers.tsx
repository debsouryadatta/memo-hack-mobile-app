import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AppProvider } from "./ContextProvider";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AppProvider>{children}</AppProvider>
    </ConvexProvider>
  );
}
