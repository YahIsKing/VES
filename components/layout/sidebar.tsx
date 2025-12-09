"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  Users,
  Mail,
  BookOpen,
  Crown,
  ArrowLeftRight,
  Building2,
  Wheat,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// POLOE Platform Apps
const CURRENT_APP = "VES";

const POLOE_APPS = [
  { name: "BOOK", href: "https://poloe.net", icon: BookOpen },
  { name: "KEYS", href: "https://keys.poloe.net", icon: Crown },
  { name: "VES", href: "https://ves.poloe.net", icon: ArrowLeftRight },
  { name: "DOTBOC", href: "https://dotboc.poloe.net", icon: Building2 },
  { name: "DEGANIA", href: "https://degania.poloe.net", icon: Wheat },
];

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Acquisitions", href: "/acquisitions", icon: Target },
  { name: "Members", href: "/members", icon: Users },
  { name: "Invites", href: "/invites", icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();

  // Get current app info
  const currentApp = POLOE_APPS.find((app) => app.name === CURRENT_APP) || POLOE_APPS[2];
  const CurrentIcon = currentApp.icon;

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo / App Switcher */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-4">
          {/* POLOE Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">POLOE</span>
          </Link>

          {/* App Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <CurrentIcon className="h-4 w-4" />
                <span className="font-medium">{currentApp.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {POLOE_APPS.map((app) => {
                const Icon = app.icon;
                const isCurrent = app.name === CURRENT_APP;
                return (
                  <DropdownMenuItem key={app.name} asChild>
                    <Link
                      href={app.href}
                      className={`flex items-center gap-3 ${isCurrent ? "bg-muted" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{app.name}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
