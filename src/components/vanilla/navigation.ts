/** Vanilla HTML navigation — no React, no build step */

import { DesignTokens } from "../../utils/design-tokens.js";

export function vanillaNavigationComponent(tokens: DesignTokens, content?: {
  brand?: string;
  links?: Array<{ label: string; href: string }>;
}): string {
  const brand = content?.brand ?? "Brand";
  const links = content?.links ?? [
    { label: "Home", href: "#" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  const linkItems = links.map(l => `<li><a href="${l.href}" class="nav-link">${l.label}</a></li>`).join("\n        ");

  return `<nav class="site-nav" role="navigation" aria-label="Main navigation">
  <a href="/" class="nav-brand">${brand}</a>
  <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
  <ul class="nav-links" role="menubar">
    ${linkItems}
  </ul>
</nav>
<style>
  .site-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: transparent;
    transition: background 0.3s, box-shadow 0.3s;
    font-family: ${tokens.typography.fontFamily};
  }
  .site-nav.scrolled {
    background: ${tokens.colors.surface}ee;
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .nav-brand {
    font-size: 1.25rem;
    font-weight: ${tokens.typography.headingWeight};
    color: ${tokens.colors.text};
    text-decoration: none;
  }
  .nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
    margin: 0;
    padding: 0;
    align-items: center;
  }
  .nav-link {
    color: ${tokens.colors.textMuted};
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.2s;
  }
  .nav-link:hover { color: ${tokens.colors.text}; }
  .nav-toggle {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .nav-toggle span {
    display: block;
    width: 24px;
    height: 2px;
    background: ${tokens.colors.text};
    transition: transform 0.3s;
  }
  @media (max-width: 768px) {
    .nav-toggle { display: flex; }
    .nav-links {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      flex-direction: column;
      background: ${tokens.colors.surface}f5;
      backdrop-filter: blur(12px);
      padding: 1rem;
      gap: 0.5rem;
    }
    .nav-links.open { display: flex; }
    .nav-link { padding: 0.75rem 1rem; display: block; }
  }
</style>
<script>
  (() => {
    const nav = document.querySelector('.site-nav');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  })();
</script>`;
}
