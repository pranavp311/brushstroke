/** Example PageSpec objects per theme preset */

export const GALLERY_DARK_PREMIUM = {
  title: "Quantum — Dark Premium",
  themePreset: "dark_premium",
  background: { preset: "particles", quality: "high", interactive: true },
  postProcessing: { bloom: { threshold: 0.6, strength: 1.2, radius: 0.4 } },
  modelSource: {
    type: "generate",
    modelType: "crystal",
    modelOptions: { complexity: 0.8, style: "smooth" },
  },
  sections: [
    {
      id: "hero",
      type: "hero_3d",
      content: {
        heading: "Welcome to the Future",
        subheading: "Experience next-generation design",
        ctaText: "Get Started",
        ctaLink: "#features",
        layout: "centered",
      },
      scrollAnimation: {
        rotation: { y: 1.57 },
        ease: "easeInOutCubic",
      },
    },
    {
      id: "features",
      type: "features",
      content: {
        heading: "Core Features",
        items: [
          { title: "Real-time 3D", description: "WebGL-powered rendering" },
          { title: "Responsive", description: "Adapts to any screen" },
          { title: "Accessible", description: "WCAG AA compliant" },
        ],
        layout: "centered",
      },
    },
    {
      id: "cta",
      type: "cta",
      content: {
        heading: "Ready to Launch?",
        body: "Start building your next project today.",
        ctaText: "Sign Up Free",
        ctaLink: "#",
        layout: "centered",
      },
    },
  ],
};

export const GALLERY_LIGHT_CLEAN = {
  title: "Clarity — Light Clean",
  themePreset: "light_clean",
  background: { preset: "gradient_mesh", quality: "medium" },
  modelSource: {
    type: "generate",
    modelType: "product",
    modelOptions: {
      complexity: 0.6,
      productOptions: { preset: "laptop" },
    },
  },
  sections: [
    {
      id: "hero",
      type: "hero_3d",
      content: {
        heading: "Designed for Professionals",
        subheading: "Clean, modern, and powerful",
        ctaText: "Learn More",
        ctaLink: "#showcase",
        layout: "split",
      },
      scrollAnimation: {
        rotation: { y: 0.8 },
        position: { y: -0.5 },
        ease: "easeOutCubic",
      },
    },
    {
      id: "showcase",
      type: "showcase",
      content: {
        heading: "See It in Action",
        body: "A seamless experience across every device.",
        layout: "centered",
      },
    },
    {
      id: "footer",
      type: "footer",
      content: {
        heading: "Clarity",
        body: "Built with Brushstroke",
      },
    },
  ],
};

export const GALLERY_STARTUP_BOLD = {
  title: "Launchpad — Startup Bold",
  themePreset: "startup_bold",
  background: { preset: "floating_geometry", quality: "high", interactive: true },
  modelSource: {
    type: "generate",
    modelType: "abstract_sculpture",
    modelOptions: { complexity: 0.7, style: "smooth" },
  },
  sections: [
    {
      id: "hero",
      type: "hero_3d",
      content: {
        heading: "Ship Faster. Scale Bigger.",
        subheading: "The platform that grows with you",
        ctaText: "Start Free Trial",
        ctaLink: "#pricing",
        layout: "centered",
      },
      scrollAnimation: {
        rotation: { y: 2.0, x: 0.3 },
        scale: 1.2,
        ease: "easeInOutBack",
      },
    },
    {
      id: "features",
      type: "features",
      content: {
        heading: "Everything You Need",
        items: [
          { title: "Analytics", description: "Real-time insights" },
          { title: "Automation", description: "Set it and forget it" },
          { title: "Integration", description: "Connect your stack" },
          { title: "Security", description: "Enterprise-grade protection" },
        ],
        layout: "centered",
      },
    },
    {
      id: "pricing",
      type: "cta",
      content: {
        heading: "Simple, Transparent Pricing",
        ctaText: "View Plans",
        ctaLink: "#",
        layout: "centered",
      },
    },
  ],
};

export const GALLERY_EDITORIAL = {
  title: "Atelier — Editorial",
  themePreset: "editorial",
  background: { preset: "aurora", quality: "high" },
  modelSource: {
    type: "generate",
    modelType: "architectural",
    modelOptions: { complexity: 0.9, style: "smooth" },
  },
  sections: [
    {
      id: "hero",
      type: "hero_3d",
      content: {
        heading: "Architecture of Tomorrow",
        subheading: "Where form meets function",
        layout: "left",
      },
      scrollAnimation: {
        cameraPath: [
          { x: 5, y: 4, z: 6 },
          { x: 3, y: 2, z: 4 },
          { x: 0, y: 1, z: 3 },
        ],
        cameraLookAt: "model",
        ease: "easeInOutSine",
      },
    },
    {
      id: "specs",
      type: "specs",
      content: {
        heading: "Technical Details",
        items: [
          { title: "Materials", description: "Sustainably sourced" },
          { title: "Dimensions", description: "Optimized for space" },
          { title: "Certifications", description: "LEED Platinum" },
        ],
        layout: "split",
      },
    },
    {
      id: "footer",
      type: "footer",
      content: {
        heading: "Atelier",
        body: "Crafted with care",
      },
    },
  ],
};

export const GALLERY_MINIMAL = {
  title: "Mono — Minimal",
  themePreset: "minimal",
  background: { preset: "wave", quality: "medium" },
  modelSource: { type: "none" },
  sections: [
    {
      id: "hero",
      type: "hero_3d",
      content: {
        heading: "Less is More",
        subheading: "Focus on what matters",
        layout: "centered",
      },
    },
    {
      id: "features",
      type: "features",
      content: {
        heading: "Core Principles",
        items: [
          { title: "Simplicity", description: "No clutter, no noise" },
          { title: "Performance", description: "Lightning fast" },
          { title: "Clarity", description: "Every element serves a purpose" },
        ],
        layout: "centered",
      },
    },
    {
      id: "cta",
      type: "cta",
      content: {
        heading: "Get Started",
        ctaText: "Try Now",
        ctaLink: "#",
        layout: "centered",
      },
    },
  ],
};

export const GALLERIES: Record<string, unknown> = {
  dark_premium: GALLERY_DARK_PREMIUM,
  light_clean: GALLERY_LIGHT_CLEAN,
  startup_bold: GALLERY_STARTUP_BOLD,
  editorial: GALLERY_EDITORIAL,
  minimal: GALLERY_MINIMAL,
};
