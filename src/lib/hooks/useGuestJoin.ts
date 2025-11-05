import { useState } from "react";
import type { CreateGuestSessionCommand } from "../../types";
import type { GuestJoinViewModel } from "../../types/viewModels";

export function useGuestJoin() {
  const [state, setState] = useState<GuestJoinViewModel>({
    inviteLink: "",
    loading: false,
    error: undefined,
    guestNick: undefined,
  });

  const updateInviteLink = (inviteLink: string) => {
    setState((prev) => ({
      ...prev,
      inviteLink,
      error: undefined, // Clear error when user types
    }));
  };

  const validateInviteLink = (link: string): string | null => {
    if (!link.trim()) {
      return "Link zaproszeniowy jest wymagany";
    }

    // Basic invite link format validation
    // Assuming format like: /servers/abc123 or /rooms/def456
    const inviteLinkRegex = /^\/(servers|rooms)\/[a-zA-Z0-9_-]+$/;
    if (!inviteLinkRegex.test(link)) {
      return "Nieprawidłowy format linku zaproszeniowego";
    }

    return null;
  };

  const joinAsGuest = async (inviteLink: string) => {
    // Early return for validation
    const validationError = validateInviteLink(inviteLink);
    if (validationError) {
      setState((prev) => ({
        ...prev,
        error: validationError,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      const payload: CreateGuestSessionCommand = {
        serverInviteLink: inviteLink,
      };

      const response = await fetch("/api/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas dołączania jako gość";

        switch (response.status) {
          case 404:
            errorMessage = "Nie znaleziono serwera lub pokoju o podanym linku";
            break;
          case 400:
            errorMessage = "Nieprawidłowy link zaproszeniowy";
            break;
          case 429:
            errorMessage = "Za dużo prób dołączenia. Spróbuj ponownie później";
            break;
          case 403:
            errorMessage = "Brak dostępu do tego serwera lub pokoju";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return;
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        loading: false,
        error: undefined,
        guestNick: data.guestNick,
      }));

      // Success - redirect to the appropriate page based on invite link
      if (typeof window !== "undefined") {
        if (inviteLink.startsWith("/servers/")) {
          window.location.href = inviteLink;
        } else if (inviteLink.startsWith("/rooms/")) {
          window.location.href = `${inviteLink}?view=chat`;
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  return {
    state,
    updateInviteLink,
    joinAsGuest,
    validateInviteLink,
  };
}
