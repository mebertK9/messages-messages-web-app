import { FormEvent, useState } from "react";
import { login } from "../services/auth";

interface Props {
  onLogin: () => void;
  }

  export default function LoginPage({ onLogin }: Props) {
    const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
        const [loading, setLoading] = useState(false);
          const [error, setError] = useState("");

            async function handleSubmit(e: FormEvent) {
                e.preventDefault();

                    setError("");
                        setLoading(true);

                            try {
                                  const result = await login({
                                          email,
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
                                                                                                                                                                    <h1>Household Wishlist</h1>

                                                                                                                                                                            <input
                                                                                                                                                                                      type="email"
                                                                                                                                                                                                placeholder="E-Mail"
                                                                                                                                                                                                          value={email}
                                                                                                                                                                                                                    onChange={(e) =>
                                                                                                                                                                                                                                setEmail(e.target.value)
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                    required
                                                                                                                                                                                                                                                            />

                                                                                                                                                                                                                                                                    <input
                                                                                                                                                                                                                                                                              type="password"
                                                                                                                                                                                                                                                                                        placeholder="Passwort"
                                                                                                                                                                                                                                                                                                  value={password}
                                                                                                                                                                                                                                                                                                            onChange={(e) =>
                                                                                                                                                                                                                                                                                                                        setPassword(e.target.value)
                                                                                                                                                                                                                                                                                                                                  }
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