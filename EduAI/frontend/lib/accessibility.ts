/**
 * EduAI Accessibility Utilities
 * Helper functions for accessibility features
 */

import { prefersReducedMotion, prefersHighContrast } from "./responsive";

/**
 * ARIA attribute helpers
 */
export const aria = {
  /**
   * Generate aria-label for interactive elements
   */
  label: (text: string) => ({ "aria-label": text }),

  /**
   * Generate aria-describedby for elements with descriptions
   */
  describedBy: (id: string) => ({ "aria-describedby": id }),

  /**
   * Generate aria-labelledby for elements labeled by another element
   */
  labelledBy: (id: string) => ({ "aria-labelledby": id }),

  /**
   * Generate aria-live for dynamic content regions
   */
  live: (politeness: "polite" | "assertive" | "off" = "polite") => ({
    "aria-live": politeness,
  }),

  /**
   * Generate aria-atomic for atomic regions
   */
  atomic: (value: boolean = true) => ({ "aria-atomic": String(value) }),

  /**
   * Generate aria-hidden for decorative elements
   */
  hidden: (value: boolean = true) => ({ "aria-hidden": String(value) }),

  /**
   * Generate aria-expanded for collapsible elements
   */
  expanded: (value: boolean) => ({ "aria-expanded": String(value) }),

  /**
   * Generate aria-pressed for toggle buttons
   */
  pressed: (value: boolean) => ({ "aria-pressed": String(value) }),

  /**
   * Generate aria-selected for selectable items
   */
  selected: (value: boolean) => ({ "aria-selected": String(value) }),

  /**
   * Generate aria-disabled for disabled elements
   */
  disabled: (value: boolean = true) => ({ "aria-disabled": String(value) }),

  /**
   * Generate aria-current for current items
   */
  current: (value: boolean | "page" | "step" | "location" | "date" | "time" = true) => ({
    "aria-current": String(value),
  }),

  /**
   * Generate aria-controls for elements that control others
   */
  controls: (id: string) => ({ "aria-controls": id }),

  /**
   * Generate aria-haspopup for elements with popups
   */
  hasPopup: (value: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog" = true) => ({
    "aria-haspopup": String(value),
  }),

  /**
   * Generate aria-modal for modal dialogs
   */
  modal: (value: boolean = true) => ({ "aria-modal": String(value) }),

  /**
   * Generate aria-orientation for orientation
   */
  orientation: (value: "horizontal" | "vertical") => ({
    "aria-orientation": value,
  }),

  /**
   * Generate aria-valuemin for range inputs
   */
  valueMin: (value: number) => ({ "aria-valuemin": String(value) }),

  /**
   * Generate aria-valuemax for range inputs
   */
  valueMax: (value: number) => ({ "aria-valuemax": String(value) }),

  /**
   * Generate aria-valuenow for range inputs
   */
  valueNow: (value: number) => ({ "aria-valuenow": String(value) }),

  /**
   * Generate aria-valuetext for range inputs
   */
  valueText: (text: string) => ({ "aria-valuetext": text }),

  /**
   * Generate aria-required for required fields
   */
  required: (value: boolean = true) => ({ "aria-required": String(value) }),

  /**
   * Generate aria-invalid for invalid fields
   */
  invalid: (value: boolean = true) => ({ "aria-invalid": String(value) }),

  /**
   * Generate aria-errormessage for error descriptions
   */
  errorMessage: (id: string) => ({ "aria-errormessage": id }),
};

/**
 * Role helpers
 */
export const role = {
  button: { role: "button" },
  link: { role: "link" },
  navigation: { role: "navigation" },
  main: { role: "main" },
  complementary: { role: "complementary" },
  contentinfo: { role: "contentinfo" },
  banner: { role: "banner" },
  search: { role: "search" },
  dialog: { role: "dialog" },
  alert: { role: "alert" },
  status: { role: "status" },
  progressbar: { role: "progressbar" },
  tablist: { role: "tablist" },
  tab: { role: "tab" },
 tabpanel: { role: "tabpanel" },
  menu: { role: "menu" },
  menuitem: { role: "menuitem" },
  listbox: { role: "listbox" },
  option: { role: "option" },
  combobox: { role: "combobox" },
  checkbox: { role: "checkbox" },
  radio: { role: "radio" },
  switch: { role: "switch" },
  slider: { role: "slider" },
  spinbutton: { role: "spinbutton" },
  tooltip: { role: "tooltip" },
  region: { role: "region" },
};

