import { DesignTokens } from "../../utils/design-tokens.js";

export interface StatsCounterOptions {
  items: Array<{
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    decimals?: number;
    duration?: number;
  }>;
  columns?: 2 | 3 | 4;
}

export function statsCounterComponent(options: StatsCounterOptions, tokens: DesignTokens): string {
  const columns = options.columns || 4;
  const items = options.items || [];

  return `
<!-- Stats Counter Section -->
<div class="stats-grid stats-columns-${columns}">
  ${items.map((item, index) => `
  <div class="stat-item" data-index="${index}">
    <div class="stat-value" data-target="${item.value}" data-suffix="${item.suffix || ''}" data-prefix="${item.prefix || ''}" data-decimals="${item.decimals || 0}" data-duration="${item.duration || 2000}">
      <span class="stat-prefix">${item.prefix || ''}</span>
      <span class="stat-number">0</span>
      <span class="stat-suffix">${item.suffix || ''}</span>
    </div>
    <div class="stat-label">${item.label}</div>
  </div>
  `).join('')}
</div>

<style>
  .stats-grid {
    display: grid;
    gap: 2rem;
    margin: 2rem 0;
  }
  .stats-columns-2 { grid-template-columns: repeat(2, 1fr); }
  .stats-columns-3 { grid-template-columns: repeat(3, 1fr); }
  .stats-columns-4 { grid-template-columns: repeat(4, 1fr); }
  
  @media (max-width: 768px) {
    .stats-columns-2,
    .stats-columns-3,
    .stats-columns-4 { grid-template-columns: repeat(2, 1fr); }
  }
  
  @media (max-width: 480px) {
    .stats-columns-2,
    .stats-columns-3,
    .stats-columns-4 { grid-template-columns: 1fr; }
  }
  
  .stat-item {
    text-align: center;
    padding: 1.5rem;
    background: ${tokens.colors.surface};
    border-radius: 1rem;
    border: 1px solid ${tokens.colors.textMuted}22;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .stat-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px -8px rgba(0,0,0,0.12);
  }
  
  .stat-value {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: ${tokens.typography.headingWeight};
    color: ${tokens.colors.primary};
    line-height: 1.2;
    margin-bottom: 0.5rem;
  }
  
  .stat-prefix,
  .stat-suffix {
    font-size: 0.6em;
    opacity: 0.8;
  }
  
  .stat-label {
    font-size: 0.95rem;
    color: ${tokens.colors.textMuted};
    font-weight: ${tokens.typography.bodyWeight};
  }
</style>

<script>
(function() {
  // Easing function for smooth animation
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }
  
  // Animate a single counter
  function animateCounter(element, target, duration, decimals, prefix, suffix) {
    const startTime = performance.now();
    const startValue = 0;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      
      const current = startValue + (target - startValue) * eased;
      const formatted = decimals > 0 
        ? current.toFixed(decimals) 
        : Math.round(current).toLocaleString();
      
      element.querySelector('.stat-number').textContent = formatted;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }
  
  // Intersection Observer to trigger animation when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const valueEl = el.querySelector('.stat-value');
        const target = parseFloat(valueEl.dataset.target);
        const duration = parseInt(valueEl.dataset.duration) || 2000;
        const decimals = parseInt(valueEl.dataset.decimals) || 0;
        const prefix = valueEl.dataset.prefix || '';
        const suffix = valueEl.dataset.suffix || '';
        
        animateCounter(valueEl, target, duration, decimals, prefix, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  
  // Observe all stat items
  document.querySelectorAll('.stat-item').forEach(item => {
    observer.observe(item);
  });
})();
</script>
`;
}

// Also export as a section template for use in page composer
export function generateStatsSection(id: string, options: StatsCounterOptions, tokens: DesignTokens): string {
  return `<section id="${id}" class="page-section stats-section">
  <div class="section-inner">
    ${statsCounterComponent(options, tokens)}
  </div>
</section>`;
}

// Simple wrapper for component generator
export function vanillaStatsCounter(tokens: DesignTokens): string {
  return statsCounterComponent({
    items: [
      { value: 10000, label: "Users", suffix: "+" },
      { value: 99.9, label: "Uptime", suffix: "%", decimals: 1 },
      { value: 24, label: "Support", suffix: "/7" },
      { value: 50, label: "Countries", suffix: "+" },
    ],
    columns: 4,
  }, tokens);
}
