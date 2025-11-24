"use client";

import { useEffect } from "react";

export default function InvitationThemeActivator() {
  useEffect(() => {
    document.body.classList.add("invitation-active");
    return () => {
      document.body.classList.remove("invitation-active");
    };
  }, []);

  return null;
}
