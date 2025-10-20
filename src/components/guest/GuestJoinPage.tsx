import React from "react";
import { GuestJoinForm } from "./GuestJoinForm";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useGuestJoin } from "../../lib/hooks/useGuestJoin";

export function GuestJoinPage() {
  const { state, updateInviteLink, joinAsGuest } = useGuestJoin();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <GuestJoinForm
          onSubmit={joinAsGuest}
          loading={state.loading}
          error={state.error}
          inviteLink={state.inviteLink}
          onInviteLinkChange={updateInviteLink}
          guestNick={state.guestNick}
        />
      </div>
    </div>
  );
}
