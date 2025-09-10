import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { Tables } from "@/types/supabase";

interface LessonNote {
  id: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  topic: string;
  content: string;
  date: string;
  duration: number;
  nextTopic?: string;
  homework?: string;
  studentProgress: "excellent" | "good" | "average" | "needs_improvement";
}

type LessonNoteWithStudent = Tables<"lesson_notes"> & {
  students: Tables<"students"> | null;
};

const LessonNotes = () => {
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; subject?: string; avatar_url?: string }>
  >([]);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    studentId: "",
    topic: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    duration: "",
    nextTopic: "",
    homework: "",
    studentProgress: "good",
  });

  useEffect(() => {
    if (user) {
      fetchLessonNotes();
    }
  }, [user]);

  useEffect(() => {
    if (user && isAddDialogOpen) {
      fetchStudents();
    }
  }, [user, isAddDialogOpen]);

  const fetchLessonNotes = async () => {
    if (!user) return;

    try {
      setDataLoading(true);

      // Get user's tenant
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!tenantUser) {
        setDataLoading(false);
        return;
      }

      // Fetch lesson notes with student information
      const { data, error } = await supabase
        .from("lesson_notes")
        .select(
          `
          *,
          students (
            id,
            name,
            subject,
            avatar_url
          )
        `,
        )
        .eq("tenant_id", tenantUser.tenant_id)
        .order("lesson_date", { ascending: false });

      if (error) {
        console.error("Error fetching lesson notes:", error);
        setDataLoading(false);
        return;
      }

      // Transform data to match LessonNote interface
      const transformedNotes: LessonNote[] = (
        data as LessonNoteWithStudent[]
      ).map((note) => ({
        id: note.id,
        studentName: note.students?.name || "Unknown Student",
        studentAvatar:
          note.students?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.students?.name || "default"}`,
        subject: note.students?.subject || "Unknown Subject",
        topic: note.topic,
        content: note.content,
        date: new Date(note.lesson_date).toLocaleDateString("id-ID"),
        duration: note.duration_minutes || 0,
        nextTopic: note.next_topic || "",
        homework: note.homework || "",
        studentProgress: (note.student_progress as "excellent" | "good" | "average" | "needs_improvement") || "good",
      }));

      setLessonNotes(transformedNotes);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDataLoading(false);
    }
  };

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
        .select("id, name, subject, avatar_url")
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
      });
    }
  };

  const handleAddLessonNote = async () => {
    if (
      !user ||
      !formData.studentId ||
      !formData.topic ||
      !formData.content ||
      !formData.duration
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

      // Create lesson note record
      const { error } = await supabase.from("lesson_notes").insert({
        tenant_id: tenantUser.tenant_id,
        student_id: formData.studentId,
        topic: formData.topic,
        content: formData.content,
        lesson_date: formData.date,
        duration_minutes: parseInt(formData.duration),
        next_topic: formData.nextTopic,
        homework: formData.homework,
        student_progress: formData.studentProgress,
      });

      if (error) {
        console.error("Error creating lesson note:", error);
        alert("Gagal menyimpan catatan pelajaran");
        return;
      }

      // Refresh lesson notes data
      await fetchLessonNotes();

      // Reset form and close dialog
      setFormData({
        studentId: "",
        topic: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        duration: "",
        nextTopic: "",
        homework: "",
        studentProgress: "good",
      });
      setIsAddDialogOpen(false);
      alert("Catatan pelajaran berhasil disimpan!");
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "average":
        return "bg-yellow-100 text-yellow-800";
      case "needs_improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressText = (progress: string) => {
    switch (progress) {
      case "excellent":
        return "Sangat Baik";
      case "good":
        return "Baik";
      case "average":
        return "Cukup";
      case "needs_improvement":
        return "Perlu Perbaikan";
      default:
        return "Unknown";
    }
  };

  const filteredNotes = lessonNotes.filter(
    (note) =>
      note.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Catatan Pelajaran
          </h2>
          <p className="text-gray-500 mt-1">
            Catat materi dan progress pembelajaran siswa
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-10">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Catatan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tambah Catatan Pelajaran</DialogTitle>
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
                <Label htmlFor="topic" className="text-right">
                  Topik Pelajaran *
                </Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Contoh: Aljabar Linear, Grammar Tenses, dll"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Isi Materi *
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Jelaskan materi yang telah diajarkan..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Tanggal Les *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Durasi (menit) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="90"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentProgress" className="text-right">
                  Progress Siswa
                </Label>
                <Select
                  value={formData.studentProgress}
                  onValueChange={(value) =>
                    setFormData({ ...formData, studentProgress: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Sangat Baik</SelectItem>
                    <SelectItem value="good">Baik</SelectItem>
                    <SelectItem value="average">Cukup</SelectItem>
                    <SelectItem value="needs_improvement">Perlu Perbaikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nextTopic" className="text-right">
                  Topik Selanjutnya
                </Label>
                <Input
                  id="nextTopic"
                  value={formData.nextTopic}
                  onChange={(e) =>
                    setFormData({ ...formData, nextTopic: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Rencana materi untuk pertemuan berikutnya"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="homework" className="text-right">
                  Tugas/PR
                </Label>
                <Textarea
                  id="homework"
                  value={formData.homework}
                  onChange={(e) =>
                    setFormData({ ...formData, homework: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Tugas yang diberikan kepada siswa (opsional)"
                  rows={2}
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
                onClick={handleAddLessonNote}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Catatan</p>
                <div className="text-3xl font-semibold text-gray-900">
                  {lessonNotes.length}
                </div>
                <p className="text-sm text-gray-500 mt-1">Catatan pelajaran</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siswa Aktif</p>
                <div className="text-3xl font-semibold text-gray-900">
                  {new Set(lessonNotes.map(note => note.studentName)).size}
                </div>
                <p className="text-sm text-gray-500 mt-1">Siswa dengan catatan</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata Durasi</p>
                <div className="text-3xl font-semibold text-gray-900">
                  {lessonNotes.length > 0 
                    ? Math.round(lessonNotes.reduce((sum, note) => sum + note.duration, 0) / lessonNotes.length)
                    : 0
                  } min
                </div>
                <p className="text-sm text-gray-500 mt-1">Per sesi les</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bulan Ini</p>
                <div className="text-3xl font-semibold text-gray-900">
                  {lessonNotes.filter(note => {
                    const noteDate = new Date(note.date.split('/').reverse().join('-'));
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
                  }).length}
                </div>
                <p className="text-sm text-gray-500 mt-1">Catatan bulan ini</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Notes List */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Riwayat Catatan Pelajaran</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari catatan..."
                className="pl-9 h-10 rounded-full bg-gray-50 border-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">
                  Memuat catatan pelajaran...
                </p>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada catatan pelajaran</p>
              <p className="text-sm text-gray-400 mt-1">
                Mulai tambahkan catatan untuk melacak progress pembelajaran
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={note.studentAvatar}
                          alt={note.studentName}
                        />
                        <AvatarFallback>{note.studentName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {note.topic}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {note.studentName} • {note.subject}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {note.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {note.duration} menit
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getProgressColor(note.studentProgress)}>
                      {getProgressText(note.studentProgress)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Materi yang Diajarkan:
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {note.content}
                      </p>
                    </div>
                    
                    {note.homework && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Tugas/PR:
                        </h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {note.homework}
                        </p>
                      </div>
                    )}
                    
                    {note.nextTopic && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Rencana Topik Selanjutnya:
                        </h4>
                        <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                          {note.nextTopic}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonNotes;