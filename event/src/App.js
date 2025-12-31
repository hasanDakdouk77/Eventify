import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Categories from "./pages/Categories";
import More from "./pages/More";

import Events from "./pages/Events";
import { EventsProvider } from "./context/EventsContext";

import "./App.css";

const App = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("eventify-theme") || "light-theme"
  );

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("eventify-theme", theme);
  }, [theme]);

  return (
    <EventsProvider>
      <div className="app-layout">
        <Navbar theme={theme} setTheme={setTheme} />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/events" element={<Events />} />
           <Route path="/summary" element={<More />} />

          </Routes>
        </main>

        <Footer />
      </div>
    </EventsProvider>
  );
}

export default App;
