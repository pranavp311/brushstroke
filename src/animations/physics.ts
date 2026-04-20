/**
 * Spring Physics Animation System
 * 
 * Provides physics-based animations with spring dynamics
 * Uses semi-implicit Euler integration for stability
 */

export interface SpringConfig {
  stiffness: number;    // Spring constant (0-1, higher = snappier)
  damping: number;      // Damping ratio (0-1, higher = less oscillation)
  mass: number;         // Object mass (default 1)
}

export interface SpringState {
  position: number;
  velocity: number;
  target: number;
}

export interface SpringAnimation {
  id: string;
  property: "position" | "rotation" | "scale" | "opacity" | "custom";
  target: number | { x: number; y: number; z: number };
  config: SpringConfig;
  delay?: number;
  customProperty?: string; // For custom property name
}

export interface PhysicsScrollConfig {
  scrollSpring: SpringConfig;
  mouseParallaxSpring: SpringConfig;
  enableInertia: boolean;
  inertiaDecay: number;
}

/**
 * Pre-configured spring presets
 */
export const SPRING_PRESETS: Record<string, SpringConfig> = {
  "default": { stiffness: 0.5, damping: 0.8, mass: 1 },
  "gentle": { stiffness: 0.2, damping: 0.9, mass: 1 },
  "wobbly": { stiffness: 0.3, damping: 0.4, mass: 1 },
  "stiff": { stiffness: 0.8, damping: 0.9, mass: 1 },
  "bounce": { stiffness: 0.5, damping: 0.2, mass: 1 },
  "slow": { stiffness: 0.1, damping: 0.95, mass: 1 },
  "snappy": { stiffness: 0.7, damping: 0.85, mass: 1 },
  "smooth": { stiffness: 0.4, damping: 0.95, mass: 1 },
};

/**
 * Generate physics-based animation code for Three.js
 */
export function generateSpringPhysicsCode(
  animations: SpringAnimation[],
  targetObject: string = "model"
): string {
  const springIds = animations.map(a => a.id);
  
  // Generate spring state objects
  const springStates = animations.map(anim => {
    const target = typeof anim.target === 'number' 
      ? anim.target 
      : `{ x: ${anim.target.x}, y: ${anim.target.y}, z: ${anim.target.z} }`;
    
    const initialPos = typeof anim.target === 'number' ? 0 : `{ x: 0, y: 0, z: 0 }`;
    
    return `
// Spring: ${anim.id} (${anim.property})
const spring_${anim.id} = {
  config: { stiffness: ${anim.config.stiffness}, damping: ${anim.config.damping}, mass: ${anim.config.mass} },
  state: {
    position: ${initialPos},
    velocity: ${typeof anim.target === 'number' ? 0 : '{ x: 0, y: 0, z: 0 }'},
    target: ${target}
  },
  delay: ${anim.delay ?? 0},
  delayTimer: 0,
  active: ${anim.delay ? 'false' : 'true'}
};`;
  }).join("\n");

  // Generate update function
  const updateSprings = animations.map(anim => {
    const isVector = typeof anim.target !== 'number';
    
    if (isVector) {
      return `
  // Update spring ${anim.id}
  if (spring_${anim.id}.active) {
    const cfg = spring_${anim.id}.config;
    const st = spring_${anim.id}.state;
    
    // Spring force
    const forceX = (st.target.x - st.position.x) * cfg.stiffness;
    const forceY = (st.target.y - st.position.y) * cfg.stiffness;
    const forceZ = (st.target.z - st.position.z) * cfg.stiffness;
    
    // Acceleration
    const accelX = forceX / cfg.mass;
    const accelY = forceY / cfg.mass;
    const accelZ = forceZ / cfg.mass;
    
    // Velocity update (with damping)
    st.velocity.x = (st.velocity.x + accelX * dt) * (1 - cfg.damping * dt);
    st.velocity.y = (st.velocity.y + accelY * dt) * (1 - cfg.damping * dt);
    st.velocity.z = (st.velocity.z + accelZ * dt) * (1 - cfg.damping * dt);
    
    // Position update
    st.position.x += st.velocity.x * dt;
    st.position.y += st.velocity.y * dt;
    st.position.z += st.velocity.z * dt;
    
    // Apply to object
    ${getPropertySetter(targetObject, anim.property, anim.customProperty, `st.position`)}
  } else {
    spring_${anim.id}.delayTimer += dt;
    if (spring_${anim.id}.delayTimer >= spring_${anim.id}.delay) {
      spring_${anim.id}.active = true;
    }
  }`;
    } else {
      return `
  // Update spring ${anim.id}
  if (spring_${anim.id}.active) {
    const cfg = spring_${anim.id}.config;
    const st = spring_${anim.id}.state;
    
    // Spring force
    const force = (st.target - st.position) * cfg.stiffness;
    
    // Acceleration
    const accel = force / cfg.mass;
    
    // Velocity update (with damping)
    st.velocity = (st.velocity + accel * dt) * (1 - cfg.damping * dt);
    
    // Position update
    st.position += st.velocity * dt;
    
    // Apply to object
    ${getPropertySetter(targetObject, anim.property, anim.customProperty, `st.position`)}
  } else {
    spring_${anim.id}.delayTimer += dt;
    if (spring_${anim.id}.delayTimer >= spring_${anim.id}.delay) {
      spring_${anim.id}.active = true;
    }
  }`;
    }
  }).join("\n");

  // Generate target setter function
  const setTargetFunction = `
// Set spring target
function setSpringTarget(springId, target) {
  const spring = window['spring_' + springId];
  if (spring) {
    if (typeof target === 'number') {
      spring.state.target = target;
    } else {
      spring.state.target.x = target.x ?? spring.state.target.x;
      spring.state.target.y = target.y ?? spring.state.target.y;
      spring.state.target.z = target.z ?? spring.state.target.z;
    }
  }
}

// Set spring config
function setSpringConfig(springId, config) {
  const spring = window['spring_' + springId];
  if (spring) {
    spring.config.stiffness = config.stiffness ?? spring.config.stiffness;
    spring.config.damping = config.damping ?? spring.config.damping;
    spring.config.mass = config.mass ?? spring.config.mass;
  }
}
`;

  return `
// Spring Physics Animation System
${springStates}

${setTargetFunction}

// Update all springs
function updateSprings(dt) {
${updateSprings}
}

// Make springs globally accessible
window.springs = {
${springIds.map(id => `  ${id}: spring_${id}`).join(",\n")}
};
window.updateSprings = updateSprings;
window.setSpringTarget = setSpringTarget;
window.setSpringConfig = setSpringConfig;
`;
}

