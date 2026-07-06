import { Routes, Route, Navigate } from "react-router-dom";

// All application routes live in the rebuilt src/ui/ tree.
import { HomeScreen }                from "./ui/components/screens/HomeScreen";
import { HeroSelectScreen }          from "./ui/components/screens/HeroSelectScreen";
import { HeroBookScreen }            from "./ui/components/screens/HeroBookScreen";
import { HeroDetailScreen }          from "./ui/components/screens/HeroDetailScreen";
import { HeroCustomizationScreen }   from "./ui/components/screens/HeroCustomizationScreen";
import { OnboardingFlow }            from "./ui/components/screens/OnboardingFlow";
import { MatchScreen }               from "./ui/components/screens/MatchScreen";
import { MatchSummary }              from "./ui/components/screens/MatchSummary";
import { SettingsScreen }            from "./ui/components/screens/SettingsScreen";
import { UIPreview }                 from "./ui/components/screens/UIPreview";
import { RouteTransition }           from "./ui/components/shared/RouteTransition";

export default function App() {
  return (
    <RouteTransition>
    <Routes>
      <Route path="/"                         element={<HomeScreen />} />
      <Route path="/heroes"                   element={<HeroSelectScreen />} />
      <Route path="/hero-book"                element={<HeroBookScreen />} />
      <Route path="/heroes/:heroId"           element={<HeroDetailScreen />} />
      <Route path="/heroes/:heroId/customize" element={<HeroCustomizationScreen />} />
      <Route path="/onboarding"               element={<OnboardingFlow />} />
      <Route path="/play"                     element={<MatchScreen />} />
      <Route path="/summary"                  element={<MatchSummary />} />
      <Route path="/settings"                 element={<SettingsScreen />} />
      <Route path="/ui-preview"               element={<UIPreview />} />
      <Route path="*"                         element={<Navigate to="/" replace />} />
    </Routes>
    </RouteTransition>
  );
}
