/** HTML/CSS templates for page sections in the composition engine */

import { DesignTokens } from "../utils/design-tokens.js";

export type SectionType = "hero_3d" | "features" | "specs" | "showcase" | "cta" | "footer" | "custom_html" | "code_showcase";

export type SectionLayout = "centered" | "left" | "split" | "full_bleed";

export interface SectionContent {
  heading?: string;
  subheading?: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
  layout?: SectionLayout;
  customHtml?: string;
  codeBlock?: string;
  items?: Array<{
    title: string;
    description?: string;
    icon?: string;
  }>;
}

export function generateSectionHtml(
  id: string,
  type: SectionType,
  content: SectionContent,
  tokens: DesignTokens
): string {
  switch (type) {
    case "hero_3d": return heroSection(id, content, tokens);
    case "features": return featuresSection(id, content, tokens);
    case "specs": return specsSection(id, content, tokens);
    case "showcase": return showcaseSection(id, content, tokens);
    case "cta": return ctaSection(id, content, tokens);
    case "footer": return footerSection(id, content, tokens);
    case "custom_html": return customHtmlSection(id, content, tokens);
    case "code_showcase": return codeShowcaseSection(id, content, tokens);
    default: return genericSection(id, content, tokens);
  }
}

export function generateSectionStyles(tokens: DesignTokens): string {
  const headingFont = tokens.typography.headingFont ?? tokens.typography.fontFamily;
  const bodyFont = tokens.typography.bodyFont ?? tokens.typography.fontFamily;
  const monoFont = tokens.typography.monoFont ?? "'JetBrains Mono', 'Fira Code', monospace";
  const headingLetterSpacing = tokens.typography.headingLetterSpacing ?? "-0.02em";
  const headingSizeScale = tokens.typography.headingSizeScale ?? 1.0;

  // Google Fonts import for non-system fonts
  const fontImports = generateFontImports(headingFont, bodyFont, monoFont);

  return `
    ${fontImports}
    :root {
      --color-primary: ${tokens.colors.primary};
      --color-secondary: ${tokens.colors.secondary};
      --color-accent: ${tokens.colors.accent};
      --color-bg: ${tokens.colors.background};
      --color-surface: ${tokens.colors.surface};
      --color-text: ${tokens.colors.text};
      --color-text-muted: ${tokens.colors.textMuted};
      --font-family: ${tokens.typography.fontFamily};
      --font-heading: ${headingFont};
      --font-body: ${bodyFont};
      --font-mono: ${monoFont};
      --font-weight-heading: ${tokens.typography.headingWeight};
      --font-weight-body: ${tokens.typography.bodyWeight};
      --heading-letter-spacing: ${headingLetterSpacing};
      --heading-size-scale: ${headingSizeScale};
    }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font-body, var(--font-family));
      color: var(--color-text);
      overflow-x: hidden;
    }
    .page-section {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6rem 2rem;
    }
    .section-inner {
      max-width: 72rem;
      width: 100%;
      margin: 0 auto;
    }
    .section-heading {
      font-family: var(--font-heading);
      font-weight: var(--font-weight-heading);
      font-size: clamp(calc(2rem * var(--heading-size-scale)), calc(5vw * var(--heading-size-scale)), calc(3.5rem * var(--heading-size-scale)));
      line-height: 1.1;
      letter-spacing: var(--heading-letter-spacing);
      margin-bottom: 1rem;
    }
    .section-subheading {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      color: var(--color-text-muted);
      line-height: 1.6;
      max-width: 40rem;
      margin-bottom: 2rem;
    }

    /* Scroll reveal */
    .reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Layout variants */
    .layout-left .section-inner { text-align: left; }
    .layout-left .section-subheading { margin-left: 0; margin-right: auto; }
    .layout-split .section-inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    @media (max-width: 768px) {
      .layout-split .section-inner { grid-template-columns: 1fr; }
    }
    .layout-full-bleed { padding: 0; }
    .layout-full-bleed .section-inner { max-width: none; }

    /* Hero section */
    .hero-3d-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: transparent;
    }
    .hero-3d-section .section-heading {
      font-family: var(--font-heading);
      font-size: clamp(calc(3rem * var(--heading-size-scale)), calc(10vw * var(--heading-size-scale)), calc(6rem * var(--heading-size-scale)));
    }
    .hero-3d-section .section-subheading {
      margin-left: auto;
      margin-right: auto;
    }
    .hero-3d-section.layout-left {
      text-align: left;
      justify-content: flex-start;
      padding-left: 5%;
    }
    .hero-3d-section.layout-left .section-subheading {
      margin-left: 0;
    }
    .hero-cta-btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: var(--color-primary);
      color: #fff;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 1.125rem;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-top: 1rem;
    }
    .hero-cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -5px var(--color-primary);
    }

    /* Features grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    .feature-card {
      background: var(--color-surface);
      border-radius: 1rem;
      padding: 2rem;
      border: 1px solid var(--color-text-muted)15;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px -8px rgba(0,0,0,0.12);
    }
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .feature-title {
      font-weight: var(--font-weight-heading);
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .feature-desc {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    /* Specs grid */
    .specs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 3rem;
    }
    .spec-item {
      text-align: center;
      padding: 2rem 1rem;
      background: var(--color-surface);
      border-radius: 0.75rem;
      border: 1px solid var(--color-text-muted)15;
    }
    .spec-value {
      font-family: var(--font-mono);
      font-size: 2.5rem;
      font-weight: var(--font-weight-heading);
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }
    .spec-label {
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    /* Showcase */
    .showcase-section {
      text-align: center;
    }
    .showcase-section .section-subheading {
      margin-left: auto;
      margin-right: auto;
    }

    /* CTA section */
    .cta-section {
      text-align: center;
      background: linear-gradient(135deg, var(--color-primary)12, var(--color-accent)12);
      border-radius: 2rem;
      margin: 0 2rem;
      max-width: 68rem;
    }
    .cta-section .section-subheading {
      margin-left: auto;
      margin-right: auto;
    }

    /* Footer */
    .footer-section {
      min-height: auto;
      padding: 3rem 2rem;
      border-top: 1px solid var(--color-text-muted)22;
    }
    .footer-content {
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }

    /* Code showcase section */
    .code-showcase-section .section-inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    @media (max-width: 768px) {
      .code-showcase-section .section-inner { grid-template-columns: 1fr; }
    }
    .code-block {
      background: #1e1e2e;
      color: #cdd6f4;
      border-radius: 0.75rem;
      padding: 1.5rem;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      line-height: 1.7;
      overflow-x: auto;
      white-space: pre;
      border: 1px solid rgba(255,255,255,0.08);
    }

    /* Custom HTML section */
    .custom-html-section .section-inner {
      width: 100%;
    }
  `;
}

