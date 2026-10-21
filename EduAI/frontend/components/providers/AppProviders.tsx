"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
