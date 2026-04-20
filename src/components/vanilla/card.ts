/** Vanilla HTML card component — no React, no build step */

import { DesignTokens } from "../../utils/design-tokens.js";

export interface CardContent {
  title: string;
  description?: string;
  image?: string;
  link?: string;
  tags?: string[];
}

export function vanillaCardComponent(tokens: DesignTokens, cards?: CardContent[]): string {
  const items = cards ?? [
    { title: "Card Title", description: "Card description goes here." },
  ];

  const cardHtml = items.map((card, i) => `
    <div class="v-card" ${card.link ? "" : ""}>
      ${card.image ? `<div class="v-card-image"><img src="${card.image}" alt="${card.title}" loading="lazy" /></div>` : ""}
      <div class="v-card-body">
        <h3 class="v-card-title">${card.link ? `<a href="${card.link}">${card.title}</a>` : card.title}</h3>
        ${card.description ? `<p class="v-card-desc">${card.description}</p>` : ""}
        ${card.tags?.length ? `<div class="v-card-tags">${card.tags.map(t => `<span class="v-card-tag">${t}</span>`).join("")}</div>` : ""}
      </div>
    </div>`).join("\n");

  return `<div class="v-card-grid">
  ${cardHtml}
</div>
<style>
  .v-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    max-width: 72rem;
    margin: 0 auto;
  }
  .v-card {
    background: ${tokens.colors.surface};
    border-radius: 0.75rem;
    border: 1px solid ${tokens.colors.textMuted}22;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .v-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15);
  }
  .v-card-image {
    aspect-ratio: 16/9;
    overflow: hidden;
  }
  .v-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
  }
  .v-card:hover .v-card-image img { transform: scale(1.05); }
  .v-card-body { padding: 1.5rem; }
  .v-card-title {
    font-family: ${tokens.typography.fontFamily};
    font-weight: ${tokens.typography.headingWeight};
    font-size: 1.125rem;
    color: ${tokens.colors.text};
    margin: 0 0 0.5rem 0;
  }
  .v-card-title a {
    color: inherit;
    text-decoration: none;
  }
  .v-card-desc {
    font-family: ${tokens.typography.fontFamily};
    color: ${tokens.colors.textMuted};
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
  .v-card-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .v-card-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background: ${tokens.colors.primary}18;
    color: ${tokens.colors.primary};
    font-family: ${tokens.typography.fontFamily};
  }
</style>`;
}
