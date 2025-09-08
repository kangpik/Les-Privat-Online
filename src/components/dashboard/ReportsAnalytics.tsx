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
import { Tables } from "@/types/supabase";

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

type PaymentWithStudent = Tables<"payments"> & {
  students: Tables<"students"> | null;
};

type ScheduleWithStudent = Tables<"schedules"> & {
  students: Tables<"students"> | null;
};

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

      // Fetch students with count
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("is_active", true);

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
      }

      // Fetch payments with student information
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          *,
          students (
            id,
            name,
            subject
          )
        `,
        )
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("status", "paid");

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      // Fetch schedules with student information
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(
          `
          *,
          students (
            id,
            name,
            subject
          )
        `,
        )
        .eq("tenant_id", tenantUser.tenant_id);

      if (schedulesError) {
        console.error("Error fetching schedules:", schedulesError);
      }

      // Calculate totals
      const totalRevenue = (
        (paymentsData as PaymentWithStudent[]) || []
      ).reduce((sum, payment) => sum + Number(payment.amount), 0);

      const totalSessions = schedulesData?.length || 0;
      const completedSessions =
        schedulesData?.filter((s) => s.status === "completed").length || 0;

      // Calculate average session duration
      const sessionsWithDuration = (
        (schedulesData as ScheduleWithStudent[]) || []
      ).filter((s) => s.start_time && s.end_time);
      const totalDuration = sessionsWithDuration.reduce((sum, session) => {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
      }, 0);
      const averageSessionDuration =
        sessionsWithDuration.length > 0
          ? Math.round(totalDuration / sessionsWithDuration.length)
          : 90;

      // Calculate top subjects
      const subjectStats: {
        [key: string]: { count: number; revenue: number };
      } = {};

      ((paymentsData as PaymentWithStudent[]) || []).forEach((payment) => {
        const subject = payment.students?.subject || "Lainnya";
        if (!subjectStats[subject]) {
          subjectStats[subject] = { count: 0, revenue: 0 };
        }
        subjectStats[subject].revenue += Number(payment.amount);
      });

      ((schedulesData as ScheduleWithStudent[]) || []).forEach((schedule) => {
        const subject = schedule.subject || "Lainnya";
        if (!subjectStats[subject]) {
          subjectStats[subject] = { count: 0, revenue: 0 };
        }
        subjectStats[subject].count += 1;
      });

      const topSubjects = Object.entries(subjectStats)
        .map(([subject, stats]) => ({ subject, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate monthly stats for the last 6 months
      const monthlyStats = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          1,
        );

        const monthPayments = (
          (paymentsData as PaymentWithStudent[]) || []
        ).filter((p) => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= monthDate && paymentDate < nextMonthDate;
        });

        const monthSchedules = (
          (schedulesData as ScheduleWithStudent[]) || []
        ).filter((s) => {
          const scheduleDate = new Date(s.start_time);
          return scheduleDate >= monthDate && scheduleDate < nextMonthDate;
        });

        const monthStudents = new Set(
          monthSchedules.map((s) => s.student_id).filter(Boolean),
        ).size;

        monthlyStats.push({
          month: monthDate.toLocaleDateString("id-ID", { month: "short" }),
          students: monthStudents,
          revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          sessions: monthSchedules.length,
        });
      }

      // Calculate growth rates
      const currentMonthRevenue =
        monthlyStats[monthlyStats.length - 1]?.revenue || 0;
      const previousMonthRevenue =
        monthlyStats[monthlyStats.length - 2]?.revenue || 0;
      const revenueGrowth =
        previousMonthRevenue > 0
          ? ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
            100
          : 0;

      const currentMonthStudents =
        monthlyStats[monthlyStats.length - 1]?.students || 0;
      const previousMonthStudents =
        monthlyStats[monthlyStats.length - 2]?.students || 0;
      const monthlyGrowth =
        previousMonthStudents > 0
          ? ((currentMonthStudents - previousMonthStudents) /
              previousMonthStudents) *
            100
          : 0;

      const reportData: ReportData = {
        totalStudents: studentsData?.length || 0,
        totalRevenue,
        totalSessions,
        averageSessionDuration,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        topSubjects,
        monthlyStats,
      };

      setReportData(reportData);
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

  const handleExportPDF = async () => {
    if (!reportData) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Analitik - ${new Date().toLocaleDateString("id-ID")}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #3b82f6; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb; }
            .metric-title { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .metric-growth { font-size: 12px; color: #10b981; margin-top: 4px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .subjects-table, .monthly-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .subjects-table th, .subjects-table td, .monthly-table th, .monthly-table td { 
              border: 1px solid #e5e7eb; padding: 12px; text-align: left; 
            }
            .subjects-table th, .monthly-table th { background: #f3f4f6; font-weight: bold; }
            .insights { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; }
            .insights h3 { color: #0369a1; margin-top: 0; }
            .insights ul { margin: 10px 0; padding-left: 20px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Analitik Les Privat</h1>
            <p>Periode: ${selectedPeriod === "month" ? "Bulan Ini" : selectedPeriod === "week" ? "Minggu Ini" : selectedPeriod === "quarter" ? "Kuartal Ini" : "Tahun Ini"}</p>
            <p>Tanggal Dibuat: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          <div class="metrics">
            <div class="metric-card">
              <div class="metric-title">Total Pendapatan</div>
              <div class="metric-value">${formatCurrency(reportData.totalRevenue)}</div>
              <div class="metric-growth">+${reportData.revenueGrowth}% dari bulan lalu</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Total Siswa</div>
              <div class="metric-value">${reportData.totalStudents}</div>
              <div class="metric-growth">+${reportData.monthlyGrowth}% dari bulan lalu</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Total Sesi</div>
              <div class="metric-value">${reportData.totalSessions}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Rata-rata Durasi Sesi</div>
              <div class="metric-value">${reportData.averageSessionDuration} menit</div>
            </div>
          </div>

          <div class="section">
            <h2>Mata Pelajaran Terpopuler</h2>
            <table class="subjects-table">
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Mata Pelajaran</th>
                  <th>Jumlah Sesi</th>
                  <th>Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topSubjects
                  .map(
                    (subject, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${subject.subject}</td>
                    <td>${subject.count}</td>
                    <td>${formatCurrency(subject.revenue)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Tren Bulanan (6 Bulan Terakhir)</h2>
            <table class="monthly-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Siswa</th>
                  <th>Sesi</th>
                  <th>Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.monthlyStats
                  .map(
                    (stat) => `
                  <tr>
                    <td>${stat.month}</td>
                    <td>${stat.students}</td>
                    <td>${stat.sessions}</td>
                    <td>${formatCurrency(stat.revenue)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="insights">
              <h3>Insight Performa</h3>
              <ul>
                <li><strong>Pertumbuhan Positif:</strong> Pendapatan ${reportData.revenueGrowth >= 0 ? "meningkat" : "menurun"} ${Math.abs(reportData.revenueGrowth)}% dibanding bulan lalu.</li>
                <li><strong>Jumlah Siswa:</strong> Total ${reportData.totalStudents} siswa aktif dengan pertumbuhan ${reportData.monthlyGrowth >= 0 ? "positif" : "negatif"} ${Math.abs(reportData.monthlyGrowth)}%.</li>
                <li><strong>Efisiensi Mengajar:</strong> Rata-rata durasi sesi ${reportData.averageSessionDuration} menit dengan total ${reportData.totalSessions} sesi.</li>
                <li><strong>Mata Pelajaran Favorit:</strong> ${reportData.topSubjects[0]?.subject || "Belum ada data"} menjadi mata pelajaran dengan pendapatan tertinggi.</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Laporan ini dibuat secara otomatis oleh Sistem Manajemen Les Privat</p>
            <p>© ${new Date().getFullYear()} - Semua hak dilindungi</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
      } else {
        // Fallback: create downloadable HTML file
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `laporan-analitik-${new Date().toISOString().split("T")[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Gagal mengekspor PDF. Silakan coba lagi.");
    }
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
          <Button
            variant="outline"
            className="rounded-full px-4 h-10"
            onClick={handleExportPDF}
            disabled={!reportData || loading}
          >
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
                  {reportData.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      reportData.revenueGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {reportData.revenueGrowth >= 0 ? "+" : ""}
                    {reportData.revenueGrowth}%
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
                  {reportData.monthlyGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      reportData.monthlyGrowth >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {reportData.monthlyGrowth >= 0 ? "+" : ""}
                    {reportData.monthlyGrowth}%
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
                Pendapatan{" "}
                {reportData.revenueGrowth >= 0 ? "meningkat" : "menurun"}{" "}
                {Math.abs(reportData.revenueGrowth)}% dibanding bulan lalu.{" "}
                {reportData.revenueGrowth >= 0
                  ? "Pertahankan kualitas mengajar yang baik!"
                  : "Perlu strategi untuk meningkatkan pendapatan."}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Retensi Siswa</h4>
              </div>
              <p className="text-sm text-blue-700">
                Jumlah siswa aktif: {reportData.totalStudents} dengan
                pertumbuhan{" "}
                {reportData.monthlyGrowth >= 0 ? "positif" : "negatif"}{" "}
                {Math.abs(reportData.monthlyGrowth)}%.
                {reportData.monthlyGrowth >= 0
                  ? "Siswa puas dengan metode pengajaran Anda."
                  : "Perlu evaluasi untuk meningkatkan retensi siswa."}
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
