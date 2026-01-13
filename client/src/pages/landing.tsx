import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { PlansSection } from "@/components/landing/plans-section";
import { FeatureComparison } from "@/components/landing/feature-comparison";
import { ContentBlocksSection } from "@/components/landing/content-blocks";
import { Footer } from "@/components/landing/footer";
import { LeadModal } from "@/components/landing/lead-modal";
import { ScrollToTop } from "@/components/landing/scroll-to-top";
import { SeoHead } from "@/components/seo-head";
import type { Plan, OptionGroup, Option, FeatureGroup, Feature, PlanFeature, SiteContent, PlanOptionGroup, ParticlesSettings } from "@shared/schema";

export type OptionWithGroup = Option & { group: OptionGroup };
export type FeatureWithGroup = Feature & { group: FeatureGroup };

export type PlanConfig = {
  planId: number;
  selectedOptions: { optionId: number; quantity: number }[];
};

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planConfig, setPlanConfig] = useState<PlanConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const { data: optionsData, isLoading: optionsLoading } = useQuery<{
    groups: OptionGroup[];
    options: Option[];
    planOptionGroups: PlanOptionGroup[];
  }>({
    queryKey: ["/api/options"],
  });

  const { data: featuresData, isLoading: featuresLoading } = useQuery<{
    groups: FeatureGroup[];
    features: Feature[];
    planFeatures: PlanFeature[];
  }>({
    queryKey: ["/api/features"],
  });

  const { data: siteContent = [] } = useQuery<SiteContent[]>({
    queryKey: ["/api/site-content"],
  });

  const { data: particlesSettings } = useQuery<ParticlesSettings>({
    queryKey: ["/api/particles-settings"],
  });

  const getContent = (key: string) => {
    return siteContent.find((c) => c.key === key);
  };

  const handleGetQuote = (plan: Plan, config: PlanConfig) => {
    setSelectedPlan(plan);
    setPlanConfig(config);
    setIsModalOpen(true);
  };

  const isLoading = plansLoading || optionsLoading || featuresLoading;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead />
      <Header content={getContent("header")} />
      
      <main>
        <HeroSection content={getContent("hero")} particlesSettings={particlesSettings} />
        
        <PlansSection
          plans={plans}
          optionGroups={optionsData?.groups || []}
          options={optionsData?.options || []}
          planOptionGroups={optionsData?.planOptionGroups || []}
          isLoading={isLoading}
          onGetQuote={handleGetQuote}
        />
        
        <FeatureComparison
          plans={plans}
          featureGroups={featuresData?.groups || []}
          features={featuresData?.features || []}
          planFeatures={featuresData?.planFeatures || []}
          isLoading={isLoading}
        />
        
        <ContentBlocksSection />
      </main>
      
      <Footer content={getContent("footer")} contactContent={getContent("contact")} />
      
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
        config={planConfig}
        options={optionsData?.options || []}
        optionGroups={optionsData?.groups || []}
        thankYouContent={getContent("thankYou")}
      />
      
      <ScrollToTop />
    </div>
  );
}
