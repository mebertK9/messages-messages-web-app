import { FormEvent, useState } from "react";
import { UserRound } from "lucide-react";
import { updateMe } from "../services/auth";

export default function MyAccountForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function reset() {
    setEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const wantsEmailChange = email.trim().length > 0;
    const wantsPasswordChange = newPassword.length > 0;

    if (!wantsEmailChange && !wantsPasswordChange) {
      setError("Bitte E-Mail und/oder neues Passwort ausfüllen.");
      return;
    }
    if (wantsPasswordChange && !currentPassword) {
      setError("Zum Ändern des Passworts wird das aktuelle Passwort benötigt.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateMe({
        email: wantsEmailChange ? email.trim() : undefined,
        currentPassword: wantsPasswordChange ? currentPassword : undefined,
        newPassword: wantsPasswordChange ? newPassword : undefined
      });
      setConfirmation(
        updated.email ? `Gespeichert. E-Mail: ${updated.email}` : "Gespeichert."
      );
      reset();
      setOpen(false);
    } catch {
      setError("Änderung fehlgeschlagen (falsches aktuelles Passwort oder E-Mail schon vergeben).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="my-account-container">
      {!open && (
        <button
          className="my-account-link icon-button"
          aria-label="Eigene Account-Daten öffnen"
          title="Eigene Account-Daten"
          onClick={() => {
            setOpen(true);
            setConfirmation("");
          }}
        >
          <UserRound className="dashboard-icon" aria-hidden="true" />
        </button>
      )}

      {open && (
        <form className="my-account-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Neue E-Mail-Adresse (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Neues Passwort (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
          />
          {newPassword.length > 0 && (
            <input
              type="password"
              placeholder="Aktuelles Passwort"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          )}
          <button type="submit" disabled={saving}>
            {saving ? "..." : "Speichern"}
          </button>
          <button
            type="button"
            className="my-account-cancel"
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Abbrechen
          </button>
        </form>
      )}

      {error && <div className="error">{error}</div>}
      {confirmation && <p className="my-account-confirmation">{confirmation}</p>}
    </div>
  );
}