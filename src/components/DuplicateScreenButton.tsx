"use client";

import React from "react";

type Props = {
  formId: string;
  label?: string;
  className?: string;
};

export default function DuplicateScreenButton({ formId, label = "Duplicar pantalla", className }: Props) {
  function handleClick() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.submit();
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
