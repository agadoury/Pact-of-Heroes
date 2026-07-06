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

// Debug handle — lets automated playtests and the console inspect live
// store state. Available in dev, and in production builds ONLY when built
// with VITE_E2E=1 (CI playtests of the real bundle).
if (import.meta.env.DEV || import.meta.env.VITE_E2E === '1') {
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
