import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STORE } from "../config/store";
import OfflineBanner from "./OfflineBanner";
import "../css/Layout.css";

const MENU = [
  { to: "/", label: "Home", roles: ["admin", "saler"], end: true },
  { to: "/sales", label: "Sales", roles: ["admin", "saler"] },
  { to: "/receiving", label: "Receiving", roles: ["admin", "saler"] },
  { to: "/products", label: "Products", roles: ["admin", "saler"] },
  { to: "/history", label: "History", roles: ["admin"] },
  { to: "/stock-log", label: "Stock log", roles: ["admin"] },
  { to: "/reports", label: "Reports", roles: ["admin"] },
  { to: "/staff", label: "Staff", roles: ["admin"] },
  { to: "/backup", label: "Backup", roles: ["admin"] },
];

export default function Layout() {
  const { profile, role, logout } = useAuth();
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div>
      <header className="layout-header">
        <Link to="/" className="layout-brandbox">
          {!logoFailed && (
            <img
              src={STORE.logo}
              alt=""
              className="layout-logo"
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="layout-brand">{STORE.name}</span>
        </Link>

        <nav className="layout-nav">
          {MENU.filter((m) => m.roles.includes(role)).map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <div className="layout-user">
          <span>
            {profile?.name} ({role})
          </span>
          <button onClick={logout} className="layout-logout">
            Logout
          </button>
        </div>
      </header>

      <OfflineBanner />

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}