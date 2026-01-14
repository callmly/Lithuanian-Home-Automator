import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SeoSettings } from "@shared/schema";
import { getAnalyticsConsent } from "./cookie-consent";

export function SeoHead() {
  const { data: seoSettings } = useQuery<SeoSettings>({
    queryKey: ["/api/seo-settings"],
    staleTime: 1000 * 60 * 5,
  });

  const injectedScriptsRef = useRef<Set<string>>(new Set());
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(getAnalyticsConsent());

  const handleConsentUpdate = useCallback(() => {
    setHasAnalyticsConsent(getAnalyticsConsent());
  }, []);

  useEffect(() => {
    window.addEventListener("consentUpdated", handleConsentUpdate);
    return () => {
      window.removeEventListener("consentUpdated", handleConsentUpdate);
    };
  }, [handleConsentUpdate]);

  useEffect(() => {
    if (!seoSettings) return;

    if (seoSettings.metaTitle) {
      document.title = seoSettings.metaTitle;
    }

    updateOrRemoveMetaTag("description", seoSettings.metaDescription);
    updateOrRemoveMetaTag("keywords", seoSettings.metaKeywords);

    updateOrRemoveMetaTag("og:title", seoSettings.ogTitle || seoSettings.metaTitle, "property");
    updateOrRemoveMetaTag("og:description", seoSettings.ogDescription || seoSettings.metaDescription, "property");
    updateOrRemoveMetaTag("og:image", seoSettings.ogImage, "property");

    updateOrRemoveMetaTag("twitter:title", seoSettings.ogTitle || seoSettings.metaTitle, "name");
    updateOrRemoveMetaTag("twitter:description", seoSettings.ogDescription || seoSettings.metaDescription, "name");
    updateOrRemoveMetaTag("twitter:image", seoSettings.ogImage, "name");

    if (hasAnalyticsConsent) {
      if (seoSettings.googleAnalyticsId && !seoSettings.googleAnalyticsScript) {
        if (!injectedScriptsRef.current.has("ga")) {
          injectGoogleAnalytics(seoSettings.googleAnalyticsId);
          injectedScriptsRef.current.add("ga");
        }
      }

      if (seoSettings.googleAnalyticsScript) {
        if (!injectedScriptsRef.current.has("ga-custom")) {
          injectCustomScript("ga-custom", seoSettings.googleAnalyticsScript);
          injectedScriptsRef.current.add("ga-custom");
        }
      }
    }

    if (seoSettings.customHeadCode) {
      if (!injectedScriptsRef.current.has("custom-head")) {
        injectCustomScript("custom-head", seoSettings.customHeadCode);
        injectedScriptsRef.current.add("custom-head");
      }
    }
  }, [seoSettings, hasAnalyticsConsent]);

  return null;
}

function updateOrRemoveMetaTag(
  name: string,
  content: string | null | undefined,
  attr: "name" | "property" = "name"
) {
  const selector = `meta[${attr}="${name}"]`;
  let meta = document.querySelector(selector);

  if (!content) {
    if (meta && meta.hasAttribute("data-dynamic")) {
      meta.remove();
    }
    return;
  }

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    meta.setAttribute("data-dynamic", "true");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function injectGoogleAnalytics(gaId: string) {
  if (document.getElementById("ga-gtag")) return;

  const script = document.createElement("script");
  script.id = "ga-gtag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const inlineScript = document.createElement("script");
  inlineScript.id = "ga-gtag-inline";
  inlineScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(inlineScript);
}

function injectCustomScript(id: string, code: string) {
  if (document.getElementById(id)) return;

  const container = document.createElement("div");
  container.id = id;
  container.innerHTML = code;

  const scripts = container.querySelectorAll("script");
  scripts.forEach((script) => {
    const newScript = document.createElement("script");
    if (script.src) {
      newScript.src = script.src;
      newScript.async = script.async;
    } else {
      newScript.textContent = script.textContent;
    }
    document.head.appendChild(newScript);
  });

  const nonScripts = container.querySelectorAll(":not(script)");
  nonScripts.forEach((el) => {
    if (el.nodeName === "META" || el.nodeName === "LINK") {
      document.head.appendChild(el.cloneNode(true));
    }
  });
}
