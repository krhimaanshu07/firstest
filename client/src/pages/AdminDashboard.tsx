import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminTabs from "@/components/AdminTabs";
import QuestionManagement from "@/components/QuestionManagement";
import StudentManagement from "@/components/StudentManagement";
import ResultsManagement from "@/components/ResultsManagement";
import { Button } from "@/components/ui/button";

type TabType = "questions" | "students" | "results";

export default function AdminDashboard() {
  const { logout } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("questions");

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-neutral-800">Admin Dashboard</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      {/* Admin Tabs */}
      <div className="p-6">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "questions" && <QuestionManagement />}
          {activeTab === "students" && <StudentManagement />}
          {activeTab === "results" && <ResultsManagement />}
        </div>
      </div>
    </div>
  );
}
