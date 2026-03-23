import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Menu, X, Zap, Home, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * DashboardLayout - Main application layout with sidebar navigation
 * Design: Minimalistic sidebar with persistent navigation
 * Performance: Lightweight layout with minimal re-renders
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  const serviceItems = [
    { label: "Smart Deal Sourcing", href: "/smart-deal-sourcing" },
    { label: "Due Diligence", href: "/due-diligence" },
  ];

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logout not yet implemented");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <h1 
            className="text-lg font-bold text-sidebar-foreground cursor-pointer hover:opacity-75 transition-opacity"
            onClick={() => setLocation("/")}
          >
            Rypaq
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 text-sidebar-foreground overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-secondary hover:text-sidebar-foreground"
                  onClick={() => {
                    setLocation(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Services Section */}
          <div className="mt-8 pt-4 border-t border-sidebar-border">
            <p className="text-xs font-semibold text-sidebar-foreground/60 px-2 mb-3">PREMIUM SERVICES</p>
            <div className="space-y-1">
              {serviceItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                  onClick={() => {
                    setLocation(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Zap className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-secondary hover:text-sidebar-foreground"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-secondary hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
