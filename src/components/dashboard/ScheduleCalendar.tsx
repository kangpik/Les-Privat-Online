import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
}

const defaultSchedule: ScheduleItem[] = [
  {
    id: "1",
    studentName: "Andi Pratama",
    subject: "Matematika SMA",
    time: "09:00",
    duration: "2 jam",
    location: "Online - Zoom",
    status: "upcoming",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi",
  },
  {
    id: "2",
    studentName: "Sari Dewi",
    subject: "Fisika SMP",
    time: "13:00",
    duration: "1.5 jam",
    location: "Rumah Siswa",
    status: "ongoing",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sari",
  },
  {
    id: "3",
    studentName: "Budi Santoso",
    subject: "Bahasa Inggris SD",
    time: "15:30",
    duration: "1 jam",
    location: "Online - Google Meet",
    status: "upcoming",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
  },
];

const ScheduleCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; subject?: string }>
  >([]);
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

  useEffect(() => {
    if (user && isAddDialogOpen) {
      fetchStudents();
    }
  }, [user, isAddDialogOpen]);

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
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
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

      {/* Today's Schedule */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            Jadwal Hari Ini
            <Badge variant="secondary" className="ml-2">
              {schedule.length} sesi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </Badge>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Detail
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sesi Minggu Ini</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">24</p>
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
                <p className="text-sm text-gray-600">Jam Mengajar Bulan Ini</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">156</p>
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
                <p className="text-2xl font-semibold text-gray-900 mt-1">12</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
