
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navbar.css";

const Navbar = () => {
  const [theme, setTheme] = useState("dark-theme");
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav className="nav-wrapper">
      <div className="nav-inner">

        <div className="nav-left">
          <span className="nav-logo">Eventify</span>
        </div>

        <button
          className={`hamburger ${open ? "hamb-open" : ""}`}
          onClick={() => setOpen(!open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${open ? "show" : ""}`}>
          <li>
            <Link
              to="/"
              className={location.pathname === "/" ? "nav-link-active" : ""}
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              to="/categories"
              className={
                location.pathname === "/categories" ? "nav-link-active" : ""
              }
            >
              Categories
            </Link>
          </li>

          <li>
            <Link
              to="/events"
              className={location.pathname === "/events" ? "nav-link-active" : ""}
            >
              My Events
            </Link>
          </li>

          <li>
            <Link
              to="/summary"
              className={location.pathname === "/summary" ? "nav-link-active" : ""}
            >
              Summary
            </Link>
          </li>

          <li className="theme-li">
            <button
              className="theme-btn"
              onClick={() =>
                setTheme((prev) =>
                  prev === "dark-theme" ? "light-theme" : "dark-theme"
                )
              }
            >
              {theme === "dark-theme" ? "🌙" : "☀️"}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
