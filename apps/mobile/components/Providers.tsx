import { EXPO_PUBLIC_CONVEX_URL } from "@/constants";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { AppDialogHost } from "./AppDialogHost";
import { AppVersionGate } from "./AppVersionGate";
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
          <ErrorBoundary>
            <AppVersionGate />
            {children}
            <AppDialogHost />
          </ErrorBoundary>
        </UserProvider>
      </ConvexProviderWithAuth>
    </AppProvider>
  );
}
