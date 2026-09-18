import { useState } from "react";
import ComplaintIntakeScreen from "./components/ComplaintIntakeScreen.jsx";
import ComplaintsListScreen from "./components/ComplaintsListScreen.jsx";

export default function App() {
  const [tab, setTab] = useState("new");

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand">
          <span className="app-brand-mark">Rx</span>
          <span>PharmaQMS &middot; Complaint Management</span>
        </div>
        <nav className="app-nav">
          <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}>
            Log Complaint
          </button>
          <button className={tab === "list" ? "active" : ""} onClick={() => setTab("list")}>
            All Complaints
          </button>
        </nav>
      </header>

      <main className="app-body">
        {tab === "new" ? (
          <ComplaintIntakeScreen onSaved={() => setTab("list")} />
        ) : (
          <ComplaintsListScreen />
        )}
      </main>
    </div>
  );
}
