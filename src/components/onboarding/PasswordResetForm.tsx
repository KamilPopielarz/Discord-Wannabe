import React, { useState } from "react";
import type { PasswordResetRequestCommand } from "../../types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetRequestCommand) => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      email,
      captchaToken: captchaToken || "demo-captcha-token",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="captcha" className="block text-sm font-medium">
          Token CAPTCHA
        </label>
        <Input
          id="captcha"
          placeholder="demo-captcha-token"
          value={captchaToken}
          onChange={(event) => setCaptchaToken(event.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Możesz zostawić wartość domyślną, jeśli backend przyjmuje testowe tokeny.
        </p>
      </div>
      <Button type="submit" className="w-full">
        Wyślij link resetujący
      </Button>
    </form>
  );
};

export default PasswordResetForm;

