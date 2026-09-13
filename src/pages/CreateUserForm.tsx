import { FormEvent, useState } from "react";
import { registerUser } from "../services/auth";

export default function CreateUserForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      // The response's accessToken belongs to the newly created user, not
      // to whoever is filling out this form - it's intentionally ignored
      // here so the current session stays logged in as-is.
      const { user } = await registerUser({
        name,
        password,
        // Email is optional - only send it if actually filled in, so an
        // empty string doesn't collide with someone else's empty email.
        email: email.trim() ? email.trim() : undefined
      });
      setConfirmation(`${user.name} wurde angelegt.`);
      reset();
      setOpen(false);
    } catch {
      setError("Nutzer konnte nicht angelegt werden (Name/E-Mail evtl. schon vergeben).");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="create-user-container">
      {!open && (
        <button
          className="create-user-button"
          onClick={() => {
            setOpen(true);
            setConfirmation("");
          }}
        >
          + Nutzer anlegen
        </button>
      )}

      {open && (
        <form className="create-user-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <input
            type="email"
            placeholder="E-Mail (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button type="submit" disabled={creating}>
            {creating ? "..." : "Anlegen"}
          </button>
          <button
            type="button"
            className="create-user-cancel"
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
      {confirmation && <p className="create-user-confirmation">{confirmation}</p>}
    </div>
  );
}
