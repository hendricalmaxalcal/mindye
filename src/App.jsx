import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Receiving from "./pages/Receiving";
import SalesHistory from "./pages/SalesHistory";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import "./App.css";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Everything below needs a login and shows inside the Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route
          path="/sales"
          element={
            <RoleRoute allow={["admin", "saler"]}>
              <Sales />
            </RoleRoute>
          }
        />
        <Route
          path="/receiving"
          element={
            <RoleRoute allow={["admin", "saler"]}>
              <Receiving />
            </RoleRoute>
          }
        />
        <Route
          path="/history"
          element={
            <RoleRoute allow={["admin"]}>
              <SalesHistory />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute allow={["admin"]}>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <RoleRoute allow={["admin"]}>
              <Staff />
            </RoleRoute>
          }
        />
      </Route>

      {/* Unknown address: go home (or to login if not signed in) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}