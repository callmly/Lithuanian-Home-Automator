import { useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Package,
  Settings2,
  Grid3x3,
  FileText,
  Users,
  LogOut,
  ChevronRight,
  Home,
  Blocks,
  Menu,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import AdminDashboard from "./dashboard";
import AdminPlans from "./plans";
import AdminOptions from "./options";
import AdminFeatures from "./features";
import AdminContent from "./content";
import AdminContentBlocks from "./content-blocks";
import AdminMenuLinks from "./menu-links";
import AdminLeads from "./leads";
import AdminSeo from "./seo";
import AdminParticles from "./particles";

const menuItems = [
  { title: "Valdymo pultas", icon: LayoutDashboard, path: "/admin" },
  { title: "Planai", icon: Package, path: "/admin/plans" },
  { title: "Opcijos", icon: Settings2, path: "/admin/options" },
  { title: "Funkcijų lentelė", icon: Grid3x3, path: "/admin/features" },
  { title: "Svetainės turinys", icon: FileText, path: "/admin/content" },
  { title: "Turinio blokai", icon: Blocks, path: "/admin/content-blocks" },
  { title: "Meniu nuorodos", icon: Menu, path: "/admin/menu-links" },
  { title: "SEO nustatymai", icon: Search, path: "/admin/seo" },
  { title: "Dalelės", icon: Grid3x3, path: "/admin/particles" },
  { title: "Užklausos", icon: Users, path: "/admin/leads" },
];

export default function AdminLayout() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Home className="h-4 w-4" />
              </div>
              <span className="font-semibold">KNX Admin</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigacija</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive =
                      item.path === "/admin"
                        ? location === "/admin"
                        : location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          data-testid={`nav-${item.path.split("/").pop()}`}
                        >
                          <Link href={item.path}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || ""} />
                <AvatarFallback>
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <div className="truncate text-sm font-medium">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ""}`
                    : user?.email}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Breadcrumb location={location} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/" target="_blank">
                  Peržiūrėti svetainę
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/plans" component={AdminPlans} />
              <Route path="/admin/options" component={AdminOptions} />
              <Route path="/admin/features" component={AdminFeatures} />
              <Route path="/admin/content" component={AdminContent} />
              <Route path="/admin/content-blocks" component={AdminContentBlocks} />
              <Route path="/admin/menu-links" component={AdminMenuLinks} />
              <Route path="/admin/seo" component={AdminSeo} />
              <Route path="/admin/particles" component={AdminParticles} />
              <Route path="/admin/leads" component={AdminLeads} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Breadcrumb({ location }: { location: string }) {
  const parts = location.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    admin: "Valdymo pultas",
    plans: "Planai",
    options: "Opcijos",
    features: "Funkcijų lentelė",
    content: "Svetainės turinys",
    "content-blocks": "Turinio blokai",
    "menu-links": "Meniu nuorodos",
    seo: "SEO nustatymai",
    particles: "Dalelės",
    leads: "Užklausos",
  };

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {parts.map((part, idx) => (
        <span key={part} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="h-4 w-4" />}
          <span className={idx === parts.length - 1 ? "text-foreground" : ""}>
            {labels[part] || part}
          </span>
        </span>
      ))}
    </nav>
  );
}
