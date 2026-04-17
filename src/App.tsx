import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { canAccessPage, type AppRole, type PageRoute } from "@/lib/permissions";
import LoginPage from "./pages/LoginPage";
import BookingPage from "./pages/BookingPage";
import DashboardPage from "./pages/DashboardPage";
import RoomsPage from "./pages/RoomsPage";
import GuestInfoPage from "./pages/GuestInfoPage";
import InventoryPage from "./pages/InventoryPage";
import LaundryPage from "./pages/LaundryPage";
import StaffPage from "./pages/StaffPage";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const queryClient = new QueryClient();

const getAllowedPageForRole = (role: AppRole | null): PageRoute | null => {
  if (!role) return null;

  if (canAccessPage(role, '/')) return '/';
  if (canAccessPage(role, '/dashboard')) return '/dashboard';
  if (canAccessPage(role, '/rooms')) return '/rooms';
  if (canAccessPage(role, '/inventory')) return '/inventory';
  if (canAccessPage(role, '/laundry')) return '/laundry';
  if (canAccessPage(role, '/staff')) return '/staff';
  if (canAccessPage(role, '/guests')) return '/guests';

  return null;
};

const ProtectedRoute = ({ page, element }: { page: PageRoute; element: JSX.Element }) => {
  const { userRole, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!userRole) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!canAccessPage(userRole, page)) {
    const redirectPage = getAllowedPageForRole(userRole);
    if (!redirectPage || redirectPage === location.pathname) {
      return <NotFound />;
    }
    return <Navigate to={redirectPage} replace state={{ from: location }} />;
  }

  return element;
};

const AuthenticatedApp = () => {
  const { isAuthenticated, authLoading } = useApp();

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ProtectedRoute page="/" element={<BookingPage />} />} />
        <Route path="/dashboard" element={<ProtectedRoute page="/dashboard" element={<DashboardPage />} />} />
        <Route path="/guests" element={<ProtectedRoute page="/guests" element={<GuestInfoPage />} />} />
        <Route path="/rooms" element={<ProtectedRoute page="/rooms" element={<RoomsPage />} />} />
        <Route path="/inventory" element={<ProtectedRoute page="/inventory" element={<InventoryPage />} />} />
        <Route path="/laundry" element={<ProtectedRoute page="/laundry" element={<LaundryPage />} />} />
        <Route path="/staff" element={<ProtectedRoute page="/staff" element={<StaffPage />} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
