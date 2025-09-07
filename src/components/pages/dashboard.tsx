import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import ScheduleCalendar from "../dashboard/ScheduleCalendar";
import PaymentManagement from "../dashboard/PaymentManagement";
import LearningMaterials from "../dashboard/LearningMaterials";
import StudentsManagement from "../dashboard/StudentsManagement";
import ReportsAnalytics from "../dashboard/ReportsAnalytics";
import Settings from "../dashboard/Settings";
import HelpSupport from "../dashboard/HelpSupport";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const scheduleCalendarRef = useRef<{ refreshSchedule: () => void } | null>(
    null,
  );

  // Function to trigger loading state for demonstration
  const handleRefresh = () => {
    setLoading(true);
    // Trigger schedule refresh if on schedule page
    if (activeItem === "Jadwal" && scheduleCalendarRef.current) {
      scheduleCalendarRef.current.refreshSchedule();
    }
    // Reset loading after 2 seconds
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  // Function to refresh schedule data from other components
  const handleScheduleRefresh = () => {
    setScheduleRefreshTrigger((prev) => prev + 1);
    if (scheduleCalendarRef.current) {
      scheduleCalendarRef.current.refreshSchedule();
    }
  };

  // Handle sidebar navigation
  const handleSidebarItemClick = (label: string) => {
    setActiveItem(label);

    // Navigate based on the selected item
    switch (label) {
      case "Home":
        navigate("/");
        break;
      case "Dashboard":
        // Already on dashboard, just update active state
        break;
      case "Jadwal":
        // TODO: Navigate to schedule page when implemented
        console.log("Schedule page not yet implemented");
        break;
      case "Pembayaran":
        // TODO: Navigate to payment page when implemented
        console.log("Payment page not yet implemented");
        break;
      case "Materi":
        // TODO: Navigate to materials page when implemented
        console.log("Materials page not yet implemented");
        break;
      case "Siswa":
        // Students management is now implemented
        break;
      case "Laporan":
        // Reports and analytics is now implemented
        break;
      case "Pengaturan":
        // Settings page is now implemented
        break;
      case "Bantuan":
        // Help and support page is now implemented
        break;
      default:
        console.log(`Navigation for ${label} not implemented yet`);
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case "Dashboard":
        return <DashboardGrid isLoading={loading} />;
      case "Jadwal":
        return (
          <ScheduleCalendar
            ref={scheduleCalendarRef}
            refreshTrigger={scheduleRefreshTrigger}
          />
        );
      case "Pembayaran":
        return <PaymentManagement />;
      case "Materi":
        return <LearningMaterials />;
      case "Siswa":
        return <StudentsManagement onScheduleAdded={handleScheduleRefresh} />;
      case "Laporan":
        return <ReportsAnalytics />;
      case "Pengaturan":
        return <Settings />;
      case "Bantuan":
        return <HelpSupport />;
      default:
        return <DashboardGrid isLoading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem={activeItem} onItemClick={handleSidebarItemClick} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 pt-4 pb-2 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeItem === "Dashboard" ? "Dashboard Aktivitas" : activeItem}
            </h1>
            <Button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Memuat..." : "Perbarui"}
            </Button>
          </div>
          <div
            className={cn(
              "container mx-auto p-6",
              "transition-all duration-300 ease-in-out",
            )}
          >
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
