import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tables } from "@/types/supabase";

interface PaymentRecord {
  id: string;
  studentName: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  method: string;
  avatar: string;
  subject: string;
}

type PaymentWithStudent = Tables<"payments"> & {
  students: Tables<"students"> | null;
};

const PaymentManagement = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; subject?: string }>
  >([]);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    status: "paid",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  useEffect(() => {
    if (user && isAddDialogOpen) {
      fetchStudents();
    }
  }, [user, isAddDialogOpen]);

  const fetchPayments = async () => {
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

      // Fetch payments with student information
      const { data, error } = await supabase
        .from("payments")
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
        setDataLoading(false);
        return;
      }

      // Transform data to match PaymentRecord interface
      const transformedPayments: PaymentRecord[] = (
        data as PaymentWithStudent[]
      ).map((payment) => ({
        id: payment.id,
        studentName: payment.students?.name || "Unknown Student",
        amount: payment.amount,
        date: new Date(payment.payment_date).toLocaleDateString("id-ID"),
        status: (payment.status as "paid" | "pending" | "overdue") || "pending",
        method: payment.payment_method || "Unknown",
        avatar:
          payment.students?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${payment.students?.name || "default"}`,
        subject: payment.students?.subject || "Unknown Subject",
      }));

      setPayments(transformedPayments);
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
      });
    }
  };

  const handleAddPayment = async () => {
    if (
      !user ||
      !formData.studentId ||
      !formData.amount ||
      !formData.paymentMethod
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

      // Create payment record
      const { error } = await supabase.from("payments").insert({
        tenant_id: tenantUser.tenant_id,
        student_id: formData.studentId,
        amount: parseFloat(formData.amount),
        payment_date: formData.paymentDate,
        payment_method: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes,
      });

      if (error) {
        console.error("Error creating payment:", error);
        alert("Gagal mencatat pembayaran");
        return;
      }

      // Refresh payments data to show the new payment
      await fetchPayments();

      // Reset form and close dialog
      setFormData({
        studentId: "",
        studentName: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "",
        status: "paid",
        notes: "",
      });
      setIsAddDialogOpen(false);
      alert("Pembayaran berhasil dicatat!");
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Lunas";
      case "pending":
        return "Pending";
      case "overdue":
        return "Terlambat";
      default:
        return "Unknown";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = () => {
    if (payments.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Create CSV content
    const headers = [
      "Nama Siswa",
      "Mata Pelajaran",
      "Jumlah",
      "Tanggal",
      "Status",
      "Metode Pembayaran",
    ];
    const csvContent = [
      headers.join(","),
      ...payments.map((payment) =>
        [
          `"${payment.studentName}"`,
          `"${payment.subject}"`,
          payment.amount,
          `"${payment.date}"`,
          `"${getStatusText(payment.status)}"`,
          `"${payment.method}"`,
        ].join(","),
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-pembayaran-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalRevenue = payments.reduce(
    (sum, payment) => (payment.status === "paid" ? sum + payment.amount : sum),
    0,
  );

  const pendingAmount = payments.reduce(
    (sum, payment) =>
      payment.status === "pending" ? sum + payment.amount : sum,
    0,
  );

  const overdueAmount = payments.reduce(
    (sum, payment) =>
      payment.status === "overdue" ? sum + payment.amount : sum,
    0,
  );

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Manajemen Pembayaran
          </h2>
          <p className="text-gray-500 mt-1">
            Kelola pembayaran dan laporan keuangan
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-full px-4 h-10"
            onClick={handleExport}
            disabled={payments.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-10">
                <Plus className="mr-2 h-4 w-4" />
                Catat Pembayaran
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Catat Pembayaran Baru</DialogTitle>
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
                  <Label htmlFor="amount" className="text-right">
                    Jumlah *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Masukkan jumlah pembayaran"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paymentDate" className="text-right">
                    Tanggal Bayar *
                  </Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentDate: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paymentMethod" className="text-right">
                    Metode Bayar *
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transfer Bank">
                        Transfer Bank
                      </SelectItem>
                      <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Kartu Kredit">Kartu Kredit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Lunas</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Terlambat</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={handleAddPayment}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <div className="text-3xl font-semibold text-gray-900">
                  {payments.length > 0
                    ? formatCurrency(totalRevenue / payments.length)
                    : "Rp 0"}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Rata-rata per transaksi
                </p>
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
                <p className="text-sm text-gray-600">Pembayaran Pending</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pembayaran Terlambat</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(overdueAmount)}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata per Siswa</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(totalRevenue / payments.length)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Records */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Riwayat Pembayaran</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari siswa..."
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
                  Memuat data pembayaran...
                </p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada data pembayaran</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={payment.avatar}
                        alt={payment.studentName}
                      />
                      <AvatarFallback>{payment.studentName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {payment.studentName}
                      </h4>
                      <p className="text-sm text-gray-600">{payment.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {payment.method} • {payment.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusText(payment.status)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      Detail
                    </Button>
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

export default PaymentManagement;
