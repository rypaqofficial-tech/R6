import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Public pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Dashboard pages
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

// Service pages
import SmartDealSourcing from "./pages/SmartDealSourcing";
import LightningDueDiligence from "./pages/LightningDueDiligence";

/**
 * Main App component
 * Routes between public pages and protected dashboard
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Switch>
            {/* Public routes */}
            <Route path="/" component={Home} />
            
            {/* Dashboard routes */}
            <Route path="/dashboard">
              {() => (
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              )}
            </Route>
            <Route path="/settings">
              {() => (
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              )}
            </Route>

            {/* Service routes */}
            <Route path="/smart-deal-sourcing">
              {() => (
                <DashboardLayout>
                  <SmartDealSourcing />
                </DashboardLayout>
              )}
            </Route>
            <Route path="/sourcing">
              {() => (
                <DashboardLayout>
                  <SmartDealSourcing />
                </DashboardLayout>
              )}
            </Route>
            <Route path="/due-diligence">
              {() => (
                <DashboardLayout>
                  <LightningDueDiligence />
                </DashboardLayout>
              )}
            </Route>

            {/* Fallback */}
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
