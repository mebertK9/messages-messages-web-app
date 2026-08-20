import { LoginRequest, LoginResponse } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(
  payload: LoginRequest
  ): Promise<LoginResponse> {
    const response = await fetch(
        `${API_URL}/v1/auth/login`,
            {
                  method: "POST",
                        headers: {
                                "Content-Type": "application/json"
                                      },
                                            body: JSON.stringify(payload)
                                                }
                                                  );

                                                    if (!response.ok) {
                                                        throw new Error("Login fehlgeschlagen");
                                                          }

                                                            return response.json();
                                                            }