/**
 * Focus management utilities
 */
export const focus = {
  /**
   * Trap focus within a container
   */
  trap: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  },

  /**
   * Move focus to an element
   */
  move: (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  },

  /**
   * Restore focus to previously focused element
   */
  restore: (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboard = {
  /**
   * Check if key is Enter or Space
   */
  isActivateKey: (e: KeyboardEvent) => e.key === "Enter" || e.key === " ",

  /**
   * Check if key is Escape
   */
  isEscapeKey: (e: KeyboardEvent) => e.key === "Escape",

  /**
   * Check if key is Arrow key
   */
  isArrowKey: (e: KeyboardEvent) =>
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight",

  /**
   * Handle keyboard activation for non-button elements
   */
  handleActivation: (
    callback: () => void,
    e: React.KeyboardEvent | KeyboardEvent
  ) => {
    if (keyboard.isActivateKey(e as KeyboardEvent)) {
      (e as React.KeyboardEvent).preventDefault();
      callback();
    }
  },
};

/**
 * Screen reader announcements
 */
export const announce = {
  /**
   * Announce a message to screen readers
   */
  message: (text: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = text;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Create an announcement region
   */
  createRegion: (id: string, priority: "polite" | "assertive" = "polite") => {
    const region = document.createElement("div");
    region.id = id;
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    return region;
  },
};

/**
 * Reduced motion utilities
 */
export const motion = {
  /**
   * Check if reduced motion is preferred
   */
  isReduced: prefersReducedMotion,

  /**
   * Get animation duration based on reduced motion preference
   */
  getDuration: (normalDuration: number, reducedDuration: number = 0) => {
    return prefersReducedMotion() ? reducedDuration : normalDuration;
  },

  /**
   * Get animation easing based on reduced motion preference
   */
  getEasing: (normalEasing: string, reducedEasing: string = "linear") => {
    return prefersReducedMotion() ? reducedEasing : normalEasing;
  },
};

/**
 * High contrast utilities
 */
export const contrast = {
  /**
   * Check if high contrast is preferred
   */
  isHighContrast: prefersHighContrast,

  /**
   * Get color based on contrast preference
   */
  getColor: (normalColor: string, highContrastColor: string) => {
    return prefersHighContrast() ? highContrastColor : normalColor;
  },
};

/**
 * Skip link utilities
 */
export const skipLink = {
  /**
   * Create a skip link
   */
  create: (targetId: string, text: string = "Skip to main content") => {
    const link = document.createElement("a");
    link.href = `#${targetId}`;
    link.textContent = text;
    link.className =
      "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-cyan-500 focus:text-black focus:px-4 focus:py-2 focus:rounded-lg";
    return link;
  },
};

/**
 * Form accessibility helpers
 */
export const form = {
  /**
   * Generate error message attributes
   */
  error: (errorId: string, hasError: boolean) => ({
    "aria-invalid": String(hasError),
    "aria-errormessage": hasError ? errorId : undefined,
  }),

  /**
   * Generate required field attributes
   */
  required: (isRequired: boolean) => ({
    "aria-required": String(isRequired),
    required: isRequired,
  }),

  /**
   * Generate description attributes
   */
  description: (descriptionId: string) => ({
    "aria-describedby": descriptionId,
  }),
};

/**
 * Visual accessibility helpers
 */
export const visual = {
  /**
   * Check if user prefers light mode
   */
  prefersLightMode: () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  },

  /**
   * Get appropriate text color based on background
   */
  getTextColor: (bgColor: string) => {
    // Simple luminance calculation
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  },
};

/**
 * Add screen reader only class to global styles if not present
 */
export const initScreenReaderStyles = () => {
  if (typeof document === "undefined") return;

  const styleId = "eduai-screen-reader-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    .focus-visible:focus {
      outline: 2px solid #00F0FF;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
};
