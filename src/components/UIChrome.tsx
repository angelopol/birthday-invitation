"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

interface UIChromeProps {
  children: ReactNode;
}

export default function UIChrome({ children }: UIChromeProps) {
  return (
    <SessionProviderWrapper>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--theme-tertiary, #020617)",
              color: "var(--theme-text, #e5e7eb)",
              border: "1px solid var(--theme-secondary, #1e293b)",
              fontFamily: "var(--theme-font-family, var(--font-geist-sans))",
              fontSize: "var(--theme-font-size, 14px)",
            },
          }}
        />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
