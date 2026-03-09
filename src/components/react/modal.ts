export interface ModalOptions {
  typescript: boolean;
  styling: "tailwind" | "css_modules" | "styled_components";
  darkMode: boolean;
  responsive: boolean;
  animated: boolean;
  ariaLabels: boolean;
  keyboardNav: boolean;
}

export function modalComponent(opts: ModalOptions): string {
  const ext = opts.typescript ? "tsx" : "jsx";
  const typeAnnotation = opts.typescript ? ": React.FC<ModalProps>" : "";
  const propsInterface = opts.typescript ? `
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
` : "";

  const tw = opts.styling === "tailwind";
  const sizeMap = tw
    ? `{ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }`
    : `{ sm: '24rem', md: '32rem', lg: '48rem' }`;

  return `// Modal.${ext}
import React, { useEffect, useRef, useCallback } from 'react';

${propsInterface}
const Modal${typeAnnotation} = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef${opts.typescript ? "<HTMLDivElement>(null)" : "(null)"};
  const previousFocus = useRef${opts.typescript ? "<HTMLElement | null>(null)" : "(null)"};

  ${opts.keyboardNav ? `
  // Trap focus inside modal
  const trapFocus = useCallback((e${opts.typescript ? ": KeyboardEvent" : ""}) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;

    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0]${opts.typescript ? " as HTMLElement" : ""};
    const last = focusable[focusable.length - 1]${opts.typescript ? " as HTMLElement" : ""};

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);` : `
  const handleKeyDown = useCallback((e${opts.typescript ? ": KeyboardEvent" : ""}) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);`}

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement${opts.typescript ? " as HTMLElement" : ""};
      ${opts.animated ? `
      const modal = modalRef.current;
      if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        requestAnimationFrame(() => {
          modal.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          modal.style.opacity = '1';
          modal.style.transform = 'scale(1)';
        });
      }` : ""}
      document.addEventListener('keydown', ${opts.keyboardNav ? "trapFocus" : "handleKeyDown"});
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', ${opts.keyboardNav ? "trapFocus" : "handleKeyDown"});
      document.body.style.overflow = '';
      if (previousFocus.current) previousFocus.current.focus();
    };
  }, [isOpen, ${opts.keyboardNav ? "trapFocus" : "handleKeyDown"}]);

  if (!isOpen) return null;

  const sizes = ${sizeMap};

  return (
    <div
      ${tw ? `className="fixed inset-0 z-50 flex items-center justify-center p-4"` : `style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}`}
      ${opts.ariaLabels ? 'role="dialog" aria-modal="true" aria-labelledby="modal-title"' : ""}
    >
      {/* Backdrop */}
      <div
        ${tw ? `className="absolute inset-0 ${opts.darkMode ? "bg-black/70" : "bg-black/50"} ${opts.animated ? "backdrop-blur-sm" : ""}"` : `style={{ position: 'absolute', inset: 0, background: '${opts.darkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"}' }}`}
        onClick={onClose}
        ${opts.ariaLabels ? 'aria-label="Close modal"' : ""}
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        ${tw ? `className={\`relative w-full \${sizes[size]} ${opts.darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"} rounded-xl shadow-2xl\`}` : `style={{ position: 'relative', width: '100%', maxWidth: sizes[size], background: '${opts.darkMode ? "#1f2937" : "#fff"}', color: '${opts.darkMode ? "#fff" : "#111827"}', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}`}
      >
        {/* Header */}
        <div ${tw ? `className="flex items-center justify-between p-6 border-b ${opts.darkMode ? "border-gray-700" : "border-gray-200"}"` : `style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid ${opts.darkMode ? "#374151" : "#e5e7eb"}' }}`}>
          <h2 id="modal-title" ${tw ? `className="text-xl font-semibold"` : `style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}`}>{title}</h2>
          <button
            onClick={onClose}
            ${tw ? `className="p-1 rounded-lg ${opts.darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} transition-colors"` : `style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.5rem' }}`}
            ${opts.ariaLabels ? 'aria-label="Close"' : ""}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div ${tw ? `className="p-6"` : `style={{ padding: '1.5rem' }}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;`;
}
