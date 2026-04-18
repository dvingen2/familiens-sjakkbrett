import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { GamesPage } from "./pages/GamesPage";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/laer" element={<LearnPage />} />
        <Route path="/mine-spill" element={<GamesPage />} />
        <Route path="/spill/:gameId" element={<GamePage />} />
        <Route path="/logg-inn" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
