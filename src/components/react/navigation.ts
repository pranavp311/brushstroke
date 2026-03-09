export interface NavigationOptions {
  typescript: boolean;
  styling: "tailwind" | "css_modules" | "styled_components";
  darkMode: boolean;
  responsive: boolean;
  animated: boolean;
  ariaLabels: boolean;
  keyboardNav: boolean;
}

export function navigationComponent(opts: NavigationOptions): string {
  const ext = opts.typescript ? "tsx" : "jsx";
  const typeAnnotation = opts.typescript ? ": React.FC<NavProps>" : "";
  const propsInterface = opts.typescript ? `
interface NavLink {
  label: string;
  href: string;
}

interface NavProps {
  brand: string;
  links: NavLink[];
  sticky?: boolean;
}
` : "";

  const tw = opts.styling === "tailwind";

  return `// Navigation.${ext}
import React, { useState${opts.animated ? ", useEffect" : ""} } from 'react';

${propsInterface}
const Navigation${typeAnnotation} = ({ brand, links, sticky = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  ${opts.animated ? `const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);` : ""}

  return (
    <nav
      ${opts.ariaLabels ? 'role="navigation" aria-label="Main navigation"' : ""}
      ${tw ? `className={\`${opts.responsive ? "px-4 md:px-8" : "px-8"} py-4 flex items-center justify-between ${opts.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} \${sticky ? "fixed top-0 left-0 right-0 z-50" : ""} ${opts.animated ? '${scrolled ? "shadow-lg" : ""}' : ""} transition-shadow\`}` : `style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '${opts.darkMode ? "#111827" : "#fff"}', color: '${opts.darkMode ? "#fff" : "#111827"}', ...(sticky ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 } : {}) }}`}
    >
      <a href="/" ${tw ? `className="text-xl font-bold"` : `style={{ fontSize: '1.25rem', fontWeight: 700, textDecoration: 'none', color: 'inherit' }}`}>{brand}</a>

      ${opts.responsive ? `
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        ${tw ? `className="md:hidden p-2"` : `style={{ display: 'none' }}`}
        ${opts.ariaLabels ? 'aria-label="Toggle menu" aria-expanded={isOpen}' : ""}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>` : ""}

      <ul
        ${tw ? `className={\`${opts.responsive ? "hidden md:flex" : "flex"} items-center gap-6 \${isOpen ? "!flex flex-col absolute top-full left-0 right-0 ${opts.darkMode ? "bg-gray-900" : "bg-white"} p-4 shadow-lg md:relative md:flex-row md:p-0 md:shadow-none" : ""}\`}` : `style={{ display: 'flex', listStyle: 'none', gap: '1.5rem', alignItems: 'center', margin: 0, padding: 0 }}`}
        ${opts.ariaLabels ? 'role="menubar"' : ""}
      >
        {links.map((link, i) => (
          <li key={i} ${opts.ariaLabels ? 'role="none"' : ""}>
            <a
              href={link.href}
              ${tw ? `className="${opts.darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors"` : `style={{ textDecoration: 'none', color: '${opts.darkMode ? "#d1d5db" : "#4b5563"}' }}`}
              ${opts.ariaLabels ? 'role="menuitem"' : ""}
              ${opts.keyboardNav ? 'tabIndex={0}' : ""}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;`;
}
