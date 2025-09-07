import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";

interface ScheduleItem {
  id: string;
  studentName: string;
  subject: string;
  time: string;
  duration: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed";
  avatar: string;
  start_time: string;
  end_time: string;
  student_id: string;
  meeting_type: string;
  meeting_url?: string;
  notes?: string;
}

interface ScheduleCalendarProps {
  refreshTrigger?: number;
}

interface ScheduleCalendarRef {
  refreshSchedule: () => void;
}

const ScheduleCalendar = forwardRef<ScheduleCalendarRef, ScheduleCalendarProps>(
  ({ refreshTrigger }, ref) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] =
      useState<ScheduleItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [students, setStudents] = useState<
      Array<{ id: string; name: string; subject?: string }>
    >([]);
    const [weeklyStats, setWeeklyStats] = useState({
      totalSessions: 0,
      totalHours: 0,
      activeStudents: 0,
    });
    const { user } = useAuth();

    const [formData, setFormData] = useState({
      studentId: "",
      studentName: "",
      subject: "",
      startTime: "",
      endTime: "",
      location: "",
      meetingType: "online",
      meetingUrl: "",
      notes: "",
    });

    const [editFormData, setEditFormData] = useState({
      id: "",
      studentId: "",
      studentName: "",
      subject: "",
      startTime: "",
      endTime: "",
      location: "",
      meetingType: "online",
      meetingUrl: "",
      notes: "",
      date: "",
    });

    useEffect(() => {
      if (user && isAddDialogOpen) {
        fetchStudents();
      }
    }, [user, isAddDialogOpen]);

    useEffect(() => {
      if (user) {
        fetchTodaySchedule();
        fetchWeeklyStats();
      }
    }, [user, selectedDate, refreshTrigger]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
      refreshSchedule: () => {
        fetchTodaySchedule();
        fetchWeeklyStats();
      },
    }));

    const fetchStudents = async () => {
      if (!user) return;

      try {
        // Get user's tenant
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!tenantUser) return;

        // Fetch students for the tenant
        const { data, error } = await supabase
          .from("students")
          .select("id, name, subject")
          .eq("tenant_id", tenantUser.tenant_id)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching students:", error);
          return;
        }

        setStudents(data || []);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchTodaySchedule = async () => {
      if (!user) return;

      try {
        setScheduleLoading(true);

        // Get user's tenant
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!tenantUser) return;

        // Get selected date in YYYY-MM-DD format
        const dateStr = selectedDate.toISOString().split("T")[0];

        // Fetch schedules for selected date with student information
        const { data, error } = await supabase
          .from("schedules")
          .select(
            `
          id,
          subject,
          start_time,
          end_time,
          location,
          meeting_type,
          meeting_url,
          notes,
          status,
          student_id,
          students!inner(
            id,
            name,
            avatar_url
          )
        `,
          )
          .eq("tenant_id", tenantUser.tenant_id)
          .gte("start_time", `${dateStr}T00:00:00`)
          .lt("start_time", `${dateStr}T23:59:59`)
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Error fetching schedules:", error);
          return;
        }

        // Transform the data to match ScheduleItem interface
        const transformedSchedule: ScheduleItem[] = (data || []).map(
          (item: any) => {
            const startTime = new Date(item.start_time);
            const endTime = new Date(item.end_time);
            const duration =
              Math.round(
                (endTime.getTime() - startTime.getTime()) /
                  (1000 * 60 * 60 * 100),
              ) / 10; // Duration in hours with 1 decimal

            return {
              id: item.id,
              studentName: item.students.name,
              subject: item.subject,
              time: startTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              duration: `${duration} jam`,
              location:
                item.meeting_type === "online"
                  ? item.meeting_url || item.location || "Online"
                  : item.location || "Offline",
              status: item.status || "upcoming",
              avatar:
                item.students.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.students.name}`,
              start_time: item.start_time,
              end_time: item.end_time,
              student_id: item.student_id,
              meeting_type: item.meeting_type,
              meeting_url: item.meeting_url,
              notes: item.notes,
            };
          },
        );

        setSchedule(transformedSchedule);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setScheduleLoading(false);
      }
    };

    const fetchWeeklyStats = async () => {
      if (!user) return;

      try {
        // Get user's tenant
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!tenantUser) return;

        // Get current week dates
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(
          now.setDate(now.getDate() - now.getDay() + 6),
        );
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fetch weekly sessions
        const { data: weeklyData } = await supabase
          .from("schedules")
          .select("id, start_time, end_time")
          .eq("tenant_id", tenantUser.tenant_id)
          .gte("start_time", startOfWeek.toISOString())
          .lte("start_time", endOfWeek.toISOString());

        // Fetch monthly sessions for hours calculation
        const { data: monthlyData } = await supabase
          .from("schedules")
          .select("id, start_time, end_time")
          .eq("tenant_id", tenantUser.tenant_id)
          .gte("start_time", startOfMonth.toISOString())
          .lte("start_time", endOfMonth.toISOString());

        // Fetch active students count
        const { data: studentsData } = await supabase
          .from("students")
          .select("id")
          .eq("tenant_id", tenantUser.tenant_id)
          .eq("is_active", true);

        // Calculate total hours for the month
        const totalHours = (monthlyData || []).reduce((total, session) => {
          const start = new Date(session.start_time);
          const end = new Date(session.end_time);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + hours;
        }, 0);

        setWeeklyStats({
          totalSessions: weeklyData?.length || 0,
          totalHours: Math.round(totalHours * 10) / 10,
          activeStudents: studentsData?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching weekly stats:", error);
      }
    };

    const handleStudentSelect = (studentId: string) => {
      const selectedStudent = students.find((s) => s.id === studentId);
      if (selectedStudent) {
        setFormData({
          ...formData,
          studentId: studentId,
          studentName: selectedStudent.name,
          subject: selectedStudent.subject || formData.subject,
        });
      }
    };

    const handleAddSchedule = async () => {
      if (
        !user ||
        !formData.studentId ||
        !formData.subject ||
        !formData.startTime ||
        !formData.endTime
      ) {
        alert("Mohon lengkapi semua field yang wajib diisi");
        return;
      }

      try {
        setLoading(true);

        // Get user's tenant
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!tenantUser) {
          alert("Tenant tidak ditemukan");
          return;
        }

        // Create schedule
        const { error } = await supabase.from("schedules").insert({
          tenant_id: tenantUser.tenant_id,
          student_id: formData.studentId,
          subject: formData.subject,
          start_time: `${selectedDate.toISOString().split("T")[0]}T${formData.startTime}:00`,
          end_time: `${selectedDate.toISOString().split("T")[0]}T${formData.endTime}:00`,
          location: formData.location,
          meeting_type: formData.meetingType,
          meeting_url: formData.meetingUrl,
          notes: formData.notes,
          status: "upcoming",
        });

        if (error) {
          console.error("Error creating schedule:", error);
          alert("Gagal menambahkan jadwal");
          return;
        }

        // Reset form and close dialog
        setFormData({
          studentId: "",
          studentName: "",
          subject: "",
          startTime: "",
          endTime: "",
          location: "",
          meetingType: "online",
          meetingUrl: "",
          notes: "",
        });
        setIsAddDialogOpen(false);
        alert("Jadwal berhasil ditambahkan!");

        // Refresh the schedule list and stats
        fetchTodaySchedule();
        fetchWeeklyStats();
      } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    const handleEditSchedule = (schedule: ScheduleItem) => {
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);

      setEditFormData({
        id: schedule.id,
        studentId: schedule.student_id,
        studentName: schedule.studentName,
        subject: schedule.subject,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        location: schedule.location,
        meetingType: schedule.meeting_type,
        meetingUrl: schedule.meeting_url || "",
        notes: schedule.notes || "",
        date: startDate.toISOString().split("T")[0],
      });
      setIsEditDialogOpen(true);
    };

    const handleUpdateSchedule = async () => {
      if (
        !user ||
        !editFormData.id ||
        !editFormData.subject ||
        !editFormData.startTime ||
        !editFormData.endTime ||
        !editFormData.date
      ) {
        alert("Mohon lengkapi semua field yang wajib diisi");
        return;
      }

      try {
        setLoading(true);

        // Update schedule
        const { error } = await supabase
          .from("schedules")
          .update({
            subject: editFormData.subject,
            start_time: `${editFormData.date}T${editFormData.startTime}:00`,
            end_time: `${editFormData.date}T${editFormData.endTime}:00`,
            location: editFormData.location,
            meeting_type: editFormData.meetingType,
            meeting_url: editFormData.meetingUrl,
            notes: editFormData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editFormData.id);

        if (error) {
          console.error("Error updating schedule:", error);
          alert("Gagal mengupdate jadwal");
          return;
        }

        setIsEditDialogOpen(false);
        alert("Jadwal berhasil diupdate!");
        fetchTodaySchedule();
        fetchWeeklyStats();
      } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from("schedules")
          .delete()
          .eq("id", scheduleId);

        if (error) {
          console.error("Error deleting schedule:", error);
          alert("Gagal menghapus jadwal");
          return;
        }

        alert("Jadwal berhasil dihapus!");
        fetchTodaySchedule();
        fetchWeeklyStats();
      } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    const handleViewDetail = (schedule: ScheduleItem) => {
      setSelectedSchedule(schedule);
      setIsDetailDialogOpen(true);
    };

    const navigateDate = (direction: "prev" | "next") => {
      const newDate = new Date(selectedDate);
      if (direction === "prev") {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      setSelectedDate(newDate);
    };

    const goToToday = () => {
      setSelectedDate(new Date());
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "upcoming":
          return "bg-blue-100 text-blue-800";
        case "ongoing":
          return "bg-green-100 text-green-800";
        case "completed":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "upcoming":
          return "Akan Datang";
        case "ongoing":
          return "Sedang Berlangsung";
        case "completed":
          return "Selesai";
        default:
          return "Unknown";
      }
    };

    return (
      <div className="space-y-6 bg-white">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Jadwal Mengajar
            </h2>
            <p className="text-gray-500 mt-1">Kelola jadwal les privat Anda</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-10">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Jadwal Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="studentName" className="text-right">
                    Nama Siswa *
                  </Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={handleStudentSelect}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih siswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}{" "}
                          {student.subject && `(${student.subject})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Mata Pelajaran *
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subject: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matematika">Matematika</SelectItem>
                      <SelectItem value="Fisika">Fisika</SelectItem>
                      <SelectItem value="Kimia">Kimia</SelectItem>
                      <SelectItem value="Biologi">Biologi</SelectItem>
                      <SelectItem value="Bahasa Inggris">
                        Bahasa Inggris
                      </SelectItem>
                      <SelectItem value="Bahasa Indonesia">
                        Bahasa Indonesia
                      </SelectItem>
                      <SelectItem value="Calistung">Calistung</SelectItem>
                      <SelectItem value="Bimbel Intensif UTBK & Sekolah Kedinasan">
                        Bimbel Intensif UTBK & Sekolah Kedinasan
                      </SelectItem>
                      <SelectItem value="Robotics">Robotics</SelectItem>
                      <SelectItem value="Pemrograman/Koding">
                        Pemrograman/Koding
                      </SelectItem>
                      <SelectItem value="Ekonomi & Akuntansi">
                        Ekonomi & Akuntansi
                      </SelectItem>
                      <SelectItem value="Gambar & Lukis">
                        Gambar & Lukis
                      </SelectItem>
                      <SelectItem value="Musik Piano">Musik Piano</SelectItem>
                      <SelectItem value="Musik Gitar">Musik Gitar</SelectItem>
                      <SelectItem value="Musik Biola">Musik Biola</SelectItem>
                      <SelectItem value="Musik Vokal">Musik Vokal</SelectItem>
                      <SelectItem value="Musik Lainnya">
                        Musik Lainnya
                      </SelectItem>
                      <SelectItem value="Komputer & Desain Grafis">
                        Komputer & Desain Grafis
                      </SelectItem>
                      <SelectItem value="Tari">Tari</SelectItem>
                      <SelectItem value="Olahraga Berenang">
                        Olahraga Berenang
                      </SelectItem>
                      <SelectItem value="Olahraga Basket">
                        Olahraga Basket
                      </SelectItem>
                      <SelectItem value="Olahraga Futsal">
                        Olahraga Futsal
                      </SelectItem>
                      <SelectItem value="Olahraga Bulutangkis">
                        Olahraga Bulutangkis
                      </SelectItem>
                      <SelectItem value="Olahraga Lainnya">
                        Olahraga Lainnya
                      </SelectItem>
                      <SelectItem value="Anak Berkebutuhan Khusus">
                        Anak Berkebutuhan Khusus
                      </SelectItem>
                      <SelectItem value="Mengaji">Mengaji</SelectItem>
                      <SelectItem value="Public Speaking & Dakwah">
                        Public Speaking & Dakwah
                      </SelectItem>
                      <SelectItem value="Les Lainnya">Les Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Waktu Mulai *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    Waktu Selesai *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="meetingType" className="text-right">
                    Tipe Pertemuan
                  </Label>
                  <Select
                    value={formData.meetingType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, meetingType: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Lokasi/URL
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="col-span-3"
                    placeholder={
                      formData.meetingType === "online"
                        ? "Link meeting"
                        : "Alamat lokasi"
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Catatan
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Catatan tambahan (opsional)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddSchedule}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Date Navigation */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="rounded-full"
                >
                  Hari Ini
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule for Selected Date */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              Jadwal{" "}
              {selectedDate.toDateString() === new Date().toDateString()
                ? "Hari Ini"
                : selectedDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                  })}
              <Badge variant="secondary" className="ml-2">
                {schedule.length} sesi
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada jadwal{" "}
                  {selectedDate.toDateString() === new Date().toDateString()
                    ? "hari ini"
                    : "pada tanggal ini"}
                </h3>
                <p className="text-gray-500 mb-4">
                  Belum ada jadwal les untuk{" "}
                  {selectedDate.toDateString() === new Date().toDateString()
                    ? "hari ini"
                    : "tanggal ini"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.avatar}
                        alt={item.studentName}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.studentName}
                        </h4>
                        <p className="text-sm text-gray-600">{item.subject}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.time} ({item.duration})
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full p-2"
                        onClick={() => handleViewDetail(item)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full p-2"
                        onClick={() => handleEditSchedule(item)}
                        title="Edit Jadwal"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full p-2 text-red-500 hover:text-red-700"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Jadwal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus jadwal{" "}
                              {item.subject} dengan {item.studentName}? Tindakan
                              ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sesi Minggu Ini</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {weeklyStats.totalSessions}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Jam Mengajar Bulan Ini
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {weeklyStats.totalHours}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Siswa Aktif</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {weeklyStats.activeStudents}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Schedule Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Jadwal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDate" className="text-right">
                  Tanggal *
                </Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editSubject" className="text-right">
                  Mata Pelajaran *
                </Label>
                <Select
                  value={editFormData.subject}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, subject: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matematika">Matematika</SelectItem>
                    <SelectItem value="Fisika">Fisika</SelectItem>
                    <SelectItem value="Kimia">Kimia</SelectItem>
                    <SelectItem value="Biologi">Biologi</SelectItem>
                    <SelectItem value="Bahasa Inggris">
                      Bahasa Inggris
                    </SelectItem>
                    <SelectItem value="Bahasa Indonesia">
                      Bahasa Indonesia
                    </SelectItem>
                    <SelectItem value="Calistung">Calistung</SelectItem>
                    <SelectItem value="Bimbel Intensif UTBK & Sekolah Kedinasan">
                      Bimbel Intensif UTBK & Sekolah Kedinasan
                    </SelectItem>
                    <SelectItem value="Robotics">Robotics</SelectItem>
                    <SelectItem value="Pemrograman/Koding">
                      Pemrograman/Koding
                    </SelectItem>
                    <SelectItem value="Ekonomi & Akuntansi">
                      Ekonomi & Akuntansi
                    </SelectItem>
                    <SelectItem value="Gambar & Lukis">
                      Gambar & Lukis
                    </SelectItem>
                    <SelectItem value="Musik Piano">Musik Piano</SelectItem>
                    <SelectItem value="Musik Gitar">Musik Gitar</SelectItem>
                    <SelectItem value="Musik Biola">Musik Biola</SelectItem>
                    <SelectItem value="Musik Vokal">Musik Vokal</SelectItem>
                    <SelectItem value="Musik Lainnya">Musik Lainnya</SelectItem>
                    <SelectItem value="Komputer & Desain Grafis">
                      Komputer & Desain Grafis
                    </SelectItem>
                    <SelectItem value="Tari">Tari</SelectItem>
                    <SelectItem value="Olahraga Berenang">
                      Olahraga Berenang
                    </SelectItem>
                    <SelectItem value="Olahraga Basket">
                      Olahraga Basket
                    </SelectItem>
                    <SelectItem value="Olahraga Futsal">
                      Olahraga Futsal
                    </SelectItem>
                    <SelectItem value="Olahraga Bulutangkis">
                      Olahraga Bulutangkis
                    </SelectItem>
                    <SelectItem value="Olahraga Lainnya">
                      Olahraga Lainnya
                    </SelectItem>
                    <SelectItem value="Anak Berkebutuhan Khusus">
                      Anak Berkebutuhan Khusus
                    </SelectItem>
                    <SelectItem value="Mengaji">Mengaji</SelectItem>
                    <SelectItem value="Public Speaking & Dakwah">
                      Public Speaking & Dakwah
                    </SelectItem>
                    <SelectItem value="Les Lainnya">Les Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editStartTime" className="text-right">
                  Waktu Mulai *
                </Label>
                <Input
                  id="editStartTime"
                  type="time"
                  value={editFormData.startTime}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      startTime: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEndTime" className="text-right">
                  Waktu Selesai *
                </Label>
                <Input
                  id="editEndTime"
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      endTime: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editMeetingType" className="text-right">
                  Tipe Pertemuan
                </Label>
                <Select
                  value={editFormData.meetingType}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, meetingType: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLocation" className="text-right">
                  Lokasi/URL
                </Label>
                <Input
                  id="editLocation"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      location: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder={
                    editFormData.meetingType === "online"
                      ? "Link meeting"
                      : "Alamat lokasi"
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editNotes" className="text-right">
                  Catatan
                </Label>
                <Textarea
                  id="editNotes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateSchedule}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loading ? "Menyimpan..." : "Update"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                Detail Jadwal
              </DialogTitle>
            </DialogHeader>
            {selectedSchedule && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={selectedSchedule.avatar}
                    alt={selectedSchedule.studentName}
                    className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedSchedule.studentName}
                    </h3>
                    <p className="text-gray-600">{selectedSchedule.subject}</p>
                    <Badge className={getStatusColor(selectedSchedule.status)}>
                      {getStatusText(selectedSchedule.status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Informasi Waktu
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Waktu</p>
                        <p className="text-sm font-medium">
                          {selectedSchedule.time} ({selectedSchedule.duration})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Tanggal</p>
                        <p className="text-sm font-medium">
                          {new Date(
                            selectedSchedule.start_time,
                          ).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Informasi Lokasi
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">
                          {selectedSchedule.meeting_type === "online"
                            ? "Link Meeting"
                            : "Lokasi"}
                        </p>
                        <p className="text-sm font-medium">
                          {selectedSchedule.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Tipe Pertemuan</p>
                        <p className="text-sm font-medium capitalize">
                          {selectedSchedule.meeting_type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedSchedule.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Catatan</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {selectedSchedule.notes}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    Tutup
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleEditSchedule(selectedSchedule);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Jadwal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);

export default ScheduleCalendar;
