import type { FormEvent } from "react";
import { useState } from "react";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { authApi } from "./api";

import { ArrowRight, Layers3, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "../../shared/ui/Button";
import { Logo } from "../../shared/ui/Logo";
import { Modal } from "../../shared/ui/Modal";

export function AuthModal({ close }: { close: () => void }) {
  const { refresh } = useWorkspace();
  const { toast } = useOverlays();
  const [mode, setMode] = useState<"login" | "register">("register"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.authenticate(
        mode,
        mode === "register"
          ? {
              name,
              email,
              password,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }
          : { email, password },
      );
      await refresh();
      close();
      toast(
        mode === "register"
          ? "Your workspace is ready. Stay curious."
          : "Welcome back. Let’s go a little deeper.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close} className="auth-modal">
      <Logo />
      <div className="auth-graphic">
        <Layers3 size={38} strokeWidth={1} />
        <span>ONE LAYER DEEPER.</span>
      </div>
      <h2>
        {mode === "register"
          ? "Your curiosity deserves a home."
          : "Good to see you again."}
      </h2>
      <p>
        {mode === "register"
          ? "Save your progress. Build your mental models. Keep the interesting questions close."
          : "Pick up your questions, your progress, and your next layer of understanding."}
      </p>
      <div className="auth-tabs">
        <button
          className={mode === "register" ? "active" : ""}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Create account
        </button>
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Sign in
        </button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && (
          <label>
            Your name
            <input
              required
              minLength={2}
              maxLength={40}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?"
            />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={mode === "register" ? 10 : 1}
            maxLength={72}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              mode === "register" ? "At least 10 characters" : "Your password"
            }
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <>
              {mode === "register"
                ? "Create my workspace"
                : "Sign in to my workspace"}
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>
      <div className="auth-foot">
        <ShieldCheck size={14} />
        Your progress stays in this workspace.
      </div>
    </Modal>
  );
}
