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
              background: "#020617",
              color: "#e5e7eb",
              border: "1px solid #1e293b",
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
