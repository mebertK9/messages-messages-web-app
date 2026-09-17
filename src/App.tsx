import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const [authenticated, setAuthenticated] =
    useState(
      !!localStorage.getItem("accessToken")
    );

  return authenticated ? (
    <DashboardPage />
  ) :
    (
      <LoginPage
        onLogin={() =>
          setAuthenticated(true)
        }
      />
    );
}