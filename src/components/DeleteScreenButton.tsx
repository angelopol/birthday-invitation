"use client";

import React from "react";

type Props = {
  formId: string;
  label?: string;
  className?: string;
};

export default function DeleteScreenButton({ formId, label = "Eliminar pantalla", className }: Props) {
  function handleClick() {
    const confirmed = confirm("¿Eliminar esta pantalla? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    // Use requestSubmit so browser validation and server actions run as expected
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
