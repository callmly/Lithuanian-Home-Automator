import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type ConsentType = "granted" | "denied" | null;

interface ConsentState {
  analytics: ConsentType;
  marketing: ConsentType;
}

const CONSENT_KEY = "cookie_consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function getStoredConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setStoredConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

function initConsentMode(analytics: ConsentType, marketing: ConsentType) {
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    analytics_storage: analytics || "denied",
    ad_storage: marketing || "denied",
    ad_user_data: marketing || "denied",
    ad_personalization: marketing || "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

function updateConsent(analytics: ConsentType, marketing: ConsentType) {
  if (window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: analytics || "denied",
      ad_storage: marketing || "denied",
      ad_user_data: marketing || "denied",
      ad_personalization: marketing || "denied",
    });
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    
    if (stored) {
      initConsentMode(stored.analytics, stored.marketing);
    } else {
      initConsentMode("denied", "denied");
      setShowBanner(true);
    }
    
    setInitialized(true);
  }, []);

  const handleAcceptAll = () => {
    const consent: ConsentState = {
      analytics: "granted",
      marketing: "granted",
    };
    setStoredConsent(consent);
    updateConsent("granted", "granted");
    setShowBanner(false);
    
    window.dispatchEvent(new CustomEvent("consentUpdated", { detail: consent }));
  };

  const handleRejectOptional = () => {
    const consent: ConsentState = {
      analytics: "denied",
      marketing: "denied",
    };
    setStoredConsent(consent);
    updateConsent("denied", "denied");
    setShowBanner(false);
  };

  if (!initialized || !showBanner) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-sm border-t shadow-lg"
      data-testid="cookie-consent-bar"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground text-center sm:text-left">
          Naudojame slapukus svetainės veikimui ir analizei.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRejectOptional}
            data-testid="button-cookies-necessary"
          >
            Tik būtini
          </Button>
          <Button
            size="sm"
            onClick={handleAcceptAll}
            data-testid="button-cookies-accept"
          >
            Sutinku
          </Button>
        </div>
      </div>
    </div>
  );
}

export function getAnalyticsConsent(): boolean {
  const stored = getStoredConsent();
  return stored?.analytics === "granted";
}
