import { lazy, Suspense } from "react";
import { ArrowDown, Shield, Zap, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import type { SiteContent, ParticlesSettings } from "@shared/schema";

const ParticlesBackground = lazy(() => 
  import("./particles-background").then(m => ({ default: m.ParticlesBackground }))
);

interface HeroSectionProps {
  content?: SiteContent;
  particlesSettings?: ParticlesSettings;
}

export function HeroSection({ content, particlesSettings }: HeroSectionProps) {
  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  const isParticlesEnabled = particlesSettings?.enabled ?? false;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/20 py-20 lg:py-32">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      {isParticlesEnabled && (
        <Suspense fallback={null}>
          <ParticlesBackground
            enabled={true}
            color={particlesSettings?.color ?? "#6366f1"}
            quantity={particlesSettings?.quantity ?? 50}
            speed={(particlesSettings?.speed ?? 50) / 100}
            opacity={(particlesSettings?.opacity ?? 30) / 100}
          />
        </Suspense>
      )}
      
      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedSection>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm font-medium backdrop-blur">
              <Shield className="h-4 w-4 text-primary" />
              <span>Sertifikuoti KNX specialistai</span>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {content?.headingLt || (
                <>
                  Išmanus namas su{" "}
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    KNX technologija
                  </span>
                </>
              )}
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground lg:text-xl">
              {content?.bodyLt ||
                "Automatizuokite savo namus su pasauliniu standartu. Valdykite apšvietimą, šildymą, žaliuzes ir kitus prietaisus iš vienos sistemos."}
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" onClick={scrollToPlans} className="gap-2" data-testid="button-get-started">
                {content?.ctaLabelLt || "Pasirinkti planą"}
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                <a href="#features">Sužinoti daugiau</a>
              </Button>
            </div>
          </AnimatedSection>
          
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <AnimatedItem delay={400}>
              <TrustBadge
                icon={<Zap className="h-5 w-5" />}
                title="Greitas montavimas"
                description="Įdiegimas per 1-3 dienas"
              />
            </AnimatedItem>
            <AnimatedItem delay={480}>
              <TrustBadge
                icon={<Shield className="h-5 w-5" />}
                title="5 metų garantija"
                description="Pilna techninė pagalba"
              />
            </AnimatedItem>
            <AnimatedItem delay={560}>
              <TrustBadge
                icon={<Wifi className="h-5 w-5" />}
                title="Nuotolinis valdymas"
                description="Valdykite iš bet kur"
              />
            </AnimatedItem>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}

function TrustBadge({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-background/50 p-6 backdrop-blur transition-colors hover-elevate">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
