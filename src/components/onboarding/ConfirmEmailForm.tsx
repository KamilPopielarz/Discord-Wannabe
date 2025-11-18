import React, { useState } from "react";
import type { ConfirmEmailCommand } from "../../types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface ConfirmEmailFormProps {
  onSubmit: (data: ConfirmEmailCommand) => void;
}

const ConfirmEmailForm: React.FC<ConfirmEmailFormProps> = ({ onSubmit }) => {
  const [token, setToken] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ token });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="token" className="block text-sm font-medium">
          Kod potwierdzający
        </label>
        <Input
          id="token"
          placeholder="Wklej kod z e-maila"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Potwierdź e-mail
      </Button>
    </form>
  );
};

export default ConfirmEmailForm;

