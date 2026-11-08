import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { authApi } from "../auth/api";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { settingsApi } from "./api";

import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  LoaderCircle,
  LogOut,
  Settings2,
} from "lucide-react";
import { Button } from "../../shared/ui/Button";
import { Empty } from "../../shared/ui/Empty";

export function SettingsPage() {
  const { data, refresh } = useWorkspace();
  const { auth, toast } = useOverlays();
  const [name, setName] = useState(data.user?.name || ""),
    [goal, setGoal] = useState(data.user?.goal || 5),
    [timezone, setTimezone] = useState(
      data.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await settingsApi.save({ name, goal, timezone });
      await refresh();
      toast("Your workspace settings are saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await authApi.logout();
      await refresh();
      navigate("/");
      toast("You’re signed out. Your progress is safe.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE ROOM FOR YOUR CURIOSITY</div>
          <h1>Your workspace, your pace.</h1>
          <p>A few details to make your learning feel like yours.</p>
        </div>
      </div>
      {data.user ? (
        <div className="settings-panel">
          <form onSubmit={save}>
            <div className="settings-section">
              <h2>Profile & practice</h2>
              <p>Your daily activity follows your selected time zone.</p>
              <label>
                Display name
                <input
                  required
                  minLength={2}
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Email address
                <input disabled value={data.user.email} />
              </label>
              <div className="settings-fields">
                <label>
                  Daily question goal
                  <input
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                  />
                </label>
                <label>
                  Time zone
                  <input
                    required
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Europe/Paris"
                    list="timezones"
                  />
                  <datalist id="timezones">
                    {[
                      "UTC",
                      "Europe/Paris",
                      "Europe/London",
                      "America/New_York",
                      "America/Chicago",
                      "America/Los_Angeles",
                      "Asia/Tokyo",
                      "Asia/Singapore",
                      "Asia/Kolkata",
                      "Australia/Sydney",
                    ].map((z) => (
                      <option value={z} key={z} />
                    ))}
                  </datalist>
                </label>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <>
                    Save settings <Check size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
          <div className="settings-section export-section">
            <h2>Your learning belongs to you.</h2>
            <p>
              Download your profile, question progress, and complete answer
              history as JSON.
            </p>
            <a className="button secondary" href="/api/export" download>
              <ArrowDownToLine size={16} />
              Export my progress
            </a>
          </div>
          <div className="settings-section">
            <button className="logout-button" onClick={logout}>
              <LogOut size={16} />
              Sign out of this workspace
            </button>
          </div>
        </div>
      ) : (
        <Empty
          icon={Settings2}
          title="A workspace with your name on it."
          description="Create an account to set a daily goal and keep your learning history."
          action={
            <Button onClick={auth}>
              Sign in or create account <ArrowRight size={16} />
            </Button>
          }
        />
      )}
    </>
  );
}
