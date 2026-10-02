import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LowStockAlert from "../components/LowStockAlert";
import BackupReminder from "../components/BackupReminder";
import "../css/Dashboard.css";

const SHORTCUTS = [
  {
    to: "/sales",
    title: "Sales",
    text: "Scan products and complete a sale",
    roles: ["admin", "saler"],
  },
  {
    to: "/receiving",
    title: "Receiving",
    text: "Scan incoming packages into stock",
    roles: ["admin", "saler"],
  },
  {
    to: "/products",
    title: "Products",
    text: "View and search products",
    roles: ["admin", "saler"],
  },
  {
    to: "/history",
    title: "Sales history",
    text: "Look back at past sales",
    roles: ["admin"],
  },
  {
    to: "/stock-log",
    title: "Stock log",
    text: "Deliveries and stock adjustments",
    roles: ["admin"],
  },
  {
    to: "/reports",
    title: "Reports",
    text: "Daily totals and best sellers",
    roles: ["admin"],
  },
  {
    to: "/backup",
    title: "Backup and export",
    text: "Download your data safely",
    roles: ["admin"],
  },
  {
    to: "/staff",
    title: "Staff",
    text: "Create and manage saler accounts",
    roles: ["admin"],
  },
];

export default function Dashboard() {
  const { profile, role } = useAuth();

  return (
    <div>
      <h1 className="dash-welcome">Welcome, {profile?.name}</h1>
      <p className="dash-role">{role}</p>

      {role === "admin" && <LowStockAlert />}
      {role === "admin" && <BackupReminder />}

      <div className="dash-grid">
        {SHORTCUTS.filter((s) => s.roles.includes(role)).map((s) => (
          <Link key={s.to} to={s.to} className="dash-card">
            <h2 className="dash-card-title">{s.title}</h2>
            <p className="dash-card-text">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}