
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./components/SettingsPage";
import WorkspaceInvite from "./pages/WorkspaceInvite";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/callbackauth" element={<AuthCallback />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/exchange" element={<Dashboard />} />
                  <Route path="/dashboard/exchange/item/:id" element={<Dashboard />} />
                  <Route path="/dashboard/exchange/publish" element={<Dashboard />} />
                  <Route path="/dashboard/munit" element={<Dashboard />} />
                  <Route path="/dashboard/sample-data" element={<Dashboard />} />
                  <Route path="/dashboard/document" element={<Dashboard />} />
                  <Route path="/dashboard/diagram" element={<Dashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Workspace invite routes */}
                  <Route path="/workspace/:workspaceId" element={<WorkspaceInvite />} />
                  <Route path="/invite/:workspaceId" element={<WorkspaceInvite />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
