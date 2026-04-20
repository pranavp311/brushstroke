import { DesignTokens } from "../../utils/design-tokens.js";

export interface TestimonialData {
  quote: string;
  authorName: string;
  authorTitle: string;
  authorCompany?: string;
  avatarUrl?: string;
  rating?: number;
}

export interface TestimonialOptions {
  layout: "single" | "carousel" | "grid" | "masonry";
  animation: "fade" | "slide" | "flip" | "3d_rotate" | "none";
  autoPlay: boolean;
  autoPlayDelay: number;
  showDots: boolean;
  showArrows: boolean;
  cardStyle: "minimal" | "card" | "quote" | "modern";
}

export const DEFAULT_TESTIMONIAL_OPTIONS: TestimonialOptions = {
  layout: "carousel",
  animation: "slide",
  autoPlay: true,
  autoPlayDelay: 5000,
  showDots: true,
  showArrows: true,
  cardStyle: "modern",
};

export function testimonialComponent(
  testimonials: TestimonialData[],
  tokens: DesignTokens,
  options: Partial<TestimonialOptions> = {}
): string {
  const opts = { ...DEFAULT_TESTIMONIAL_OPTIONS, ...options };
  const testimonialId = `testimonial-${Math.random().toString(36).substr(2, 9)}`;

  const testimonialsJson = JSON.stringify(testimonials).replace(/"/g, '&quot;');

  return `
<!-- Testimonials Section -->
<div class="testimonials-container ${opts.layout}" id="${testimonialId}" data-testimonials="${testimonialsJson}" data-options="${JSON.stringify(opts).replace(/"/g, '&quot;')}">
  ${opts.layout === "carousel" ? generateCarouselLayout(testimonials, tokens, opts, testimonialId) : ""}
  ${opts.layout === "grid" ? generateGridLayout(testimonials, tokens, opts) : ""}
  ${opts.layout === "masonry" ? generateMasonryLayout(testimonials, tokens, opts) : ""}
  ${opts.layout === "single" ? generateSingleLayout(testimonials[0], tokens, opts) : ""}
</div>

<style>
.testimonials-container {
  --testimonial-primary: ${tokens.colors.primary};
  --testimonial-surface: ${tokens.colors.surface};
  --testimonial-text: ${tokens.colors.text};
  --testimonial-text-muted: ${tokens.colors.textMuted};
  --testimonial-accent: ${tokens.colors.accent};
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Carousel Styles */
.testimonials-container.carousel {
  position: relative;
}

.testimonial-track {
  display: flex;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 2rem;
}

.testimonial-slide {
  flex: 0 0 100%;
  min-width: 100%;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.testimonial-slide.active {
  opacity: 1;
}

/* Grid Styles */
.testimonials-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

/* Masonry Styles */
.testimonials-container.masonry {
  column-count: 3;
  column-gap: 2rem;
}

@media (max-width: 992px) {
  .testimonials-container.masonry { column-count: 2; }
}

@media (max-width: 576px) {
  .testimonials-container.masonry { column-count: 1; }
  .testimonials-container.grid { grid-template-columns: 1fr; }
}

.testimonial-card {
  break-inside: avoid;
  margin-bottom: 2rem;
}

/* Card Styles */
.testimonial-card {
  background: var(--testimonial-surface);
  border-radius: 1rem;
  padding: 2rem;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
}

/* Modern Card Style */
.testimonial-card.modern {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, var(--testimonial-surface) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.testimonial-card.modern::before {
  content: '"';
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 6rem;
  color: var(--testimonial-primary);
  opacity: 0.2;
  font-family: Georgia, serif;
  line-height: 1;
}

/* Quote Style */
.testimonial-card.quote {
  border-left: 4px solid var(--testimonial-primary);
  border-radius: 0 1rem 1rem 0;
}

/* Minimal Style */
.testimonial-card.minimal {
  background: transparent;
  border: none;
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.testimonial-quote {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--testimonial-text);
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.testimonial-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--testimonial-primary);
}

.testimonial-avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--testimonial-primary), var(--testimonial-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
}

.testimonial-info {
  flex: 1;
}

.testimonial-name {
  font-weight: 600;
  color: var(--testimonial-text);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.testimonial-title {
  color: var(--testimonial-text-muted);
  font-size: 0.875rem;
}

.testimonial-rating {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.star {
  color: #fbbf24;
  font-size: 1.125rem;
}

.star.empty {
  color: rgba(255, 255, 255, 0.2);
}

/* Navigation */
.testimonial-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.testimonial-arrow {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--testimonial-primary);
  background: transparent;
  color: var(--testimonial-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.testimonial-arrow:hover {
  background: var(--testimonial-primary);
  color: white;
  transform: scale(1.05);
}

.testimonial-dots {
  display: flex;
  gap: 0.5rem;
}

.testimonial-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.testimonial-dot.active {
  background: var(--testimonial-primary);
  transform: scale(1.2);
}

/* Animations */
@keyframes testimonialFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes testimonialSlideIn {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes testimonialFlipIn {
  from { opacity: 0; transform: rotateY(90deg); }
  to { opacity: 1; transform: rotateY(0); }
}

.testimonial-card.animate-fade {
  animation: testimonialFadeIn 0.6s ease forwards;
}

.testimonial-card.animate-slide {
  animation: testimonialSlideIn 0.6s ease forwards;
}

.testimonial-card.animate-flip {
  animation: testimonialFlipIn 0.6s ease forwards;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .testimonial-track,
  .testimonial-slide,
  .testimonial-card {
    transition: none;
    animation: none;
  }
}
</style>

<script>
(function() {
  const container = document.getElementById('${testimonialId}');
  if (!container) return;
  
  const testimonials = JSON.parse(container.dataset.testimonials.replace(/&quot;/g, '"'));
  const options = JSON.parse(container.dataset.options.replace(/&quot;/g, '"'));
  
  let currentIndex = 0;
  let autoPlayInterval;
  
  function showSlide(index) {
    const slides = container.querySelectorAll('.testimonial-slide');
    const dots = container.querySelectorAll('.testimonial-dot');
    
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    
    if (options.layout === 'carousel') {
      const track = container.querySelector('.testimonial-track');
      track.style.transform = \`translateX(-\${index * 100}%)\`;
    }
    
    currentIndex = index;
  }
  
  function nextSlide() {
    const next = (currentIndex + 1) % testimonials.length;
    showSlide(next);
  }
  
  function prevSlide() {
    const prev = (currentIndex - 1 + testimonials.length) % testimonials.length;
    showSlide(prev);
  }
  
  function startAutoPlay() {
    if (options.autoPlay && options.layout === 'carousel') {
      autoPlayInterval = setInterval(nextSlide, options.autoPlayDelay);
    }
  }
  
  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }
  
  // Event listeners
  const prevBtn = container.querySelector('.testimonial-arrow.prev');
  const nextBtn = container.querySelector('.testimonial-arrow.next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      stopAutoPlay();
      startAutoPlay();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      stopAutoPlay();
      startAutoPlay();
    });
  }
  
  // Dot navigation
  container.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
      stopAutoPlay();
      startAutoPlay();
    });
  });
  
  // Pause on hover
  container.addEventListener('mouseenter', stopAutoPlay);
  container.addEventListener('mouseleave', startAutoPlay);
  
  // Initialize
  startAutoPlay();
})();
</script>`;
}

function generateCarouselLayout(
  testimonials: TestimonialData[],
  tokens: DesignTokens,
  opts: TestimonialOptions,
  containerId: string
): string {
  const cards = testimonials.map((t, i) => generateTestimonialCard(t, tokens, opts, i === 0)).join("");
  
  return `
<div class="testimonial-carousel">
  <div class="testimonial-track">
    ${testimonials.map((t, i) => `
    <div class="testimonial-slide ${i === 0 ? 'active' : ''}">
      ${generateTestimonialCard(t, tokens, opts, true)}
    </div>`).join("")}
  </div>
  
  ${opts.showArrows ? `
  <div class="testimonial-nav">
    <button class="testimonial-arrow prev" aria-label="Previous testimonial">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    
    ${opts.showDots ? `
    <div class="testimonial-dots">
      ${testimonials.map((_, i) => `
      <button class="testimonial-dot ${i === 0 ? 'active' : ''}" aria-label="Go to testimonial ${i + 1}"></button>
      `).join("")}
    </div>` : ""}
    
    <button class="testimonial-arrow next" aria-label="Next testimonial">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>` : ""}
</div>`;
}

function generateGridLayout(
  testimonials: TestimonialData[],
  tokens: DesignTokens,
  opts: TestimonialOptions
): string {
  return testimonials.map((t, i) => generateTestimonialCard(t, tokens, opts, false, `animate-${opts.animation}`)).join("");
}

function generateMasonryLayout(
  testimonials: TestimonialData[],
  tokens: DesignTokens,
  opts: TestimonialOptions
): string {
  return testimonials.map(t => generateTestimonialCard(t, tokens, opts)).join("");
}

function generateSingleLayout(
  testimonial: TestimonialData,
  tokens: DesignTokens,
  opts: TestimonialOptions
): string {
  return generateTestimonialCard(testimonial, tokens, opts, true);
}

function generateTestimonialCard(
  data: TestimonialData,
  tokens: DesignTokens,
  opts: TestimonialOptions,
  isActive: boolean = false,
  animationClass: string = ""
): string {
  const initials = data.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  
  const ratingStars = data.rating ? `
<div class="testimonial-rating">
  ${Array(5).fill(0).map((_, i) => `
  <span class="star ${i < data.rating! ? '' : 'empty'}">${i < data.rating! ? '★' : '☆'}</span>
  `).join("")}
</div>` : "";
  
  return `
<article class="testimonial-card ${opts.cardStyle} ${animationClass} ${isActive ? 'active' : ''}">
  ${ratingStars}
  <blockquote class="testimonial-quote">
    <p>"${data.quote}"</p>
  </blockquote>
  <div class="testimonial-author">
    ${data.avatarUrl ? `
    <img class="testimonial-avatar" src="${data.avatarUrl}" alt="${data.authorName}" loading="lazy">
    ` : `
    <div class="testimonial-avatar-placeholder">${initials}</div>
    `}
    <div class="testimonial-info">
      <div class="testimonial-name">${data.authorName}</div>
      <div class="testimonial-title">${data.authorTitle}${data.authorCompany ? `, ${data.authorCompany}` : ""}</div>
    </div>
  </div>
</article>`;
}

// Simple wrapper for component generator
export function vanillaTestimonial(tokens: DesignTokens): string {
  return simpleTestimonialComponent(tokens);
}

// Simplified version for basic usage
export function simpleTestimonialComponent(tokens: DesignTokens): string {
  const data: TestimonialData = {
    quote: "{{quote}}",
    authorName: "{{authorName}}",
    authorTitle: "{{authorTitle}}",
    authorCompany: "{{authorCompany}}",
    avatarUrl: "{{avatarUrl}}",
    rating: 5,
  };
  
  return testimonialComponent([data], tokens, { 
    layout: "single", 
    animation: "none",
    autoPlay: false,
    autoPlayDelay: 5000,
    showDots: false,
    showArrows: false,
    cardStyle: "modern",
  });
}
