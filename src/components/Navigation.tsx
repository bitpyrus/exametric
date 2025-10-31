import { Link, useLocation } from "react-router-dom";
import { BarChart3, Lightbulb, Info, Home, LogOut, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/analyze", label: "Analyze Data", icon: BarChart3 },
    { to: "/exam", label: "Take Exam", icon: FileText },
    { to: "/results", label: "Results", icon: Lightbulb },
    { to: "/insights", label: "Insights", icon: Lightbulb },
    { to: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <BarChart3 className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Examertric
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
          
          <ThemeToggle />

          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
