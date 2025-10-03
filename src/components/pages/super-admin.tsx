import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Settings,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  owner_id: string;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  student_count?: number;
  schedule_count?: number;
  payment_total?: number;
  last_activity?: string;
}

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalStudents: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    ownerEmail: "",
    settings: "{}",
  });

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenants with owner info and stats
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select(`
          *,
          owner:auth.users!tenants_owner_id_fkey(email),
          students(count),
          schedules(count),
          payments(amount)
        `);

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError);
        return;
      }

      // Process tenant data
      const processedTenants = tenantsData?.map((tenant: any) => ({
        ...tenant,
        owner_email: tenant.owner?.email || "N/A",
        student_count: tenant.students?.length || 0,
        schedule_count: tenant.schedules?.length || 0,
        payment_total: tenant.payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0,
      })) || [];

      setTenants(processedTenants);

      // Calculate system stats
      const totalTenants = processedTenants.length;
      const activeTenants = processedTenants.filter((t: Tenant) => t.is_active).length;
      const totalStudents = processedTenants.reduce((sum: number, t: Tenant) => sum + (t.student_count || 0), 0);
      const totalRevenue = processedTenants.reduce((sum: number, t: Tenant) => sum + (t.payment_total || 0), 0);

      setSystemStats({
        totalTenants,
        activeTenants,
        totalUsers: totalTenants, // Assuming 1 user per tenant for now
        totalStudents,
        totalRevenue,
        monthlyGrowth: 12.5, // Mock data
      });

    } catch (error) {
      console.error("Error fetching system data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async () => {
    if (!formData.name || !formData.ownerEmail) {
      alert("Mohon lengkapi nama tenant dan email owner");
      return;
    }

    try {
      setFormLoading(true);

      // First, create or get the user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: formData.ownerEmail,
        password: "TempPassword123!", // Temporary password
        email_confirm: true,
      });

      if (userError && !userError.message.includes("already registered")) {
        console.error("Error creating user:", userError);
        alert("Gagal membuat user");
        return;
      }

      const userId = userData?.user?.id;

      // Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: formData.name,
          domain: formData.domain || null,
          owner_id: userId,
          settings: JSON.parse(formData.settings || "{}"),
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Error creating tenant:", tenantError);
        alert("Gagal membuat tenant");
        return;
      }

      // Create tenant_user relationship
      await supabase.from("tenant_users").insert({
        tenant_id: tenantData.id,
        user_id: userId,
        role: "owner",
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        domain: "",
        ownerEmail: "",
        settings: "{}",
      });
      setIsAddDialogOpen(false);
      alert("Tenant berhasil ditambahkan!");
      fetchSystemData();

    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain || "",
      ownerEmail: tenant.owner_email || "",
      settings: JSON.stringify(tenant.settings || {}, null, 2),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant || !formData.name) {
      alert("Mohon lengkapi nama tenant");
      return;
    }

    try {
      setFormLoading(true);

      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          domain: formData.domain || null,
          settings: JSON.parse(formData.settings || "{}"),
        })
        .eq("id", selectedTenant.id);

      if (error) {
        console.error("Error updating tenant:", error);
        alert("Gagal mengupdate tenant");
        return;
      }

      setIsEditDialogOpen(false);
      setSelectedTenant(null);
      alert("Tenant berhasil diupdate!");
      fetchSystemData();

    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleTenantStatus = async (tenant: Tenant) => {
    const newStatus = !tenant.is_active;
    const action = newStatus ? "mengaktifkan" : "menonaktifkan";
    
    if (!confirm(`Apakah Anda yakin ingin ${action} tenant ${tenant.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: newStatus })
        .eq("id", tenant.id);

      if (error) {
        console.error("Error updating tenant status:", error);
        alert(`Gagal ${action} tenant`);
        return;
      }

      alert(`Tenant berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}!`);
      fetchSystemData();

    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tenant ${tenant.name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenant.id);

      if (error) {
        console.error("Error deleting tenant:", error);
        alert("Gagal menghapus tenant");
        return;
      }

      alert("Tenant berhasil dihapus!");
      fetchSystemData();

    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    }
  };

  const exportSystemReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      systemStats,
      tenants: tenants.map(t => ({
        name: t.name,
        domain: t.domain,
        owner_email: t.owner_email,
        is_active: t.is_active,
        student_count: t.student_count,
        payment_total: t.payment_total,
        created_at: t.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && tenant.is_active) ||
                         (statusFilter === "inactive" && !tenant.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola semua tenant dan monitor sistem secara keseluruhan
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportSystemReport}
              variant="outline"
              className="rounded-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>System Analytics</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {systemStats.monthlyGrowth}%
                        </div>
                        <p className="text-sm text-gray-600">Monthly Growth</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {((systemStats.activeTenants / systemStats.totalTenants) * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600">Active Rate</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Top Performing Tenants</h4>
                    {tenants
                      .sort((a, b) => (b.payment_total || 0) - (a.payment_total || 0))
                      .slice(0, 5)
                      .map((tenant) => (
                        <div key={tenant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{tenant.name}</span>
                          <span className="text-green-600">Rp {(tenant.payment_total || 0).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalTenants}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                  <p className="text-2xl font-bold text-green-600">{systemStats.activeTenants}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalStudents}</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {systemStats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold text-blue-600">+{systemStats.monthlyGrowth}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Management */}
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Tenant Management</CardTitle>
              <div className="flex gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari tenant..."
                    className="pl-9 h-10 rounded-full bg-gray-50 border-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Tambah Tenant Baru</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nama Tenant *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="col-span-3"
                          placeholder="Nama tenant"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="domain" className="text-right">
                          Domain
                        </Label>
                        <Input
                          id="domain"
                          value={formData.domain}
                          onChange={(e) =>
                            setFormData({ ...formData, domain: e.target.value })
                          }
                          className="col-span-3"
                          placeholder="subdomain.example.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ownerEmail" className="text-right">
                          Email Owner *
                        </Label>
                        <Input
                          id="ownerEmail"
                          type="email"
                          value={formData.ownerEmail}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerEmail: e.target.value })
                          }
                          className="col-span-3"
                          placeholder="owner@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="settings" className="text-right">
                          Settings (JSON)
                        </Label>
                        <Textarea
                          id="settings"
                          value={formData.settings}
                          onChange={(e) =>
                            setFormData({ ...formData, settings: e.target.value })
                          }
                          className="col-span-3"
                          placeholder='{"theme": "default"}'
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
                        onClick={handleAddTenant}
                        disabled={formLoading}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {formLoading ? "Menambahkan..." : "Tambah Tenant"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{tenant.owner_email}</TableCell>
                      <TableCell>
                        {tenant.domain ? (
                          <span className="text-blue-600">{tenant.domain}</span>
                        ) : (
                          <span className="text-gray-400">No domain</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            tenant.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {tenant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{tenant.student_count || 0}</TableCell>
                      <TableCell className="text-green-600">
                        Rp {(tenant.payment_total || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditTenant(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              tenant.is_active
                                ? "text-red-500 hover:text-red-700"
                                : "text-green-500 hover:text-green-700"
                            }`}
                            onClick={() => handleToggleTenantStatus(tenant)}
                          >
                            {tenant.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteTenant(tenant)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Tenant Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Nama Tenant *
                </Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDomain" className="text-right">
                  Domain
                </Label>
                <Input
                  id="editDomain"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editOwnerEmail" className="text-right">
                  Email Owner
                </Label>
                <Input
                  id="editOwnerEmail"
                  value={formData.ownerEmail}
                  disabled
                  className="col-span-3 bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editSettings" className="text-right">
                  Settings (JSON)
                </Label>
                <Textarea
                  id="editSettings"
                  value={formData.settings}
                  onChange={(e) =>
                    setFormData({ ...formData, settings: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTenant(null);
                }}
                disabled={formLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateTenant}
                disabled={formLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {formLoading ? "Menyimpan..." : "Update"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;