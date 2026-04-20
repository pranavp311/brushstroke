/**
 * Comprehensive easing function library for scroll animations.
 * 
 * All functions take a value t in range [0, 1] and return an eased value in range [0, 1].
 */

export type EasingName = 
  | "linear"
  | "easeInQuad" | "easeOutQuad" | "easeInOutQuad"
  | "easeInCubic" | "easeOutCubic" | "easeInOutCubic"
  | "easeInQuart" | "easeOutQuart" | "easeInOutQuart"
  | "easeInQuint" | "easeOutQuint" | "easeInOutQuint"
  | "easeInSine" | "easeOutSine" | "easeInOutSine"
  | "easeInExpo" | "easeOutExpo" | "easeInOutExpo"
  | "easeInCirc" | "easeOutCirc" | "easeInOutCirc"
  | "easeInBack" | "easeOutBack" | "easeInOutBack"
  | "easeInElastic" | "easeOutElastic" | "easeInOutElastic"
  | "easeInBounce" | "easeOutBounce" | "easeInOutBounce";

// Linear
export const linear = (t: number): number => t;

// Quadratic
export const easeInQuad = (t: number): number => t * t;
export const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);
export const easeInOutQuad = (t: number): number => 
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Cubic
export const easeInCubic = (t: number): number => t * t * t;
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number): number => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Quartic
export const easeInQuart = (t: number): number => t * t * t * t;
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
export const easeInOutQuart = (t: number): number => 
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

// Quintic
export const easeInQuint = (t: number): number => t * t * t * t * t;
export const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
export const easeInOutQuint = (t: number): number => 
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

// Sine
export const easeInSine = (t: number): number => 1 - Math.cos((t * Math.PI) / 2);
export const easeOutSine = (t: number): number => Math.sin((t * Math.PI) / 2);
export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

// Exponential
export const easeInExpo = (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
export const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const easeInOutExpo = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

// Circular
export const easeInCirc = (t: number): number => 1 - Math.sqrt(1 - Math.pow(t, 2));
export const easeOutCirc = (t: number): number => Math.sqrt(1 - Math.pow(t - 1, 2));
export const easeInOutCirc = (t: number): number =>
  t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;

// Back (overshoot)
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

export const easeInBack = (t: number): number => c3 * t * t * t - c1 * t * t;
export const easeOutBack = (t: number): number => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
export const easeInOutBack = (t: number): number =>
  t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;

// Elastic
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export const easeInElastic = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * (t - 1)) * Math.sin((t * 10 - 10.75) * c4);
};

export const easeOutElastic = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const easeInOutElastic = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};

// Bounce
export const easeOutBounce = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const easeInBounce = (t: number): number => 1 - easeOutBounce(1 - t);

export const easeInOutBounce = (t: number): number =>
  t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;

// Easing function registry
export const easings: Record<EasingName, (t: number) => number> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
};

/**
 * Get an easing function by name.
 * Falls back to easeInOutCubic if the name is not recognized.
 */
export function getEasing(name: EasingName | string): (t: number) => number {
  return easings[name as EasingName] || easeInOutCubic;
}

/**
 * Check if an easing name is valid.
 */
export function isValidEasing(name: string): name is EasingName {
  return name in easings;
}

/**
 * Generate JavaScript code for an easing function.
 * Useful for generating code that doesn't depend on this module.
 */
export function generateEasingCode(name: EasingName): string {
  const easingFunctions: Record<EasingName, string> = {
    linear: "(t) => t",
    easeInQuad: "(t) => t * t",
    easeOutQuad: "(t) => 1 - (1 - t) * (1 - t)",
    easeInOutQuad: "(t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2",
    easeInCubic: "(t) => t * t * t",
    easeOutCubic: "(t) => 1 - Math.pow(1 - t, 3)",
    easeInOutCubic: "(t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2",
    easeInQuart: "(t) => t * t * t * t",
    easeOutQuart: "(t) => 1 - Math.pow(1 - t, 4)",
    easeInOutQuart: "(t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2",
    easeInQuint: "(t) => t * t * t * t * t",
    easeOutQuint: "(t) => 1 - Math.pow(1 - t, 5)",
    easeInOutQuint: "(t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2",
    easeInSine: "(t) => 1 - Math.cos((t * Math.PI) / 2)",
    easeOutSine: "(t) => Math.sin((t * Math.PI) / 2)",
    easeInOutSine: "(t) => -(Math.cos(Math.PI * t) - 1) / 2",
    easeInExpo: "(t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1))",
    easeOutExpo: "(t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)",
    easeInOutExpo: "(t) => { if (t === 0) return 0; if (t === 1) return 1; return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2; }",
    easeInCirc: "(t) => 1 - Math.sqrt(1 - Math.pow(t, 2))",
    easeOutCirc: "(t) => Math.sqrt(1 - Math.pow(t - 1, 2))",
    easeInOutCirc: "(t) => t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2",
    easeInBack: "(t) => 2.70158 * t * t * t - 1.70158 * t * t",
    easeOutBack: "(t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)",
    easeInOutBack: "(t) => { const c2 = 2.5949095; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2; }",
    easeInElastic: "(t) => { if (t === 0) return 0; if (t === 1) return 1; return -Math.pow(2, 10 * (t - 1)) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3)); }",
    easeOutElastic: "(t) => { if (t === 0) return 0; if (t === 1) return 1; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1; }",
    easeInOutElastic: "(t) => { const c5 = 1.3962634; if (t === 0) return 0; if (t === 1) return 1; return t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2 : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1; }",
    easeInBounce: "(t) => 1 - ((t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; else return n1 * (t -= 2.625 / d1) * t + 0.984375; })(1 - t)",
    easeOutBounce: "(t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; else return n1 * (t -= 2.625 / d1) * t + 0.984375; }",
    easeInOutBounce: "(t) => t < 0.5 ? (1 - ((t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; else return n1 * (t -= 2.625 / d1) * t + 0.984375; })(1 - 2 * t)) / 2 : (1 + ((t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; else return n1 * (t -= 2.625 / d1) * t + 0.984375; })(2 * t - 1)) / 2",
  };

  return easingFunctions[name] || easingFunctions.easeInOutCubic;
}
