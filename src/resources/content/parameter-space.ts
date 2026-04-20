export const PARAMETER_SPACE_DOCS = `## Brushstroke Parameter Space

### Theme Presets
- "dark_premium": Dark backgrounds (#0B0F1A), light text (#F1F5F9), cyan accent (#22D3EE)
- "light_clean": Warm white background (#F5F0EB), dark text (#1E293B), teal accent (#0891B2)
- "minimal": Neutral grays, restrained palette, generous whitespace
- "startup_bold": Bold SaaS aesthetic, Space Grotesk 700, orange accent (#F97316)
- "editorial": Magazine feel, Playfair Display 700, red accent (#E94560)

### Design Tokens (overridable per-theme)
- colors.primary: Primary brand color (hex)
- colors.secondary: Secondary color (hex)
- colors.accent: Accent/highlight color (hex)
- colors.background: Page background (hex)
- colors.surface: Card/surface background (hex)
- colors.text: Main text color (hex)
- colors.textMuted: Secondary text color (hex)
- lighting.ambientIntensity: Ambient light (0.0-2.0)
- lighting.keyIntensity: Key light (0.0-5.0)
- lighting.envMapIntensity: Environment reflection (0.0-3.0)
- materials.toneMapping: "ACESFilmic" | "Reinhard" | "Linear"
- materials.toneMappingExposure: Exposure (0.5-3.0)
- typography.fontFamily: Main font stack
- typography.headingFont: Heading-specific font
- typography.bodyFont: Body text font
- typography.monoFont: Code/mono font
- typography.headingWeight: Heading font weight (100-900)
- typography.headingLetterSpacing: Letter spacing (e.g. "-0.05em")
- typography.headingSizeScale: Heading size multiplier (0.5-2.0)

### Background Presets
- "particles": Floating particle field with depth-of-field
- "gradient_mesh": Animated multi-color gradient mesh
- "noise_terrain": Procedural terrain visualization
- "floating_geometry": Floating geometric shapes (cubes, spheres, tori)
- "wave": Undulating wave surface
- "starfield": Star field with parallax depth
- "aurora": Northern lights effect with color bands
- "matrix_rain": Matrix-style character rain
- "fluid_sim": GPU-based fluid simulation

### 3D Model Types
- "terrain", "abstract_sculpture", "low_poly_animal", "architectural", "crystal", "tree"
- "product" with presets: "smartphone", "laptop", "bottle", "shoe", "watch", "headphones", "tablet", "mug"
- "tube", "torus", "helix" — parametric spline-based geometry

### Post-Processing
- bloom.threshold: Bloom brightness threshold (0.0-1.5)
- bloom.strength: Bloom intensity (0.0-3.0)
- bloom.radius: Bloom spread (0.0-1.0)

### Section Types
- "hero_3d": Full-viewport hero with 3D model
- "features": Feature grid/cards
- "specs": Technical specifications
- "showcase": Product/content showcase
- "cta": Call-to-action section
- "footer": Page footer
- "custom_html": Raw HTML content section
- "code_showcase": Code block display section

### Section Layout Variants
- "centered": Content centered in section
- "left": Content aligned left
- "split": Two-column split layout
- "full_bleed": Edge-to-edge content

### Scroll Animation Properties
- rotation: { x, y, z } — model rotation in radians
- position: { x, y, z } — model position offset
- cameraPosition: { x, y, z } — camera position
- cameraPath: Array of { x, y, z } — camera follows CatmullRomCurve3 spline
- cameraLookAt: { x, y, z } | "model" | "next" — camera look target
- scale: number — model scale multiplier
- ease: easing function name (30+ options from linear to easeInOutBounce)
`;
