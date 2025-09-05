import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Download,
  FileText,
  Clock,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";

interface ReportData {
  totalStudents: number;
  totalRevenue: number;
  totalSessions: number;
  averageSessionDuration: number;
  monthlyGrowth: number;
  revenueGrowth: number;
  topSubjects: Array<{ subject: string; count: number; revenue: number }>;
  monthlyStats: Array<{
    month: string;
    students: number;
    revenue: number;
    sessions: number;
  }>;
}

const ReportsAnalytics = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { user } = useAuth();

  useEffect(() => {
    fetchReportData();
  }, [user, selectedPeriod]);

  const fetchReportData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's tenant
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!tenantUser) return;

      // Fetch students count
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("is_active", true);

      // Fetch payments for revenue calculation
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, payment_date, status")
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("status", "paid");

      // Fetch schedules for session count
      const { count: sessionsCount } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("status", "completed");

      // Calculate totals
      const totalRevenue =
        payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) ||
        0;

      // Mock data for demonstration (replace with real calculations)
      const mockData: ReportData = {
        totalStudents: studentsCount || 0,
        totalRevenue: totalRevenue,
        totalSessions: sessionsCount || 0,
        averageSessionDuration: 90, // minutes
        monthlyGrowth: 12.5,
        revenueGrowth: 18.3,
        topSubjects: [
          { subject: "Matematika", count: 8, revenue: 6400000 },
          { subject: "Fisika", count: 5, revenue: 4000000 },
          { subject: "Kimia", count: 3, revenue: 2400000 },
          { subject: "Bahasa Inggris", count: 4, revenue: 3200000 },
        ],
        monthlyStats: [
          { month: "Jan", students: 8, revenue: 6400000, sessions: 32 },
          { month: "Feb", students: 10, revenue: 8000000, sessions: 40 },
          { month: "Mar", students: 12, revenue: 9600000, sessions: 48 },
          { month: "Apr", students: 15, revenue: 12000000, sessions: 60 },
        ],
      };

      setReportData(mockData);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6 bg-white">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada data laporan
          </h3>
          <p className="text-gray-500">
            Mulai dengan menambahkan siswa dan jadwal untuk melihat laporan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Laporan & Analitik
          </h2>
          <p className="text-gray-500 mt-1">
            Analisis performa dan statistik bisnis les privat
          </p>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <Button variant="outline" className="rounded-full px-4 h-10">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(reportData.totalRevenue)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    +{reportData.revenueGrowth}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Siswa</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {reportData.totalStudents}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">
                    +{reportData.monthlyGrowth}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sesi</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {reportData.totalSessions}
                </p>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    Bulan ini
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata Durasi</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {reportData.averageSessionDuration}m
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    Per sesi
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Subjects */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mata Pelajaran Terpopuler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topSubjects.map((subject, index) => (
                <div
                  key={subject.subject}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {subject.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        {subject.count} siswa
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(subject.revenue)}
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(subject.count / Math.max(...reportData.topSubjects.map((s) => s.count))) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthlyStats.map((stat) => (
                <div
                  key={stat.month}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-600 w-8">
                      {stat.month}
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-gray-500">Siswa</p>
                        <p className="font-semibold text-gray-900">
                          {stat.students}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sesi</p>
                        <p className="font-semibold text-gray-900">
                          {stat.sessions}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(stat.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Insight Performa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-900">
                  Pertumbuhan Positif
                </h4>
              </div>
              <p className="text-sm text-green-700">
                Pendapatan meningkat {reportData.revenueGrowth}% dibanding bulan
                lalu. Pertahankan kualitas mengajar yang baik!
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Retensi Siswa</h4>
              </div>
              <p className="text-sm text-blue-700">
                Tingkat retensi siswa mencapai 85%. Siswa puas dengan metode
                pengajaran Anda.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Optimasi Jadwal</h4>
              </div>
              <p className="text-sm text-purple-700">
                Rata-rata durasi sesi {reportData.averageSessionDuration} menit.
                Pertimbangkan sesi yang lebih efisien.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;
