import { DesignTokens } from "../../utils/design-tokens.js";

export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingTier {
  name: string;
  description?: string;
  price: { monthly: number; yearly: number };
  currency?: string;
  features: PricingFeature[];
  popular?: boolean;
  badge?: string;
  cta: { text: string; url: string };
  highlighted?: boolean;
}

export interface PricingOptions {
  layout: "horizontal" | "vertical" | "comparison";
  toggleEnabled: boolean;
  animation: "fade" | "slide" | "scale" | "none";
  showFeatureCheckmarks: boolean;
  featureTooltips: boolean;
  stickyHeader: boolean;
}

export const DEFAULT_PRICING_OPTIONS: PricingOptions = {
  layout: "horizontal",
  toggleEnabled: true,
  animation: "scale",
  showFeatureCheckmarks: true,
  featureTooltips: false,
  stickyHeader: false,
};

export function pricingTableComponent(
  tiers: PricingTier[],
  tokens: DesignTokens,
  options: Partial<PricingOptions> = {}
): string {
  const opts = { ...DEFAULT_PRICING_OPTIONS, ...options };
  const pricingId = `pricing-${Math.random().toString(36).substr(2, 9)}`;

  const tiersJson = JSON.stringify(tiers).replace(/"/g, '&quot;');

  return `
<!-- Pricing Table Section -->
<div class="pricing-container ${opts.layout}" id="${pricingId}" data-tiers="${tiersJson}" data-options="${JSON.stringify(opts).replace(/"/g, '&quot;')}">
  
  ${opts.toggleEnabled ? `
  <div class="pricing-toggle-wrapper">
    <span class="pricing-toggle-label active" data-period="monthly">Monthly</span>
    <button class="pricing-toggle" aria-label="Toggle pricing period">
      <span class="pricing-toggle-slider"></span>
    </button>
    <span class="pricing-toggle-label" data-period="yearly">Yearly <span class="pricing-save-badge">Save 20%</span></span>
  </div>
  ` : ""}
  
  <div class="pricing-grid">
    ${tiers.map((tier, i) => generatePricingCard(tier, tokens, opts, i)).join("")}
  </div>
  
</div>

<style>
.pricing-container {
  --pricing-primary: ${tokens.colors.primary};
  --pricing-secondary: ${tokens.colors.secondary};
  --pricing-accent: ${tokens.colors.accent};
  --pricing-surface: ${tokens.colors.surface};
  --pricing-background: ${tokens.colors.background};
  --pricing-text: ${tokens.colors.text};
  --pricing-text-muted: ${tokens.colors.textMuted};
  
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem;
}

/* Toggle Styles */
.pricing-toggle-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.pricing-toggle-label {
  font-size: 1rem;
  color: var(--pricing-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pricing-toggle-label.active {
  color: var(--pricing-text);
  font-weight: 600;
}

.pricing-toggle {
  width: 56px;
  height: 28px;
  background: var(--pricing-surface);
  border: 2px solid var(--pricing-primary);
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
}

.pricing-toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--pricing-primary);
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pricing-toggle.yearly .pricing-toggle-slider {
  transform: translateX(28px);
}

.pricing-save-badge {
  background: linear-gradient(135deg, var(--pricing-primary), var(--pricing-accent));
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
}

/* Grid Layout */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  align-items: start;
}

.pricing-container.comparison .pricing-grid {
  display: block;
}

/* Pricing Card */
.pricing-card {
  background: var(--pricing-surface);
  border-radius: 1.5rem;
  padding: 2.5rem;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.pricing-card.popular {
  border-color: var(--pricing-primary);
  transform: scale(1.05);
}

.pricing-card.popular:hover {
  transform: scale(1.05) translateY(-8px);
}

@media (max-width: 768px) {
  .pricing-card.popular {
    transform: none;
  }
  .pricing-card.popular:hover {
    transform: translateY(-8px);
  }
}

/* Popular Badge */
.pricing-popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--pricing-primary), var(--pricing-accent));
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Header */
.pricing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.pricing-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--pricing-text);
  margin-bottom: 0.5rem;
}

.pricing-description {
  font-size: 0.875rem;
  color: var(--pricing-text-muted);
}

/* Price */
.pricing-price {
  text-align: center;
  margin-bottom: 2rem;
}

.pricing-currency {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--pricing-text);
  vertical-align: top;
}

.pricing-amount {
  font-size: 4rem;
  font-weight: 800;
  color: var(--pricing-text);
  line-height: 1;
  letter-spacing: -0.02em;
}

.pricing-period {
  font-size: 1rem;
  color: var(--pricing-text-muted);
}

.pricing-price-yearly {
  display: none;
}

.pricing-container.yearly .pricing-price-monthly {
  display: none;
}

.pricing-container.yearly .pricing-price-yearly {
  display: block;
}

/* Features */
.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.pricing-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--pricing-text);
  font-size: 0.9375rem;
}

.pricing-feature:last-child {
  border-bottom: none;
}

.pricing-feature:not(.included) {
  color: var(--pricing-text-muted);
  text-decoration: line-through;
  opacity: 0.6;
}

.pricing-feature-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.pricing-feature.included .pricing-feature-icon {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.pricing-feature:not(.included) .pricing-feature-icon {
  background: rgba(255, 255, 255, 0.1);
  color: var(--pricing-text-muted);
}

/* CTA Button */
.pricing-cta {
  display: block;
  width: 100%;
  padding: 1rem 2rem;
  background: var(--pricing-primary);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.pricing-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px var(--pricing-primary);
  filter: brightness(1.1);
}

.pricing-card.popular .pricing-cta {
  background: linear-gradient(135deg, var(--pricing-primary), var(--pricing-accent));
}

/* Comparison Table */
.pricing-comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 2rem;
}

.pricing-comparison-table th,
.pricing-comparison-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pricing-comparison-table th {
  font-weight: 600;
  color: var(--pricing-text);
  background: var(--pricing-surface);
  position: sticky;
  top: 0;
}

.pricing-comparison-table td {
  color: var(--pricing-text-muted);
}

.pricing-comparison-table .feature-name {
  color: var(--pricing-text);
  font-weight: 500;
}

.pricing-comparison-table .check {
  color: #4ade80;
  font-size: 1.25rem;
}

.pricing-comparison-table .cross {
  color: var(--pricing-text-muted);
  opacity: 0.5;
}

/* Animations */
@keyframes pricingFadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pricingScaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pricingSlideIn {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

.pricing-card {
  animation: pricingScaleIn 0.5s ease forwards;
  animation-delay: calc(var(--card-index, 0) * 0.1s);
  opacity: 0;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pricing-card,
  .pricing-toggle-slider,
  .pricing-cta,
  .pricing-card:hover {
    transition: none;
    animation: none;
    transform: none;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .pricing-amount {
    font-size: 3rem;
  }
}
</style>

<script>
(function() {
  const container = document.getElementById('${pricingId}');
  if (!container) return;
  
  const toggle = container.querySelector('.pricing-toggle');
  const toggleLabels = container.querySelectorAll('.pricing-toggle-label');
  
  if (toggle) {
    toggle.addEventListener('click', () => {
      const isYearly = container.classList.toggle('yearly');
      toggle.classList.toggle('yearly', isYearly);
      
      toggleLabels.forEach(label => {
        label.classList.toggle('active', label.dataset.period === (isYearly ? 'yearly' : 'monthly'));
      });
    });
    
    // Label clicks
    toggleLabels.forEach(label => {
      label.addEventListener('click', () => {
        const period = label.dataset.period;
        const isYearly = period === 'yearly';
        container.classList.toggle('yearly', isYearly);
        toggle.classList.toggle('yearly', isYearly);
        
        toggleLabels.forEach(l => {
          l.classList.toggle('active', l.dataset.period === period);
        });
      });
    });
  }
  
  // Animate cards on scroll
  const cards = container.querySelectorAll('.pricing-card');
  cards.forEach((card, i) => {
    card.style.setProperty('--card-index', i);
  });
})();
</script>`;
}

function generatePricingCard(
  tier: PricingTier,
  tokens: DesignTokens,
  opts: PricingOptions,
  index: number
): string {
  const currency = tier.currency || "$";
  
  const features = tier.features.map(f => `
<li class="pricing-feature ${f.included ? 'included' : ''}">
  <span class="pricing-feature-icon">${f.included ? '✓' : '−'}</span>
  <span>${f.text}</span>
  ${f.tooltip && opts.featureTooltips ? `<span class="pricing-feature-tooltip" title="${f.tooltip}">ⓘ</span>` : ""}
</li>
`).join("");

  return `
<article class="pricing-card ${tier.popular ? 'popular' : ''} ${tier.highlighted ? 'highlighted' : ''}" style="--card-index: ${index}">
  ${tier.popular ? `<span class="pricing-popular-badge">${tier.badge || 'Most Popular'}</span>` : ""}
  
  <div class="pricing-header">
    <h3 class="pricing-name">${tier.name}</h3>
    ${tier.description ? `<p class="pricing-description">${tier.description}</p>` : ""}
  </div>
  
  <div class="pricing-price">
    <div class="pricing-price-monthly">
      <span class="pricing-currency">${currency}</span>
      <span class="pricing-amount">${tier.price.monthly}</span>
      <span class="pricing-period">/month</span>
    </div>
    <div class="pricing-price-yearly">
      <span class="pricing-currency">${currency}</span>
      <span class="pricing-amount">${tier.price.yearly}</span>
      <span class="pricing-period">/year</span>
    </div>
  </div>
  
  <ul class="pricing-features">
    ${features}
  </ul>
  
  <a href="${tier.cta.url}" class="pricing-cta">${tier.cta.text}</a>
</article>`;
}

// Simplified version for basic usage
export function simplePricingComponent(tokens: DesignTokens): string {
  const tiers: PricingTier[] = [
    {
      name: "Starter",
      price: { monthly: 9, yearly: 90 },
      features: [
        { text: "5 projects", included: true },
        { text: "10GB storage", included: true },
        { text: "Basic analytics", included: true },
        { text: "Priority support", included: false },
        { text: "Custom domain", included: false },
      ],
      cta: { text: "Get Started", url: "#" },
    },
    {
      name: "Pro",
      price: { monthly: 29, yearly: 290 },
      popular: true,
      badge: "Most Popular",
      features: [
        { text: "Unlimited projects", included: true },
        { text: "100GB storage", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority support", included: true },
        { text: "Custom domain", included: false },
      ],
      cta: { text: "Start Free Trial", url: "#" },
    },
    {
      name: "Enterprise",
      price: { monthly: 99, yearly: 990 },
      features: [
        { text: "Unlimited everything", included: true },
        { text: "Unlimited storage", included: true },
        { text: "Custom analytics", included: true },
        { text: "24/7 dedicated support", included: true },
        { text: "Custom domain + SSL", included: true },
      ],
      cta: { text: "Contact Sales", url: "#" },
    },
  ];
  
  return pricingTableComponent(tiers, tokens);
}

// Alias for component generator
export { simplePricingComponent as vanillaPricing };
