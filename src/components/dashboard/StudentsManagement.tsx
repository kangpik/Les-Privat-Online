import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  GraduationCap,
  MapPin,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  grade?: string;
  subject?: string;
  avatar_url?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

interface StudentsManagementProps {
  onScheduleAdded?: () => void;
}

const StudentsManagement = ({
  onScheduleAdded,
}: StudentsManagementProps = {}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    subject: "",
    parentName: "",
    parentPhone: "",
    address: "",
    notes: "",
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    subject: "",
    startTime: "",
    endTime: "",
    location: "",
    meetingType: "online",
    meetingUrl: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleViewDetail = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email || "",
      phone: student.phone || "",
      grade: student.grade || "",
      subject: student.subject || "",
      parentName: student.parent_name || "",
      parentPhone: student.parent_phone || "",
      address: student.address || "",
      notes: student.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!user || !selectedStudent || !formData.name) {
      alert("Mohon masukkan nama siswa");
      return;
    }

    try {
      setFormLoading(true);

      // Update student
      const { error } = await supabase
        .from("students")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          grade: formData.grade || null,
          subject: formData.subject || null,
          parent_name: formData.parentName || null,
          parent_phone: formData.parentPhone || null,
          address: formData.address || null,
          notes: formData.notes || null,
        })
        .eq("id", selectedStudent.id);

      if (error) {
        console.error("Error updating student:", error);
        alert("Gagal mengupdate siswa");
        return;
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        grade: "",
        subject: "",
        parentName: "",
        parentPhone: "",
        address: "",
        notes: "",
      });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      alert("Data siswa berhasil diupdate!");

      // Refresh students list
      fetchStudents();
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus siswa ${student.name}?`)) {
      return;
    }

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("students")
        .update({ is_active: false })
        .eq("id", student.id);

      if (error) {
        console.error("Error deleting student:", error);
        alert("Gagal menghapus siswa");
        return;
      }

      alert("Siswa berhasil dihapus!");
      // Refresh students list
      fetchStudents();
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    }
  };

  const handleScheduleLesson = (student: Student) => {
    setSelectedStudent(student);
    setScheduleFormData({
      ...scheduleFormData,
      subject: student.subject || "",
    });
    setIsScheduleDialogOpen(true);
  };

  const handleAddSchedule = async () => {
    if (
      !user ||
      !selectedStudent ||
      !scheduleFormData.subject ||
      !scheduleFormData.startTime ||
      !scheduleFormData.endTime ||
      !scheduleFormData.date
    ) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      setScheduleLoading(true);

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

      // Create schedule with proper timezone handling
      // Create date in local timezone (WIB/UTC+7) and convert to UTC for storage
      const startDateTime = new Date(
        `${scheduleFormData.date}T${scheduleFormData.startTime}:00`,
      );
      const endDateTime = new Date(
        `${scheduleFormData.date}T${scheduleFormData.endTime}:00`,
      );

      // Convert from local time to UTC (subtract 7 hours for WIB)
      startDateTime.setHours(startDateTime.getHours() - 7);
      endDateTime.setHours(endDateTime.getHours() - 7);

      const { error } = await supabase.from("schedules").insert({
        tenant_id: tenantUser.tenant_id,
        student_id: selectedStudent.id,
        subject: scheduleFormData.subject,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: scheduleFormData.location,
        meeting_type: scheduleFormData.meetingType,
        meeting_url: scheduleFormData.meetingUrl,
        notes: scheduleFormData.notes,
        status: "upcoming",
      });

      if (error) {
        console.error("Error creating schedule:", error);
        alert("Gagal menambahkan jadwal");
        return;
      }

      // Reset form and close dialog
      setScheduleFormData({
        subject: "",
        startTime: "",
        endTime: "",
        location: "",
        meetingType: "online",
        meetingUrl: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      setIsScheduleDialogOpen(false);
      setSelectedStudent(null);
      alert("Jadwal berhasil ditambahkan!");

      // Notify parent component that schedule was added
      if (onScheduleAdded) {
        onScheduleAdded();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!user || !formData.name) {
      alert("Mohon masukkan nama siswa");
      return;
    }

    try {
      setFormLoading(true);

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

      // Create student
      const { error } = await supabase.from("students").insert({
        tenant_id: tenantUser.tenant_id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        grade: formData.grade || null,
        subject: formData.subject || null,
        parent_name: formData.parentName || null,
        parent_phone: formData.parentPhone || null,
        address: formData.address || null,
        notes: formData.notes || null,
        is_active: true,
      });

      if (error) {
        console.error("Error creating student:", error);
        alert("Gagal menambahkan siswa");
        return;
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        grade: "",
        subject: "",
        parentName: "",
        parentPhone: "",
        address: "",
        notes: "",
      });
      setIsAddDialogOpen(false);
      alert("Siswa berhasil ditambahkan!");

      // Refresh students list
      fetchStudents();
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
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
        console.error("No tenant found for user");
        return;
      }

      // Fetch students for the tenant
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("tenant_id", tenantUser.tenant_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching students:", error);
        return;
      }

      setStudents(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.subject &&
        student.subject.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getSubjectColor = (subject?: string) => {
    if (!subject) return "bg-gray-100 text-gray-800";

    const colors: { [key: string]: string } = {
      Matematika: "bg-blue-100 text-blue-800",
      Fisika: "bg-green-100 text-green-800",
      Kimia: "bg-purple-100 text-purple-800",
      Biologi: "bg-emerald-100 text-emerald-800",
      "Bahasa Inggris": "bg-orange-100 text-orange-800",
      "Bahasa Indonesia": "bg-red-100 text-red-800",
    };

    return colors[subject] || "bg-gray-100 text-gray-800";
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

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Manajemen Siswa
          </h2>
          <p className="text-gray-500 mt-1">
            Kelola data siswa dan informasi kontak
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-10">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Siswa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Siswa Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama Siswa *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Masukkan nama siswa"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Email siswa (opsional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  No. Telepon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="No. telepon siswa"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">
                  Kelas/Tingkat
                </Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih kelas/tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD Kelas 1">SD Kelas 1</SelectItem>
                    <SelectItem value="SD Kelas 2">SD Kelas 2</SelectItem>
                    <SelectItem value="SD Kelas 3">SD Kelas 3</SelectItem>
                    <SelectItem value="SD Kelas 4">SD Kelas 4</SelectItem>
                    <SelectItem value="SD Kelas 5">SD Kelas 5</SelectItem>
                    <SelectItem value="SD Kelas 6">SD Kelas 6</SelectItem>
                    <SelectItem value="SMP Kelas 7">SMP Kelas 7</SelectItem>
                    <SelectItem value="SMP Kelas 8">SMP Kelas 8</SelectItem>
                    <SelectItem value="SMP Kelas 9">SMP Kelas 9</SelectItem>
                    <SelectItem value="SMA Kelas 10">SMA Kelas 10</SelectItem>
                    <SelectItem value="SMA Kelas 11">SMA Kelas 11</SelectItem>
                    <SelectItem value="SMA Kelas 12">SMA Kelas 12</SelectItem>
                    <SelectItem value="Pra Sekolah">Pra Sekolah</SelectItem>
                    <SelectItem value="Pasca Sekolah">Pasca Sekolah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Mata Pelajaran
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
                <Label htmlFor="parentName" className="text-right">
                  Nama Orang Tua
                </Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Nama orang tua/wali"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentPhone" className="text-right">
                  No. Telepon Ortu
                </Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="No. telepon orang tua"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Alamat
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Alamat lengkap siswa"
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
                disabled={formLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={formLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {formLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Siswa</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {students.length}
                </p>
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
                <p className="text-sm text-gray-600">Siswa Aktif</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {students.filter((s) => s.is_active).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mata Pelajaran</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {new Set(students.map((s) => s.subject).filter(Boolean)).size}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siswa Baru Bulan Ini</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {
                    students.filter((s) => {
                      const created = new Date(s.created_at);
                      const now = new Date();
                      return (
                        created.getMonth() === now.getMonth() &&
                        created.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Daftar Siswa</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari siswa atau mata pelajaran..."
                className="pl-9 h-10 rounded-full bg-gray-50 border-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {students.length === 0
                  ? "Belum ada siswa"
                  : "Tidak ada siswa yang ditemukan"}
              </h3>
              <p className="text-gray-500 mb-4">
                {students.length === 0
                  ? "Mulai dengan menambahkan siswa pertama Anda"
                  : "Coba ubah kata kunci pencarian Anda"}
              </p>
              {students.length === 0 && (
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Siswa Pertama
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              student.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
                            }
                            alt={student.name}
                          />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {student.name}
                          </h4>
                          {student.grade && (
                            <p className="text-sm text-gray-600">
                              {student.grade}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteStudent(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {student.subject && (
                      <Badge
                        className={`${getSubjectColor(student.subject)} mb-3`}
                      >
                        {student.subject}
                      </Badge>
                    )}

                    <div className="space-y-2 text-sm text-gray-600">
                      {student.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{student.address}</span>
                        </div>
                      )}
                    </div>

                    {student.parent_name && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Orang Tua:</p>
                        <p className="text-sm font-medium text-gray-700">
                          {student.parent_name}
                        </p>
                        {student.parent_phone && (
                          <p className="text-xs text-gray-600">
                            {student.parent_phone}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full"
                        onClick={() => handleViewDetail(student)}
                      >
                        Lihat Detail
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600"
                        onClick={() => handleScheduleLesson(student)}
                      >
                        Jadwalkan Les
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Data Siswa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editName" className="text-right">
                Nama Siswa *
              </Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Masukkan nama siswa"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEmail" className="text-right">
                Email
              </Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
                placeholder="Email siswa (opsional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPhone" className="text-right">
                No. Telepon
              </Label>
              <Input
                id="editPhone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="col-span-3"
                placeholder="No. telepon siswa"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editGrade" className="text-right">
                Kelas/Tingkat
              </Label>
              <Select
                value={formData.grade}
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih kelas/tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SD Kelas 1">SD Kelas 1</SelectItem>
                  <SelectItem value="SD Kelas 2">SD Kelas 2</SelectItem>
                  <SelectItem value="SD Kelas 3">SD Kelas 3</SelectItem>
                  <SelectItem value="SD Kelas 4">SD Kelas 4</SelectItem>
                  <SelectItem value="SD Kelas 5">SD Kelas 5</SelectItem>
                  <SelectItem value="SD Kelas 6">SD Kelas 6</SelectItem>
                  <SelectItem value="SMP Kelas 7">SMP Kelas 7</SelectItem>
                  <SelectItem value="SMP Kelas 8">SMP Kelas 8</SelectItem>
                  <SelectItem value="SMP Kelas 9">SMP Kelas 9</SelectItem>
                  <SelectItem value="SMA Kelas 10">SMA Kelas 10</SelectItem>
                  <SelectItem value="SMA Kelas 11">SMA Kelas 11</SelectItem>
                  <SelectItem value="SMA Kelas 12">SMA Kelas 12</SelectItem>
                  <SelectItem value="Pra Sekolah">Pra Sekolah</SelectItem>
                  <SelectItem value="Pasca Sekolah">Pasca Sekolah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editSubject" className="text-right">
                Mata Pelajaran
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
              <Label htmlFor="editParentName" className="text-right">
                Nama Orang Tua
              </Label>
              <Input
                id="editParentName"
                value={formData.parentName}
                onChange={(e) =>
                  setFormData({ ...formData, parentName: e.target.value })
                }
                className="col-span-3"
                placeholder="Nama orang tua/wali"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editParentPhone" className="text-right">
                No. Telepon Ortu
              </Label>
              <Input
                id="editParentPhone"
                value={formData.parentPhone}
                onChange={(e) =>
                  setFormData({ ...formData, parentPhone: e.target.value })
                }
                className="col-span-3"
                placeholder="No. telepon orang tua"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAddress" className="text-right">
                Alamat
              </Label>
              <Textarea
                id="editAddress"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="col-span-3"
                placeholder="Alamat lengkap siswa"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editNotes" className="text-right">
                Catatan
              </Label>
              <Textarea
                id="editNotes"
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
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedStudent(null);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  grade: "",
                  subject: "",
                  parentName: "",
                  parentPhone: "",
                  address: "",
                  notes: "",
                });
              }}
              disabled={formLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateStudent}
              disabled={formLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {formLoading ? "Menyimpan..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-500" />
              Detail Siswa
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={
                      selectedStudent.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.name}`
                    }
                    alt={selectedStudent.name}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedStudent.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedStudent.name}
                  </h3>
                  {selectedStudent.grade && (
                    <p className="text-gray-600">{selectedStudent.grade}</p>
                  )}
                  {selectedStudent.subject && (
                    <Badge
                      className={`${getSubjectColor(selectedStudent.subject)} mt-2`}
                    >
                      {selectedStudent.subject}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Informasi Kontak
                  </h4>
                  {selectedStudent.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium">
                          {selectedStudent.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedStudent.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Telepon</p>
                        <p className="text-sm font-medium">
                          {selectedStudent.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedStudent.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Alamat</p>
                        <p className="text-sm font-medium">
                          {selectedStudent.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Informasi Orang Tua
                  </h4>
                  {selectedStudent.parent_name && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Nama Orang Tua</p>
                        <p className="text-sm font-medium">
                          {selectedStudent.parent_name}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedStudent.parent_phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">
                          Telepon Orang Tua
                        </p>
                        <p className="text-sm font-medium">
                          {selectedStudent.parent_phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedStudent.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Catatan</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedStudent.notes}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Bergabung:{" "}
                  {new Date(selectedStudent.created_at).toLocaleDateString(
                    "id-ID",
                  )}
                </div>
                <div className="flex gap-2">
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
                      handleScheduleLesson(selectedStudent);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Jadwalkan Les
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Lesson Dialog */}
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              Jadwalkan Les - {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduleDate" className="text-right">
                Tanggal *
              </Label>
              <Input
                id="scheduleDate"
                type="date"
                value={scheduleFormData.date}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    date: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduleSubject" className="text-right">
                Mata Pelajaran *
              </Label>
              <Select
                value={scheduleFormData.subject}
                onValueChange={(value) =>
                  setScheduleFormData({ ...scheduleFormData, subject: value })
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
                  <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
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
                  <SelectItem value="Gambar & Lukis">Gambar & Lukis</SelectItem>
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
              <Label htmlFor="scheduleStartTime" className="text-right">
                Waktu Mulai *
              </Label>
              <Input
                id="scheduleStartTime"
                type="time"
                value={scheduleFormData.startTime}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    startTime: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduleEndTime" className="text-right">
                Waktu Selesai *
              </Label>
              <Input
                id="scheduleEndTime"
                type="time"
                value={scheduleFormData.endTime}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    endTime: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduleMeetingType" className="text-right">
                Tipe Pertemuan
              </Label>
              <Select
                value={scheduleFormData.meetingType}
                onValueChange={(value) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    meetingType: value,
                  })
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
              <Label htmlFor="scheduleLocation" className="text-right">
                Lokasi/URL
              </Label>
              <Input
                id="scheduleLocation"
                value={scheduleFormData.location}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    location: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder={
                  scheduleFormData.meetingType === "online"
                    ? "Link meeting"
                    : "Alamat lokasi"
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduleNotes" className="text-right">
                Catatan
              </Label>
              <Textarea
                id="scheduleNotes"
                value={scheduleFormData.notes}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    notes: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Catatan tambahan (opsional)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsScheduleDialogOpen(false);
                setSelectedStudent(null);
                setScheduleFormData({
                  subject: "",
                  startTime: "",
                  endTime: "",
                  location: "",
                  meetingType: "online",
                  meetingUrl: "",
                  notes: "",
                  date: new Date().toISOString().split("T")[0],
                });
              }}
              disabled={scheduleLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddSchedule}
              disabled={scheduleLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {scheduleLoading ? "Menyimpan..." : "Simpan Jadwal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsManagement;