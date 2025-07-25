
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import EmergencySetup from "./pages/EmergencySetup";
import EmergencyAdmin from "./pages/EmergencyAdmin";
import Profile from "./pages/Profile";
import OrganizationManagement from "./pages/OrganizationManagement";
import MarketManagement from "./pages/MarketManagement";
import ChannelManagement from "./pages/ChannelManagement";
import SegmentManagement from "./pages/SegmentManagement";
import OutletManagement from "./pages/OutletManagement";
import UserManagement from "./pages/UserManagement";
import UserApproval from "./pages/UserApproval";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            
            {/* Emergency setup route - bypasses ProtectedRoute */}
            <Route path="/emergency-setup" element={<EmergencySetup />} />
            
            {/* Emergency admin route for super users */}
            <Route
              path="/emergency-admin"
              element={
                <ProtectedRoute requiredRole="super_user">
                  <EmergencyAdmin />
                </ProtectedRoute>
              }
            />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Management routes with role-based access */}
            <Route
              path="/organizations"
              element={
                <ProtectedRoute requiredRole="super_user">
                  <AppLayout>
                    <OrganizationManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/markets"
              element={
                <ProtectedRoute requiredRole="power_user">
                  <AppLayout>
                    <MarketManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/channels"
              element={
                <ProtectedRoute requiredRole="market_admin">
                  <AppLayout>
                    <ChannelManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/segments"
              element={
                <ProtectedRoute requiredRole="market_admin">
                  <AppLayout>
                    <SegmentManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/outlets"
              element={
                <ProtectedRoute requiredRole="market_admin">
                  <AppLayout>
                    <OutletManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="market_admin">
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-approval"
              element={
                <ProtectedRoute requiredRole="market_admin">
                  <AppLayout>
                    <UserApproval />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Special route for pending approval */}
            <Route path="/pending-approval" element={<PendingApproval />} />
            
            {/* Redirect /auth to login */}
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
