export interface HeroOptions {
  typescript: boolean;
  styling: "tailwind" | "css_modules" | "styled_components";
  darkMode: boolean;
  responsive: boolean;
  animated: boolean;
  ariaLabels: boolean;
  keyboardNav: boolean;
}

export function heroComponent(opts: HeroOptions): string {
  const ext = opts.typescript ? "tsx" : "jsx";
  const typeAnnotation = opts.typescript ? ": React.FC<HeroProps>" : "";
  const propsInterface = opts.typescript ? `
interface HeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}
` : "";

  const styles = getHeroStyles(opts);

  return `// Hero.${ext}
import React${opts.animated ? ", { useEffect, useRef }" : ""} from 'react';
${styles.imports}

${propsInterface}
const Hero${typeAnnotation} = ({ title, subtitle, ctaText = "Get Started", ctaLink = "#", backgroundImage }) => {
  ${opts.animated ? `const heroRef = useRef${opts.typescript ? "<HTMLDivElement>(null)" : "(null)"};

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, []);` : ""}

  return (
    <section
      ${opts.animated ? "ref={heroRef}" : ""}
      ${styles.container}
      ${opts.ariaLabels ? 'role="banner" aria-label="Hero section"' : ""}
      style={backgroundImage ? { backgroundImage: \`url(\${backgroundImage})\`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <div ${styles.content}>
        <h1 ${styles.title}>{title}</h1>
        {subtitle && <p ${styles.subtitle}>{subtitle}</p>}
        <a
          href={ctaLink}
          ${styles.cta}
          ${opts.keyboardNav ? 'tabIndex={0} onKeyDown={(e) => e.key === "Enter" && (window.location.href = ctaLink)}' : ""}
          ${opts.ariaLabels ? 'aria-label={ctaText}' : ""}
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
};

export default Hero;
${styles.styleBlock}`;
}

function getHeroStyles(opts: HeroOptions): { imports: string; container: string; content: string; title: string; subtitle: string; cta: string; styleBlock: string } {
  if (opts.styling === "tailwind") {
    const dark = opts.darkMode ? "dark:" : "";
    return {
      imports: "",
      container: `className="min-h-screen flex items-center justify-center ${opts.darkMode ? "bg-gray-900" : "bg-white"} px-4"`,
      content: `className="text-center max-w-4xl mx-auto"`,
      title: `className="text-5xl ${opts.responsive ? "md:text-7xl" : ""} font-bold ${opts.darkMode ? "text-white" : "text-gray-900"} mb-6"`,
      subtitle: `className="text-xl ${opts.responsive ? "md:text-2xl" : ""} ${opts.darkMode ? "text-gray-300" : "text-gray-600"} mb-8"`,
      cta: `className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors ${opts.responsive ? "text-lg" : ""}"`,
      styleBlock: "",
    };
  }

  if (opts.styling === "styled_components") {
    return {
      imports: `import styled from 'styled-components';`,
      container: "",
      content: "",
      title: "",
      subtitle: "",
      cta: "",
      styleBlock: `
const HeroSection = styled.section\`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${opts.darkMode ? "#111827" : "#ffffff"};
  padding: 1rem;
\`;
const Content = styled.div\`text-align: center; max-width: 56rem; margin: 0 auto;\`;
const Title = styled.h1\`
  font-size: 3rem;
  font-weight: 700;
  color: ${opts.darkMode ? "#fff" : "#111827"};
  margin-bottom: 1.5rem;
  ${opts.responsive ? "@media (min-width: 768px) { font-size: 4.5rem; }" : ""}
\`;
const Subtitle = styled.p\`
  font-size: 1.25rem;
  color: ${opts.darkMode ? "#d1d5db" : "#4b5563"};
  margin-bottom: 2rem;
\`;
const CTA = styled.a\`
  display: inline-block;
  padding: 1rem 2rem;
  background: #4f46e5;
  color: white;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  &:hover { background: #4338ca; }
\`;`,
    };
  }

  // css_modules
  return {
    imports: `import styles from './Hero.module.css';`,
    container: `className={styles.hero}`,
    content: `className={styles.content}`,
    title: `className={styles.title}`,
    subtitle: `className={styles.subtitle}`,
    cta: `className={styles.cta}`,
    styleBlock: `
/* Hero.module.css */
/*
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: ${opts.darkMode ? "#111827" : "#fff"}; padding: 1rem; }
.content { text-align: center; max-width: 56rem; margin: 0 auto; }
.title { font-size: 3rem; font-weight: 700; color: ${opts.darkMode ? "#fff" : "#111827"}; margin-bottom: 1.5rem; }
.subtitle { font-size: 1.25rem; color: ${opts.darkMode ? "#d1d5db" : "#4b5563"}; margin-bottom: 2rem; }
.cta { display: inline-block; padding: 1rem 2rem; background: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; text-decoration: none; }
.cta:hover { background: #4338ca; }
*/`,
  };
}
