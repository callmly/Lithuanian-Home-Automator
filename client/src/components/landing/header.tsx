import { Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SiteContent, MenuLink } from "@shared/schema";

interface HeaderProps {
  content?: SiteContent;
}

export function Header({ content }: HeaderProps) {
  const { data: menuLinks = [] } = useQuery<MenuLink[]>({
    queryKey: ["/api/menu-links"],
  });

  const handleNavClick = (link: MenuLink) => {
    if (link.targetType === "section") {
      const element = document.getElementById(link.targetValue);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (link.targetType === "url") {
      window.open(link.targetValue, "_blank");
    }
  };

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            {content?.headingLt || "KNX Smart Home"}
          </span>
        </div>
        
        {menuLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {menuLinks.map((link) => (
              <Button
                key={link.id}
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick(link)}
                data-testid={`menu-link-${link.id}`}
              >
                {link.labelLt}
              </Button>
            ))}
          </nav>
        )}
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={scrollToPlans} data-testid="button-hero-cta">
            {content?.ctaLabelLt || "Pasirinkti planą"}
          </Button>
        </div>
      </div>
    </header>
  );
}
