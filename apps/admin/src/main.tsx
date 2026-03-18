import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { AuthProvider, TokenProvider, useAuthForConvex } from "@/context/AuthContext";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Layering:
// TokenProvider (no Convex deps) → supplies token to ConvexProviderWithAuth
// ConvexProviderWithAuth         → injects token into Convex auth header
// AuthProvider                   → uses Convex hooks (signin mutation, etc.)
function ConvexWithAuth({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthForConvex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexProviderWithAuth>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TokenProvider>
        <ConvexWithAuth>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </ConvexWithAuth>
      </TokenProvider>
    </BrowserRouter>
  </StrictMode>,
);
