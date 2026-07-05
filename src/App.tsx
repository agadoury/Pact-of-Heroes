import { Routes, Route, Navigate } from "react-router-dom";
import MainMenu from "./components/screens/MainMenu";
import LegacyMatchScreen from "./components/screens/MatchScreen";
import HeroSelect from "./components/screens/HeroSelect";
import DeckSelect from "./components/screens/DeckSelect";
import DeckBuilder from "./components/screens/DeckBuilder";
import LoadoutSelect from "./components/screens/LoadoutSelect";
import LoadoutBuilder from "./components/screens/LoadoutBuilder";
import HowToPlay from "./components/screens/HowToPlay";
import LegacySettings from "./components/screens/Settings";
import DevTokens from "./components/screens/DevTokens";
import DevComponents from "./components/screens/DevComponents";
import { Choreographer } from "./components/effects/Choreographer";

// New UI (src/ui/) — greenfield rebuild
import { UIPreview } from "./ui/components/screens/UIPreview";
import { HomeScreen } from "./ui/components/screens/HomeScreen";
import { HeroSelectScreen } from "./ui/components/screens/HeroSelectScreen";
import { MatchScreen } from "./ui/components/screens/MatchScreen";
import { MatchSummary } from "./ui/components/screens/MatchSummary";
import { SettingsScreen } from "./ui/components/screens/SettingsScreen";

export default function App() {
  return (
    <Choreographer>
      <Routes>
        {/* New UI (v0.2 rebuild) — primary routes */}
        <Route path="/"               element={<HomeScreen />} />
        <Route path="/heroes"         element={<HeroSelectScreen />} />
        <Route path="/play"           element={<MatchScreen />} />
        <Route path="/summary"        element={<MatchSummary />} />
        <Route path="/settings"       element={<SettingsScreen />} />
        <Route path="/ui-preview"     element={<UIPreview />} />

        {/* Legacy screens retained under /legacy while the rebuild
            reaches parity for meta surfaces (HeroBook, HeroCustomize,
            deck builder, etc.). To be deleted in M6 cleanup. */}
        <Route path="/legacy"          element={<MainMenu />} />
        <Route path="/legacy/play"     element={<LegacyMatchScreen />} />
        <Route path="/legacy/heroes"   element={<HeroSelect />} />
        <Route path="/legacy/settings" element={<LegacySettings />} />
        <Route path="/decks"          element={<DeckSelect />} />
        <Route path="/deck-builder"   element={<DeckBuilder />} />
        <Route path="/loadouts"       element={<LoadoutSelect />} />
        <Route path="/loadout"        element={<LoadoutBuilder />} />
        <Route path="/how-to-play"    element={<HowToPlay />} />
        <Route path="/dev/tokens"     element={<DevTokens />} />
        <Route path="/dev/components" element={<DevComponents />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Choreographer>
  );
}
