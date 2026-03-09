export interface CardOptions {
  typescript: boolean;
  styling: "tailwind" | "css_modules" | "styled_components";
  darkMode: boolean;
  responsive: boolean;
  animated: boolean;
  ariaLabels: boolean;
  keyboardNav: boolean;
}

export function cardComponent(opts: CardOptions): string {
  const ext = opts.typescript ? "tsx" : "jsx";
  const typeAnnotation = opts.typescript ? ": React.FC<CardProps>" : "";
  const propsInterface = opts.typescript ? `
interface CardProps {
  title: string;
  description?: string;
  image?: string;
  link?: string;
  tags?: string[];
}
` : "";

  const tw = opts.styling === "tailwind";

  return `// Card.${ext}
import React${opts.animated ? ", { useRef, useEffect }" : ""} from 'react';

${propsInterface}
const Card${typeAnnotation} = ({ title, description, image, link, tags = [] }) => {
  ${opts.animated ? `const cardRef = useRef${opts.typescript ? "<HTMLDivElement>(null)" : "(null)"};

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMouseMove = (e${opts.typescript ? ": MouseEvent" : ""}) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = \`perspective(600px) rotateY(\${x * 10}deg) rotateX(\${-y * 10}deg)\`;
    };
    const onMouseLeave = () => {
      el.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg)';
      el.style.transition = 'transform 0.5s ease';
    };
    const onMouseEnter = () => { el.style.transition = 'transform 0.1s ease'; };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseenter', onMouseEnter);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);` : ""}

  const content = (
    <div
      ${opts.animated ? "ref={cardRef}" : ""}
      ${tw ? `className="group ${opts.darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl border overflow-hidden ${opts.animated ? "hover:shadow-xl transition-shadow" : ""} ${opts.responsive ? "w-full" : "w-80"}"` : `style={{ borderRadius: '0.75rem', border: '1px solid ${opts.darkMode ? "#374151" : "#e5e7eb"}', background: '${opts.darkMode ? "#1f2937" : "#fff"}', overflow: 'hidden', ${opts.responsive ? "width: '100%'" : "width: '320px'"} }}`}
      ${opts.ariaLabels ? 'role="article" aria-label={title}' : ""}
      ${opts.keyboardNav ? 'tabIndex={0}' : ""}
    >
      {image && (
        <div ${tw ? `className="aspect-video overflow-hidden"` : `style={{ aspectRatio: '16/9', overflow: 'hidden' }}`}>
          <img
            src={image}
            alt={title}
            ${tw ? `className="w-full h-full object-cover ${opts.animated ? "group-hover:scale-105 transition-transform duration-500" : ""}"` : `style={{ width: '100%', height: '100%', objectFit: 'cover' }}`}
          />
        </div>
      )}
      <div ${tw ? `className="p-6"` : `style={{ padding: '1.5rem' }}`}>
        <h3 ${tw ? `className="text-lg font-semibold ${opts.darkMode ? "text-white" : "text-gray-900"} mb-2"` : `style={{ fontSize: '1.125rem', fontWeight: 600, color: '${opts.darkMode ? "#fff" : "#111827"}', marginBottom: '0.5rem' }}`}>{title}</h3>
        {description && <p ${tw ? `className="${opts.darkMode ? "text-gray-400" : "text-gray-600"} text-sm mb-4"` : `style={{ color: '${opts.darkMode ? "#9ca3af" : "#4b5563"}', fontSize: '0.875rem', marginBottom: '1rem' }}`}>{description}</p>}
        {tags.length > 0 && (
          <div ${tw ? `className="flex flex-wrap gap-2"` : `style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}`}>
            {tags.map((tag, i) => (
              <span key={i} ${tw ? `className="text-xs px-2 py-1 rounded-full ${opts.darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}"` : `style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', background: '${opts.darkMode ? "#374151" : "#f3f4f6"}', color: '${opts.darkMode ? "#d1d5db" : "#4b5563"}' }}`}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return link ? <a href={link} style={{ textDecoration: 'none' }}>{content}</a> : content;
};

export default Card;`;
}
