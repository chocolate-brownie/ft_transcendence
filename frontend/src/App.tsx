import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GridBackground from "./components/GridBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import GameLobby from "./pages/GameLobby";
import Game from "./pages/Game";
import Tournaments from "./pages/Tournaments";
import Leaderboard from "./pages/Leaderboard";
import { ChatWidget } from "./components/Chat/ChatWidget";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function HomeLayout() {
  return (
    <div className="relative min-h-screen flex flex-col bg-pong-background overflow-hidden">
      <GridBackground />
      <Navbar />
      <main className="relative flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function Layout() {
  return (
    <div className="relative min-h-screen flex flex-col bg-pong-background overflow-hidden">
      <GridBackground />
      {/* Background watermark logo */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-[200px] h-[200px] object-contain opacity-10 pointer-events-none select-none"
      />
      <Navbar />
      <main className="relative flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<HomeLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Protected routes — redirect to /login if not authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/game" element={<GameLobby />} />
            <Route path="/game/:id" element={<Game />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