function layoutClass(layout?: SectionLayout): string {
  if (!layout || layout === "centered") return "";
  return ` layout-${layout === "full_bleed" ? "full-bleed" : layout}`;
}

function heroSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section hero-3d-section${layoutClass(content.layout)}">
  <div class="section-inner reveal">
    ${content.heading ? `<h1 class="section-heading">${content.heading}</h1>` : ""}
    ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
    ${content.ctaText ? `<a href="${content.ctaLink ?? "#"}" class="hero-cta-btn">${content.ctaText}</a>` : ""}
  </div>
</section>`;
}

function featuresSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  const items = content.items ?? [];
  return `<section id="${id}" class="page-section">
  <div class="section-inner">
    <div class="reveal">
      ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
      ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
    </div>
    <div class="features-grid">
      ${items.map(item => `
      <div class="feature-card reveal">
        ${item.icon ? `<div class="feature-icon">${item.icon}</div>` : ""}
        <h3 class="feature-title">${item.title}</h3>
        ${item.description ? `<p class="feature-desc">${item.description}</p>` : ""}
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function specsSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  const items = content.items ?? [];
  return `<section id="${id}" class="page-section">
  <div class="section-inner">
    <div class="reveal">
      ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
      ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
    </div>
    <div class="specs-grid">
      ${items.map(item => `
      <div class="spec-item reveal">
        <div class="spec-value">${item.title}</div>
        ${item.description ? `<div class="spec-label">${item.description}</div>` : ""}
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function showcaseSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section showcase-section">
  <div class="section-inner reveal">
    ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
    ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
    ${content.body ? `<p class="section-body">${content.body}</p>` : ""}
  </div>
</section>`;
}

function ctaSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section">
  <div class="section-inner cta-section reveal" style="padding: 4rem 3rem;">
    ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
    ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
    ${content.ctaText ? `<a href="${content.ctaLink ?? "#"}" class="hero-cta-btn">${content.ctaText}</a>` : ""}
  </div>
</section>`;
}

function footerSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="footer-section">
  <div class="footer-content">
    ${content.body ?? "&copy; 2024. All rights reserved."}
  </div>
</section>`;
}

function customHtmlSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section custom-html-section${layoutClass(content.layout)}">
  <div class="section-inner reveal">
    ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
    ${content.customHtml ?? ""}
  </div>
</section>`;
}

function codeShowcaseSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section code-showcase-section">
  <div class="section-inner reveal">
    <div>
      ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
      ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
      ${content.body ? `<p>${content.body}</p>` : ""}
    </div>
    <div>
      <pre class="code-block"><code>${escapeHtml(content.codeBlock ?? "")}</code></pre>
    </div>
  </div>
</section>`;
}

function genericSection(id: string, content: SectionContent, _tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section${layoutClass(content.layout)}">
  <div class="section-inner reveal">
    ${content.heading ? `<h2 class="section-heading">${content.heading}</h2>` : ""}
    ${content.subheading ? `<p class="section-subheading">${content.subheading}</p>` : ""}
    ${content.body ? `<p>${content.body}</p>` : ""}
  </div>
</section>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Extract Google Fonts family names and build @import CSS */
function generateFontImports(headingFont: string, bodyFont: string, monoFont: string): string {
  const googleFonts: string[] = [];
  const knownGoogleFonts = [
    "Space Grotesk", "Inter", "Playfair Display", "Source Serif 4",
    "JetBrains Mono", "Fira Code", "IBM Plex Mono", "Roboto", "Poppins",
    "DM Sans", "DM Serif Display", "Outfit", "Plus Jakarta Sans",
  ];

  for (const fontStr of [headingFont, bodyFont, monoFont]) {
    const match = fontStr.match(/'([^']+)'/);
    if (match && knownGoogleFonts.includes(match[1])) {
      const family = match[1].replace(/ /g, "+");
      if (!googleFonts.includes(family)) {
        googleFonts.push(family);
      }
    }
  }

  if (googleFonts.length === 0) return "";

  const familyParam = googleFonts.map(f => `family=${f}:wght@400;500;600;700`).join("&");
  return `@import url('https://fonts.googleapis.com/css2?${familyParam}&display=swap');`;
}
