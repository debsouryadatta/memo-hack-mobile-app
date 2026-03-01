import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import ManageChaptersPage from "@/pages/ManageChaptersPage";
import ManageUsersPage from "@/pages/ManageUsersPage";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="chapters" replace />} />
          <Route path="chapters" element={<ManageChaptersPage />} />
          <Route path="users" element={<ManageUsersPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
