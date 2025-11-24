"use client";

import { useEffect, useState } from "react";
import InvitationRenderer, { InvitationScreenData } from "@/components/InvitationRenderer";
import GalleryClient, { GalleryItem } from "@/app/[username]/GalleryClient";
import PlaylistClient from "@/app/[username]/PlaylistClient";
import ConfirmButton from "@/app/[username]/ConfirmButton";

type ActiveModal = "gallery" | "playlist" | "rsvp" | null;

interface InvitationRendererWrapperProps {
  screens: InvitationScreenData[];
  galleryItems: GalleryItem[];
  guestToken?: string | null;
  guestName?: string | null;
  username: string;
  spotifyPlaylistId?: string | null;
  primaryColor: string;
}

export default function InvitationRendererWrapper({
  screens,
  galleryItems,
  guestToken,
  guestName,
  username,
  spotifyPlaylistId,
  primaryColor,
}: InvitationRendererWrapperProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [galleryItemsState, setGalleryItemsState] = useState(galleryItems);

  useEffect(() => {
    setGalleryItemsState(galleryItems);
  }, [galleryItems]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (activeModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [activeModal]);

  useEffect(() => {
    if (!activeModal) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeModal]);

  const closeModal = () => setActiveModal(null);

  const modalTitles: Record<Exclude<ActiveModal, null>, string> = {
    gallery: "Galería de la fiesta",
    playlist: "Playlist colaborativa",
    rsvp: "Confirma tu asistencia",
  };

  const renderModalContent = () => {
    if (activeModal === "gallery") {
      return (
        <GalleryClient
          initialItems={galleryItemsState}
          token={guestToken ?? undefined}
          className="pt-0 border-0"
          onItemsAdded={(uploaded) =>
            setGalleryItemsState((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const fresh = uploaded.filter((item) => !existingIds.has(item.id));
              return [...fresh, ...prev];
            })
          }
        />
      );
    }

    if (activeModal === "playlist") {
      return (
        <PlaylistClient
          username={username}
          invitation={guestToken ?? undefined}
          spotifyPlaylistId={spotifyPlaylistId}
          className="mt-0"
        />
      );
    }

    if (activeModal === "rsvp") {
      return guestToken ? (
        <ConfirmButton
          token={guestToken}
          primaryColor={primaryColor}
          className="border-0 mt-0 pt-0"
        />
      ) : (
        <p className="text-sm text-theme-muted">
          Comparte tu enlace personal de invitado para confirmar asistencia desde aquí.
        </p>
      );
    }

    return null;
  };

  return (
    <>
      <InvitationRenderer
        screens={screens}
        onOpenGallery={() => setActiveModal("gallery")}
        onOpenPlaylist={() => setActiveModal("playlist")}
        onOpenRsvp={() => setActiveModal("rsvp")}
        guestName={guestName}
      />

      {activeModal && (() => {
        const modalTitle = modalTitles[activeModal];
        return (
          <div
          className="invitation-modal"
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
          onClick={closeModal}
        >
          <div
            className="invitation-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="invitation-modal__header">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-theme-muted">Explora</p>
                <h3 className="text-xl font-semibold text-theme-base">{modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="invitation-modal__close"
              >
                Cerrar
              </button>
            </div>
            <div className="invitation-modal__body">{renderModalContent()}</div>
          </div>
          </div>
        );
      })()}
    </>
  );
}
