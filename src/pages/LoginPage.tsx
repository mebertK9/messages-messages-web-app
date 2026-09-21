import { FormEvent, useState } from "react";
import { login } from "../services/auth";

interface Props {
        onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
        const [name, setName] = useState("");
        const [password, setPassword] = useState("");
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState("");

        async function handleSubmit(e: FormEvent) {
                e.preventDefault();

                setError("");
                setLoading(true);

                try {
                        const result = await login({
                                name,
                                password
                        });

                        localStorage.setItem(
                                "accessToken",
                                result.accessToken
                        );

                        localStorage.setItem(
                                "currentUser",
                                JSON.stringify(result.user)
                        );

                        onLogin();
                } catch {
                        setError("Ungültige Zugangsdaten");
                } finally {
                        setLoading(false);
                }
        }

        return (
                <div className="container">
                        <form className="card" onSubmit={handleSubmit}>
                                <h1>Mein Wunsch - Dein Kauf</h1>

                                <input
                                        type="text"
                                        placeholder="Name"
                                        value={name}
                                        onChange={(e) =>
                                                setName(e.target.value)
                                        }
                                        autoComplete="username"
                                        required
                                />

                                <input
                                        type="password"
                                        placeholder="Passwort"
                                        value={password}
                                        onChange={(e) =>
                                                setPassword(e.target.value)
                                        }
                                        autoComplete="current-password"
                                        required
                                />

                                {error && (
                                        <div className="error">
                                                {error}
                                        </div>
                                )}

                                <button
                                        type="submit"
                                        disabled={loading}
                                >
                                        {loading
                                                ? "Anmelden..."
                                                : "Anmelden"}
                                </button>
                        </form>
                </div>
        );
}
