import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  FileText,
  Video,
  Image,
  Upload,
  Search,
  Plus,
  Download,
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

interface Material {
  id: string;
  title: string;
  type: "document" | "video" | "image" | "presentation";
  subject: string;
  uploadDate: string;
  size: string;
  downloads: number;
  thumbnail?: string;
}

const defaultMaterials: Material[] = [
  {
    id: "1",
    title: "Rumus Matematika SMA Lengkap",
    type: "document",
    subject: "Matematika",
    uploadDate: "2024-03-15",
    size: "2.5 MB",
    downloads: 45,
  },
  {
    id: "2",
    title: "Video Penjelasan Hukum Newton",
    type: "video",
    subject: "Fisika",
    uploadDate: "2024-03-12",
    size: "125 MB",
    downloads: 32,
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
  },
  {
    id: "3",
    title: "Grammar Rules - Present Tense",
    type: "presentation",
    subject: "Bahasa Inggris",
    uploadDate: "2024-03-10",
    size: "8.2 MB",
    downloads: 28,
  },
  {
    id: "4",
    title: "Diagram Sistem Pencernaan",
    type: "image",
    subject: "Biologi",
    uploadDate: "2024-03-08",
    size: "1.8 MB",
    downloads: 19,
    thumbnail:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
  },
];

const LearningMaterials = () => {
  const [materials, setMaterials] = useState(defaultMaterials);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    gradeLevel: "",
    type: "document",
    description: "",
    tags: "",
    isPublic: false,
  });

  const handleUploadMaterial = async () => {
    if (!user || !formData.title || !formData.subject) {
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

      // Create learning material record
      const { error } = await supabase.from("learning_materials").insert({
        tenant_id: tenantUser.tenant_id,
        title: formData.title,
        subject: formData.subject,
        grade_level: formData.gradeLevel,
        file_type: formData.type,
        description: formData.description,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        is_public: formData.isPublic,
        download_count: 0,
      });

      if (error) {
        console.error("Error creating material:", error);
        alert("Gagal mengunggah materi");
        return;
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        subject: "",
        gradeLevel: "",
        type: "document",
        description: "",
        tags: "",
        isPublic: false,
      });
      setIsUploadDialogOpen(false);
      alert("Materi berhasil diunggah!");
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "image":
        return <Image className="h-5 w-5 text-green-500" />;
      case "presentation":
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "image":
        return "bg-green-100 text-green-800";
      case "presentation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "document":
        return "Dokumen";
      case "video":
        return "Video";
      case "image":
        return "Gambar";
      case "presentation":
        return "Presentasi";
      default:
        return "File";
    }
  };

  const subjects = [...new Set(materials.map((m) => m.subject))];

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Materi Pembelajaran
          </h2>
          <p className="text-gray-500 mt-1">
            Kelola dokumen dan media pembelajaran
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-10">
              <Upload className="mr-2 h-4 w-4" />
              Upload Materi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Materi Pembelajaran</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Judul Materi *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Masukkan judul materi"
                />
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
                <Label htmlFor="gradeLevel" className="text-right">
                  Tingkat
                </Label>
                <Select
                  value={formData.gradeLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gradeLevel: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="Universitas">Universitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipe File
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Dokumen</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Gambar</SelectItem>
                    <SelectItem value="presentation">Presentasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Deskripsi materi (opsional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Tag1, Tag2, Tag3 (pisahkan dengan koma)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUploadMaterial}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loading ? "Mengunggah..." : "Upload"}
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
                <p className="text-sm text-gray-600">Total Materi</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {materials.length}
                </p>
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
                <p className="text-sm text-gray-600">Total Download</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {materials.reduce((sum, m) => sum + m.downloads, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-green-600" />
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
                  {subjects.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upload Bulan Ini</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">12</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Daftar Materi</CardTitle>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari materi..."
                  className="pl-9 h-10 rounded-full bg-gray-50 border-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">Semua Mata Pelajaran</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card
                key={material.id}
                className="bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all"
              >
                <CardContent className="p-4">
                  {material.thumbnail && (
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={material.thumbnail}
                        alt={material.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(material.type)}
                      <Badge className={getTypeColor(material.type)}>
                        {getTypeText(material.type)}
                      </Badge>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {material.title}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Mata Pelajaran: {material.subject}</p>
                    <p>Ukuran: {material.size}</p>
                    <p>Upload: {material.uploadDate}</p>
                    <p>Download: {material.downloads}x</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningMaterials;
