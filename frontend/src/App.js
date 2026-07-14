import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SiteLayout from "@/components/site/SiteLayout";
import HomePage from "@/pages/HomePage";
import RepairsPage from "@/pages/RepairsPage";
import PricingPage from "@/pages/PricingPage";
import FAQPage from "@/pages/FAQPage";
import ContactPage from "@/pages/ContactPage";
import LegalPage from "@/pages/LegalPage";
import NotFoundPage from "@/pages/NotFoundPage";
import BookingPage from "@/pages/BookingPage";
import BookingSuccessPage from "@/pages/BookingSuccessPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import AdminRepairMethodsPage from "@/pages/admin/AdminRepairMethodsPage";
import AdminWorkshopPage from "@/pages/admin/AdminWorkshopPage";
import AdminEmailSettingsPage from "@/pages/admin/AdminEmailSettingsPage";
import AdminDevicesPage from "@/pages/admin/AdminDevicesPage";
import AdminContentPage from "@/pages/admin/AdminContentPage";
import AdminSeoPage from "@/pages/admin/AdminSeoPage";
import AdminWarrantiesPage from "@/pages/admin/AdminWarrantiesPage";
import WarrantyPage from "@/pages/WarrantyPage";
import { AuthProvider } from "@/lib/auth";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/repairs" element={<RepairsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/garantie" element={<WarrantyPage />} />
            <Route path="/legal/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/legal/terms" element={<LegalPage kind="terms" />} />
            <Route path="/legal/cookies" element={<LegalPage kind="cookies" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="devices" element={<AdminDevicesPage />} />
            <Route path="repair-methods" element={<AdminRepairMethodsPage />} />
            <Route path="warranties" element={<AdminWarrantiesPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="seo" element={<AdminSeoPage />} />
            <Route path="workshop" element={<AdminWorkshopPage />} />
            <Route path="email" element={<AdminEmailSettingsPage />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
