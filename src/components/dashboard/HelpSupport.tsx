import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Search,
  MessageCircle,
  Book,
  Video,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Send,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface SupportTicket {
  subject: string;
  message: string;
  priority: "low" | "medium" | "high";
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "Bagaimana cara menambahkan siswa baru?",
    answer:
      'Untuk menambahkan siswa baru, klik menu "Siswa" di sidebar, lalu klik tombol "Tambah Siswa". Isi formulir dengan informasi siswa yang lengkap termasuk nama, kontak, dan mata pelajaran.',
    category: "Siswa",
    helpful: 45,
  },
  {
    id: "2",
    question: "Bagaimana cara mengatur jadwal les?",
    answer:
      'Buka menu "Jadwal" dan klik "Tambah Jadwal". Pilih siswa, mata pelajaran, tanggal, waktu, dan lokasi. Anda juga bisa mengatur pengingat otomatis.',
    category: "Jadwal",
    helpful: 38,
  },
  {
    id: "3",
    question: "Bagaimana cara mencatat pembayaran?",
    answer:
      'Di menu "Pembayaran", klik "Catat Pembayaran". Pilih siswa, masukkan jumlah, tanggal pembayaran, dan metode pembayaran. Status akan otomatis terupdate.',
    category: "Pembayaran",
    helpful: 42,
  },
  {
    id: "4",
    question: "Bagaimana cara upload materi pembelajaran?",
    answer:
      'Buka menu "Materi", klik "Upload Materi". Pilih file (dokumen, video, atau gambar), beri judul dan deskripsi, lalu pilih mata pelajaran yang sesuai.',
    category: "Materi",
    helpful: 29,
  },
  {
    id: "5",
    question: "Bagaimana cara melihat laporan keuangan?",
    answer:
      'Menu "Laporan" menyediakan analisis lengkap termasuk pendapatan, jumlah siswa, dan tren bulanan. Anda bisa export laporan dalam format PDF.',
    category: "Laporan",
    helpful: 33,
  },
];

const HelpSupport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showContactForm, setShowContactForm] = useState(false);
  const [supportTicket, setSupportTicket] = useState<SupportTicket>({
    subject: "",
    message: "",
    priority: "medium",
    category: "general",
  });
  const { toast } = useToast();

  const categories = [
    "all",
    "Siswa",
    "Jadwal",
    "Pembayaran",
    "Materi",
    "Laporan",
  ];

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitTicket = async () => {
    if (!supportTicket.subject || !supportTicket.message) {
      toast({
        title: "Error",
        description: "Mohon isi subjek dan pesan",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending support ticket
    toast({
      title: "Berhasil",
      description:
        "Tiket dukungan berhasil dikirim. Kami akan merespons dalam 24 jam.",
    });

    setSupportTicket({
      subject: "",
      message: "",
      priority: "medium",
      category: "general",
    });
    setShowContactForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Bantuan & Dukungan
          </h2>
          <p className="text-gray-500 mt-1">
            Temukan jawaban atau hubungi tim dukungan kami
          </p>
        </div>
        <Button
          onClick={() => setShowContactForm(!showContactForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-10"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Hubungi Dukungan
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Panduan Pengguna</h3>
            <p className="text-sm text-gray-500">
              Pelajari cara menggunakan semua fitur
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Video className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Video Tutorial</h3>
            <p className="text-sm text-gray-500">
              Tonton tutorial langkah demi langkah
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Live Chat</h3>
            <p className="text-sm text-gray-500">
              Chat langsung dengan tim dukungan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Telepon</h3>
            <p className="text-sm text-gray-500">
              Hubungi kami di +62 21 1234 5678
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      {showContactForm && (
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Kirim Tiket Dukungan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subjek</Label>
                <Input
                  id="subject"
                  value={supportTicket.subject}
                  onChange={(e) =>
                    setSupportTicket((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Jelaskan masalah Anda secara singkat"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={supportTicket.category}
                  onChange={(e) =>
                    setSupportTicket((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="general">Umum</option>
                  <option value="technical">Teknis</option>
                  <option value="billing">Pembayaran</option>
                  <option value="feature">Fitur Baru</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Prioritas</Label>
              <select
                id="priority"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                value={supportTicket.priority}
                onChange={(e) =>
                  setSupportTicket((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high",
                  }))
                }
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
            <div>
              <Label htmlFor="message">Pesan</Label>
              <Textarea
                id="message"
                value={supportTicket.message}
                onChange={(e) =>
                  setSupportTicket((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder="Jelaskan masalah Anda secara detail..."
                className="mt-1 min-h-[120px]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSubmitTicket}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              >
                <Send className="mr-2 h-4 w-4" />
                Kirim Tiket
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowContactForm(false)}
                className="rounded-full"
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Pertanyaan yang Sering Diajukan
            </CardTitle>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pertanyaan..."
                  className="pl-9 h-10 rounded-full bg-gray-50 border-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "Semua Kategori" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada pertanyaan ditemukan
              </h3>
              <p className="text-gray-500">
                Coba ubah kata kunci pencarian atau kategori Anda
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <Card
                  key={faq.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900 flex-1 pr-4">
                        {faq.question}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {faq.answer}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{faq.helpful} orang merasa ini membantu</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          👍 Membantu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          👎 Tidak Membantu
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Informasi Kontak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Email</h4>
              <p className="text-gray-600">support@lesprivat.pro</p>
              <p className="text-sm text-gray-500 mt-1">Respons dalam 24 jam</p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Telepon</h4>
              <p className="text-gray-600">+62 21 1234 5678</p>
              <p className="text-sm text-gray-500 mt-1">
                Senin - Jumat, 09:00 - 17:00
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Live Chat</h4>
              <p className="text-gray-600">Chat langsung</p>
              <p className="text-sm text-gray-500 mt-1">24/7 tersedia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpSupport;
