import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";
import "./ui/theme/index.css";
import { migrateLegacyStorage } from "./lib/migrate-storage";
import { wireMatchPersistence } from "./ui/store/matchPersistence";
import "./ui/util/ambientMusic";

// One-shot localStorage migration from the previous `diceborn:*` namespace
// to `pact-of-heroes:*`. Must run before any module reads its own storage.
migrateLegacyStorage();

// Audio-context unlock: iOS Safari requires a user gesture before audio plays.
// We listen once, globally, and let the audio manager (Step 4) hook in.
function installAudioUnlock() {
  const unlock = () => {
    window.dispatchEvent(new CustomEvent("pact-of-heroes:audio-unlock"));
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown",     unlock, { once: true });
}
installAudioUnlock();
wireMatchPersistence();

// Dev-only debug handle — lets automated playtests and the console inspect
// live store state. Stripped from production builds by the DEV guard.
if (import.meta.env.DEV) {
  void Promise.all([
    import("./store/gameStore"),
    import("./ui/store/uiStore"),
  ]).then(([g, u]) => {
    (window as unknown as Record<string, unknown>).__poh = {
      game: g.useGameStore,
      ui: u.useUIStore,
    };
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
