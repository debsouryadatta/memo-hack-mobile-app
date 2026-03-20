import { EXPO_PUBLIC_CONVEX_URL } from "@/constants";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { AppProvider, UserProvider, useAuthForConvex } from "./ContextProvider";
import { ErrorBoundary } from "./ErrorBoundary";

const convex = new ConvexReactClient(EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthForConvex}>
        <UserProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </UserProvider>
      </ConvexProviderWithAuth>
    </AppProvider>
  );
}
