import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Protected from "./components/Protected";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import SmartDealSourcing from "./pages/SmartDealSourcing";
import LightningDueDiligence from "./pages/LightningDueDiligence";
import Pipeline from "./pages/Pipeline";
import Waterfall from "./pages/Waterfall";
import ActivityLog from "./pages/ActivityLog";
import QuarterlyReport from "./pages/QuarterlyReport";
import LpPortal from "./pages/LpPortal";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />

              <Route path="/lp">
                {() => (
                  <Protected lpOnly>
                    <LpPortal />
                  </Protected>
                )}
              </Route>

              <Route path="/dashboard">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/settings">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <Settings />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/smart-deal-sourcing">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <SmartDealSourcing />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/sourcing">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <SmartDealSourcing />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/due-diligence">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <LightningDueDiligence />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/pipeline">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <Pipeline />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/waterfall">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <Waterfall />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/activity">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <ActivityLog />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>
              <Route path="/reports/quarterly">
                {() => (
                  <Protected gpOnly>
                    <DashboardLayout>
                      <QuarterlyReport />
                    </DashboardLayout>
                  </Protected>
                )}
              </Route>

              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
