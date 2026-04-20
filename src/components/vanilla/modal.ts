/** Vanilla HTML modal component — no React, no build step */

import { DesignTokens } from "../../utils/design-tokens.js";

export function vanillaModalComponent(tokens: DesignTokens): string {
  return `<div id="v-modal" class="v-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="v-modal-title" hidden>
  <div class="v-modal-backdrop"></div>
  <div class="v-modal-content">
    <div class="v-modal-header">
      <h2 id="v-modal-title" class="v-modal-title">Modal Title</h2>
      <button class="v-modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="v-modal-body">
      <p>Modal content goes here.</p>
    </div>
  </div>
</div>
<style>
  .v-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .v-modal-overlay[hidden] { display: none; }
  .v-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
  }
  .v-modal-content {
    position: relative;
    width: 100%;
    max-width: 32rem;
    background: ${tokens.colors.surface};
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    animation: modalIn 0.2s ease;
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .v-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid ${tokens.colors.textMuted}22;
  }
  .v-modal-title {
    font-family: ${tokens.typography.fontFamily};
    font-weight: ${tokens.typography.headingWeight};
    font-size: 1.25rem;
    color: ${tokens.colors.text};
    margin: 0;
  }
  .v-modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: ${tokens.colors.textMuted};
    padding: 0.25rem;
    line-height: 1;
    transition: color 0.2s;
  }
  .v-modal-close:hover { color: ${tokens.colors.text}; }
  .v-modal-body {
    padding: 1.5rem;
    font-family: ${tokens.typography.fontFamily};
    color: ${tokens.colors.text};
    line-height: 1.6;
  }
</style>
<script>
  (() => {
    const modal = document.getElementById('v-modal');
    const closeBtn = modal.querySelector('.v-modal-close');
    const backdrop = modal.querySelector('.v-modal-backdrop');
    function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
    window.openModal = (title, bodyHtml) => {
      if (title) modal.querySelector('.v-modal-title').textContent = title;
      if (bodyHtml) modal.querySelector('.v-modal-body').innerHTML = bodyHtml;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    };
  })();
</script>`;
}
