/** Vanilla HTML hero section — no React, no build step */

import { DesignTokens } from "../../utils/design-tokens.js";

export function vanillaHeroComponent(tokens: DesignTokens, content?: {
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
}): string {
  const heading = content?.heading ?? "Welcome";
  const subheading = content?.subheading ?? "";
  const ctaText = content?.ctaText ?? "Get Started";
  const ctaLink = content?.ctaLink ?? "#";

  return `<section class="hero-section" role="banner" aria-label="Hero section">
  <div class="hero-content">
    <h1 class="hero-title">${heading}</h1>
    ${subheading ? `<p class="hero-subtitle">${subheading}</p>` : ""}
    <a href="${ctaLink}" class="hero-cta">${ctaText}</a>
  </div>
</section>
<style>
  .hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    z-index: 1;
    background: transparent;
  }
  .hero-content {
    text-align: center;
    max-width: 56rem;
    margin: 0 auto;
    animation: heroFadeIn 1s ease forwards;
    opacity: 0;
    transform: translateY(30px);
  }
  @keyframes heroFadeIn {
    to { opacity: 1; transform: translateY(0); }
  }
  .hero-title {
    font-family: ${tokens.typography.fontFamily};
    font-weight: ${tokens.typography.headingWeight};
    font-size: clamp(2.5rem, 8vw, 5rem);
    color: ${tokens.colors.text};
    margin-bottom: 1.5rem;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .hero-subtitle {
    font-family: ${tokens.typography.fontFamily};
    font-weight: ${tokens.typography.bodyWeight};
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    color: ${tokens.colors.textMuted};
    margin-bottom: 2.5rem;
    line-height: 1.6;
    max-width: 36rem;
    margin-left: auto;
    margin-right: auto;
  }
  .hero-cta {
    display: inline-block;
    padding: 1rem 2.5rem;
    background: ${tokens.colors.primary};
    color: #fff;
    border-radius: 0.5rem;
    font-family: ${tokens.typography.fontFamily};
    font-weight: 600;
    font-size: 1.125rem;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .hero-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px ${tokens.colors.primary}66;
  }
</style>`;
}
