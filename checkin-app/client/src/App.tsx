import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AdminAuthProvider } from "@/lib/admin-auth";
import NotFound from "@/pages/not-found";
import EntryPage from "@/pages/entry";
import CheckinPage from "@/pages/checkin";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboardPage from "@/pages/admin-dashboard";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={EntryPage} />
      <Route path="/checkin/:bookingId" component={CheckinPage} />
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={AdminDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </AdminAuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
