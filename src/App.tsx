
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Bookings from "./pages/Bookings";
import CreateBooking from "./pages/CreateBooking";
import DesignSystem from "./pages/DesignSystem";
import NotFound from "./pages/NotFound";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/create" element={<CreateBooking />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<NotFound />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/design" element={<DesignSystem />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
