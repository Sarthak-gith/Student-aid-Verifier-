import { useState } from "react";
import StudentPortal from "./components/StudentPortal";
import VerifierDashboard from "./components/VerifierDashboard";

type TabId = "student" | "verifier";

type Tab = {
  id: TabId;
  label: string;
};

const tabs: Tab[] = [
  { id: "student", label: "Student Portal" },
  { id: "verifier", label: "Verifier Dashboard" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("student");

  return (
    <main className="min-h-screen bg-academic-paper">
      <header className="border-b border-academic-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-academic-navy">
              Academic Aid Office
            </p>
            <h1 className="mt-2 text-3xl font-bold text-academic-ink">
              Scholarship & Aid Distribution Verifier System
            </h1>
          </div>

          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded border px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-academic-navy bg-academic-navy text-white"
                    : "border-academic-line bg-white text-academic-ink hover:border-academic-navy"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "student" ? <StudentPortal /> : <VerifierDashboard />}
      </div>
    </main>
  );
}
