import { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import WishlistLoader from "./pages/WishlistLoader";

export default function App() {
  const [authenticated] =
    useState(
      !!localStorage.getItem("accessToken")
    );

  return authenticated ? (
    <DashboardPage />
  ) :
    (
      <WishlistLoader />
    );
}