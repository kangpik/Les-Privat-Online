import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, BarChart2, Users, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { Tables } from "@/types/supabase";

interface ProjectCardProps {
  title: string;
  progress: number;
  team: Array<{ name: string; avatar: string }>;
  dueDate: string;
}

interface DashboardGridProps {
  projects?: ProjectCardProps[];
  isLoading?: boolean;
}

interface DashboardStats {
  totalStudents: number;
  todaySchedules: number;
  monthlyRevenue: number;
  recentStudents: Array<{
    id: string;
    name: string;
    subject: string;
    avatar: string;
    progress: number;
    nextSession: string;
  }>;
}

const ProjectCard = ({ title, progress, team, dueDate }: ProjectCardProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
          <BarChart2 className="h-4 w-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-900">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-gray-100 rounded-full"
              style={
                {
                  backgroundColor: "rgb(243, 244, 246)",
                } as React.CSSProperties
              }
            />
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Selesai {dueDate}</span>
            </div>
            <div className="flex -space-x-2">
              {team.map((member, i) => (
                <Avatar
                  key={i}
                  className="h-7 w-7 border-2 border-white shadow-sm"
                >
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardGrid = ({
  projects = [],
  isLoading = false,
}: DashboardGridProps) => {
  const [loading, setLoading] = useState(isLoading);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    todaySchedules: 0,
    monthlyRevenue: 0,
    recentStudents: [],
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Simulate loading for demo purposes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's tenant
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!tenantUser) {
        setLoading(false);
        return;
      }

      // Fetch total active students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("is_active", true);

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
      }

      // Fetch today's schedules
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );

      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select("*")
        .eq("tenant_id", tenantUser.tenant_id)
        .gte("start_time", todayStart.toISOString())
        .lt("start_time", todayEnd.toISOString());

      if (schedulesError) {
        console.error("Error fetching schedules:", schedulesError);
      }

      // Fetch monthly revenue (current month)
      const currentMonth = new Date();
      const monthStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const monthEnd = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("amount")
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("status", "paid")
        .gte("payment_date", monthStart.toISOString().split("T")[0])
        .lte("payment_date", monthEnd.toISOString().split("T")[0]);

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      // Calculate monthly revenue
      const monthlyRevenue =
        paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Transform students data for recent students display
      const recentStudents = (studentsData || [])
        .slice(0, 6)
        .map((student, index) => ({
          id: student.id,
          name: student.name,
          subject: student.subject || "Mata Pelajaran",
          avatar:
            student.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
          progress: Math.floor(Math.random() * 40) + 60, // Random progress between 60-100
          nextSession: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        }));

      setDashboardStats({
        totalStudents: studentsData?.length || 0,
        todaySchedules: schedulesData?.length || 0,
        monthlyRevenue,
        recentStudents,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm h-[220px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center p-6">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-blue-500/20 animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Memuat data siswa...
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Cards */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-900">
              Total Siswa Aktif
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">
              {dashboardStats.totalStudents}
            </div>
            <p className="text-sm text-gray-500 mt-1">Siswa aktif bulan ini</p>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-900">
              Jadwal Hari Ini
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">
              {dashboardStats.todaySchedules}
            </div>
            <p className="text-sm text-gray-500 mt-1">Sesi mengajar hari ini</p>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-900">
              Pendapatan Bulan Ini
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(dashboardStats.monthlyRevenue)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Pendapatan bulan ini</p>
          </CardContent>
        </Card>

        {/* Recent Students Cards */}
        {dashboardStats.recentStudents.map((student) => (
          <ProjectCard
            key={student.id}
            title={`${student.subject} - ${student.name}`}
            progress={student.progress}
            team={[{ name: student.name, avatar: student.avatar }]}
            dueDate={student.nextSession}
          />
        ))}

        {/* Show message if no students */}
        {!loading && dashboardStats.recentStudents.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm col-span-full">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-500">
                Belum ada data siswa. Tambahkan siswa untuk melihat aktivitas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardGrid;
