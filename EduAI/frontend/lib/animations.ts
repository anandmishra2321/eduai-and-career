/**
 * EduAI Animation System
 * Centralized animation utilities using Anime.js, GSAP, and Motion
 */

import anime from "animejs";
import gsap from "gsap";

// ============================================
// ANIME.JS ANIMATIONS
// ============================================

export const fadeIn = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  delay?: number;
  easing?: string;
}) => {
  return anime({
    targets: element,
    opacity: [0, 1],
    translateY: [20, 0],
    duration: options?.duration || 800,
    delay: options?.delay || 0,
    easing: options?.easing || "easeOutExpo",
  });
};

export const fadeOut = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  delay?: number;
}) => {
  return anime({
    targets: element,
    opacity: [1, 0],
    translateY: [0, -20],
    duration: options?.duration || 600,
    delay: options?.delay || 0,
    easing: "easeInQuad",
  });
};

export const slideInLeft = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  delay?: number;
}) => {
  return anime({
    targets: element,
    opacity: [0, 1],
    translateX: [-50, 0],
    duration: options?.duration || 800,
    delay: options?.delay || 0,
    easing: "easeOutExpo",
  });
};

export const slideInRight = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  delay?: number;
}) => {
  return anime({
    targets: element,
    opacity: [0, 1],
    translateX: [50, 0],
    duration: options?.duration || 800,
    delay: options?.delay || 0,
    easing: "easeOutExpo",
  });
};

export const scaleIn = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  delay?: number;
}) => {
  return anime({
    targets: element,
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: options?.duration || 600,
    delay: options?.delay || 0,
    easing: "easeOutBack",
  });
};

export const pulse = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  loop?: boolean;
}) => {
  return anime({
    targets: element,
    scale: [1, 1.05, 1],
    duration: options?.duration || 2000,
    loop: options?.loop ?? true,
    easing: "easeInOutSine",
  });
};

export const glowPulse = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
  color?: string;
}) => {
  return anime({
    targets: element,
    boxShadow: [
      `0 0 20px ${options?.color || "rgba(0, 240, 255, 0.3)"}`,
      `0 0 40px ${options?.color || "rgba(0, 240, 255, 0.6)"}`,
      `0 0 20px ${options?.color || "rgba(0, 240, 255, 0.3)"}`,
    ],
    duration: options?.duration || 2000,
    loop: true,
    easing: "easeInOutSine",
  });
};

export const staggerIn = (elements: HTMLElement[], options?: {
  duration?: number;
  delay?: number;
  stagger?: number;
}) => {
  return anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [30, 0],
    duration: options?.duration || 600,
    delay: anime.stagger(options?.stagger || 100, { start: options?.delay || 0 }),
    easing: "easeOutExpo",
  });
};

export const counterAnimation = (element: HTMLElement, from: number, to: number, options?: {
  duration?: number;
  easing?: string;
}) => {
  const obj = { value: from };
  return anime({
    targets: obj,
    value: to,
    duration: options?.duration || 2000,
    easing: options?.easing || "easeOutExpo",
    round: 1,
    update: () => {
      element.textContent = obj.value.toString();
    },
  });
};

export const progressBar = (element: HTMLElement, to: number, options?: {
  duration?: number;
  easing?: string;
}) => {
  return anime({
    targets: element,
    scaleX: [0, to],
    duration: options?.duration || 1500,
    easing: options?.easing || "easeOutExpo",
  });
};

export const shake = (element: HTMLElement | HTMLElement[], options?: {
  duration?: number;
}) => {
  return anime({
    targets: element,
    translateX: [
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: 0, duration: 100 },
    ],
    duration: options?.duration || 500,
    easing: "easeInOutQuad",
  });
};

export const typewriter = (element: HTMLElement, text: string, options?: {
  speed?: number;
}) => {
  element.textContent = "";
  let i = 0;
  const speed = options?.speed || 50;
  
  return anime({
    targets: { i: 0 },
    i: text.length,
    round: 1,
    duration: text.length * speed,
    easing: "linear",
    update: () => {
      element.textContent = text.substring(0, Math.round((element as any).dataset.i || 0));
    },
  });
};

// ============================================
// GSAP ANIMATIONS
// ============================================

export const gsapFadeIn = (element: HTMLElement, options?: {
  duration?: number;
  delay?: number;
}) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: options?.duration || 0.8, delay: options?.delay || 0, ease: "power2.out" }
  );
};

export const gsapTimeline = () => {
  return gsap.timeline();
};

// ============================================
// SCROLL ANIMATIONS
// ============================================

export const animateOnScroll = (element: HTMLElement, animation: "fadeIn" | "slideInLeft" | "slideInRight" | "scaleIn") => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          switch (animation) {
            case "fadeIn":
              fadeIn(target);
              break;
            case "slideInLeft":
              slideInLeft(target);
              break;
            case "slideInRight":
              slideInRight(target);
              break;
            case "scaleIn":
              scaleIn(target);
              break;
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  
  observer.observe(element);
  return observer;
};

// ============================================
// LOADING ANIMATIONS
// ============================================

export const createLoadingSpinner = (container: HTMLElement) => {
  const spinner = document.createElement("div");
  spinner.className = "w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full";
  container.appendChild(spinner);
  
  anime({
    targets: spinner,
    rotate: "1turn",
    duration: 1000,
    loop: true,
    easing: "linear",
  });
  
  return spinner;
};

export const createPulseDots = (container: HTMLElement, count: number = 3) => {
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "flex gap-2";
  container.appendChild(dotsContainer);
  
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("div");
    dot.className = "w-2 h-2 rounded-full bg-cyan-400";
    dotsContainer.appendChild(dot);
    
    anime({
      targets: dot,
      scale: [1, 1.5, 1],
      opacity: [1, 0.5, 1],
      duration: 1000,
      loop: true,
      delay: i * 200,
      easing: "easeInOutSine",
    });
  }
  
  return dotsContainer;
};

// ============================================
// TRANSITION ANIMATIONS
// ============================================

export const pageTransition = (callback: () => void) => {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-[#030712] z-50";
  document.body.appendChild(overlay);
  
  anime({
    targets: overlay,
    opacity: [0, 1],
    duration: 300,
    easing: "easeInQuad",
    complete: () => {
      callback();
      anime({
        targets: overlay,
        opacity: [1, 0],
        duration: 500,
        easing: "easeOutQuad",
        complete: () => overlay.remove(),
      });
    },
  });
};

// ============================================
// CARD HOVER EFFECTS
// ============================================

export const cardHoverIn = (element: HTMLElement) => {
  return anime({
    targets: element,
    scale: 1.02,
    boxShadow: [
      "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      "0 12px 48px 0 rgba(0, 240, 255, 0.2)",
    ],
    duration: 300,
    easing: "easeOutQuad",
  });
};

export const cardHoverOut = (element: HTMLElement) => {
  return anime({
    targets: element,
    scale: 1,
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
    duration: 300,
    easing: "easeOutQuad",
  });
};