function getPropertySetter(
  target: string, 
  property: string, 
  customProperty?: string,
  valueExpr: string = "value"
): string {
  switch (property) {
    case "position":
      return `${target}.position.set(${valueExpr}.x, ${valueExpr}.y, ${valueExpr}.z);`;
    case "rotation":
      return `${target}.rotation.set(${valueExpr}.x, ${valueExpr}.y, ${valueExpr}.z);`;
    case "scale":
      return `${target}.scale.setScalar(${valueExpr});`;
    case "opacity":
      return `if (${target}.material) ${target}.material.opacity = ${valueExpr};`;
    case "custom":
      return `${target}.${customProperty || 'position'}.set(${valueExpr}.x, ${valueExpr}.y, ${valueExpr}.z);`;
    default:
      return `${target}.position.set(${valueExpr}.x, ${valueExpr}.y, ${valueExpr}.z);`;
  }
}

/**
 * Generate physics-based scroll controller
 */
export function generatePhysicsScrollController(
  sections: Array<{ id: string }>,
  config: PhysicsScrollConfig
): string {
  return `
// Physics-based Scroll Controller
const scrollSpring = {
  config: { stiffness: ${config.scrollSpring.stiffness}, damping: ${config.scrollSpring.damping}, mass: ${config.scrollSpring.mass} },
  state: { position: 0, velocity: 0, target: 0 }
};

const parallaxSpring = {
  config: { stiffness: ${config.mouseParallaxSpring.stiffness}, damping: ${config.mouseParallaxSpring.damping}, mass: ${config.mouseParallaxSpring.mass} },
  state: { x: 0, y: 0, velocityX: 0, velocityY: 0, targetX: 0, targetY: 0 }
};

let lastScrollY = window.scrollY;
let scrollVelocity = 0;

// Scroll listener
window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollProgress = maxScroll > 0 ? currentScroll / maxScroll : 0;
  
  scrollSpring.state.target = scrollProgress;
  
  ${config.enableInertia ? `
  // Calculate scroll velocity for inertia
  scrollVelocity = (currentScroll - lastScrollY) * 0.1;
  lastScrollY = currentScroll;
  ` : ''}
}, { passive: true });

// Mouse parallax listener
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  
  parallaxSpring.state.targetX = x;
  parallaxSpring.state.targetY = y;
});

function updatePhysicsScroll(dt) {
  // Update scroll spring
  {
    const cfg = scrollSpring.config;
    const st = scrollSpring.state;
    
    const force = (st.target - st.position) * cfg.stiffness;
    const accel = force / cfg.mass;
    st.velocity = (st.velocity + accel * dt) * (1 - cfg.damping * dt);
    st.position += st.velocity * dt;
  }
  
  // Update parallax spring
  {
    const cfg = parallaxSpring.config;
    const st = parallaxSpring.state;
    
    const forceX = (st.targetX - st.x) * cfg.stiffness;
    const forceY = (st.targetY - st.y) * cfg.stiffness;
    
    const accelX = forceX / cfg.mass;
    const accelY = forceY / cfg.mass;
    
    st.velocityX = (st.velocityX + accelX * dt) * (1 - cfg.damping * dt);
    st.velocityY = (st.velocityY + accelY * dt) * (1 - cfg.damping * dt);
    
    st.x += st.velocityX * dt;
    st.y += st.velocityY * dt;
  }
  
  // Apply to model if exists
  if (model) {
    const scrollProgress = scrollSpring.state.position;
    
    // Example: Rotate model based on scroll
    model.rotation.y = scrollProgress * Math.PI * 2;
    
    // Apply parallax
    model.position.x = parallaxSpring.state.x * 0.5;
    model.position.y = parallaxSpring.state.y * 0.25;
  }
}

window.updatePhysicsScroll = updatePhysicsScroll;
`;
}

/**
 * Generate a simple spring animation for a single property
 */
export function generateSimpleSpring(
  property: string,
  targetValue: number,
  preset: keyof typeof SPRING_PRESETS = "default"
): string {
  const config = SPRING_PRESETS[preset];
  
  return generateSpringPhysicsCode([{
    id: "main",
    property: property as any,
    target: targetValue,
    config,
  }]);
}
