/**
 * EduAI Responsive Design Utilities
 * Helper functions for responsive design patterns
 */

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Check if current viewport matches breakpoint
 */
export const isBreakpoint = (breakpoint: Breakpoint): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= breakpoints[breakpoint];
};

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = (): Breakpoint => {
  if (typeof window === "undefined") return "md";
  
  const width = window.innerWidth;
  if (width >= breakpoints["2xl"]) return "2xl";
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  if (width >= breakpoints.sm) return "sm";
  return "xs";
};

/**
 * Responsive value helper
 */
export const responsiveValue = <T,>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T => {
  const current = getCurrentBreakpoint();
  
  // Check from largest to smallest
  const orderedBreakpoints: Breakpoint[] = ["2xl", "xl", "lg", "md", "sm", "xs"];
  
  for (const bp of orderedBreakpoints) {
    if (values[bp] !== undefined && isBreakpoint(bp)) {
      return values[bp]!;
    }
  }
  
  return defaultValue;
};

/**
 * Touch device detection
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Mobile device detection
 */
export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < breakpoints.md;
};

/**
 * Tablet device detection
 */
export const isTablet = (): boolean => {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  return width >= breakpoints.md && width < breakpoints.lg;
};

/**
 * Desktop device detection
 */
export const isDesktop = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= breakpoints.lg;
};

/**
 * Get device orientation
 */
export const getOrientation = (): "portrait" | "landscape" => {
  if (typeof window === "undefined") return "landscape";
  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
};

/**
 * Safe area insets for mobile devices
 */
export const getSafeAreaInsets = () => {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const safeArea = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(safeArea.getPropertyValue("env(safe-area-inset-top)") || "0", 10),
    right: parseInt(safeArea.getPropertyValue("env(safe-area-inset-right)") || "0", 10),
    bottom: parseInt(safeArea.getPropertyValue("env(safe-area-inset-bottom)") || "0", 10),
    left: parseInt(safeArea.getPropertyValue("env(safe-area-inset-left)") || "0", 10),
  };
};

/**
 * Responsive grid columns
 */
export const getGridColumns = (defaultCols: number, breakpointCols?: Partial<Record<Breakpoint, number>>): number => {
  return responsiveValue(breakpointCols || {}, defaultCols);
};

/**
 * Responsive spacing
 */
export const getResponsiveSpacing = (
  base: number,
  multiplier: number = 1
): number => {
  const breakpoint = getCurrentBreakpoint();
  
  const multipliers: Record<Breakpoint, number> = {
    xs: 0.75,
    sm: 0.875,
    md: 1,
    lg: 1.125,
    xl: 1.25,
    "2xl": 1.5,
  };
  
  return base * multipliers[breakpoint] * multiplier;
};

/**
 * Check if reduced motion is preferred
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Check if dark mode is preferred
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/**
 * Check if high contrast is preferred
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: high)").matches;
};
