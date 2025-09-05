import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Camera,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

interface UserSettings {
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  notifications: {
    email_reminders: boolean;
    sms_reminders: boolean;
    payment_alerts: boolean;
    schedule_updates: boolean;
  };
  preferences: {
    theme: "light" | "dark" | "auto";
    language: "id" | "en";
    timezone: string;
    currency: "IDR" | "USD";
  };
  business: {
    business_name: string;
    business_address?: string;
    business_phone?: string;
    hourly_rate: number;
  };
}

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserSettings();
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user profile
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Get tenant info
      const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      // Set default settings
      const defaultSettings: UserSettings = {
        full_name: profile?.full_name || user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: profile?.phone || "",
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || "",
        notifications: {
          email_reminders: true,
          sms_reminders: false,
          payment_alerts: true,
          schedule_updates: true,
        },
        preferences: {
          theme: "light",
          language: "id",
          timezone: "Asia/Jakarta",
          currency: "IDR",
        },
        business: {
          business_name: tenant?.name || "Les Privat Saya",
          business_address: "",
          business_phone: "",
          hourly_rate: 100000,
        },
      };

      setSettings(defaultSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user || !settings) return;

    try {
      setSaving(true);

      // Update user profile
      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: settings.full_name,
          avatar_url: settings.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update tenant info
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          name: settings.business.business_name,
          settings: {
            notifications: settings.notifications,
            preferences: settings.preferences,
            business: settings.business,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);

      if (tenantError) throw tenantError;

      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (
    section: keyof UserSettings,
    field: string,
    value: any,
  ) => {
    if (!settings) return;

    setSettings((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value,
      },
    }));
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

  if (!settings) return null;

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Pengaturan</h2>
          <p className="text-gray-500 mt-1">
            Kelola profil dan preferensi akun Anda
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 h-10"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={settings.avatar_url}
                    alt={settings.full_name}
                  />
                  <AvatarFallback className="text-lg">
                    {settings.full_name[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="rounded-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Ubah Foto
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG atau GIF. Maksimal 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={settings.full_name}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev!,
                        full_name: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev!,
                        phone: e.target.value,
                      }))
                    }
                    className="mt-1"
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Pengaturan Bisnis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Nama Bisnis</Label>
                  <Input
                    id="business_name"
                    value={settings.business.business_name}
                    onChange={(e) =>
                      updateSettings(
                        "business",
                        "business_name",
                        e.target.value,
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Tarif per Jam</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={settings.business.hourly_rate}
                    onChange={(e) =>
                      updateSettings(
                        "business",
                        "hourly_rate",
                        Number(e.target.value),
                      )
                    }
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Saat ini: {formatCurrency(settings.business.hourly_rate)}
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="business_address">Alamat Bisnis</Label>
                <Input
                  id="business_address"
                  value={settings.business.business_address || ""}
                  onChange={(e) =>
                    updateSettings(
                      "business",
                      "business_address",
                      e.target.value,
                    )
                  }
                  className="mt-1"
                  placeholder="Alamat lengkap bisnis Anda"
                />
              </div>
              <div>
                <Label htmlFor="business_phone">Telepon Bisnis</Label>
                <Input
                  id="business_phone"
                  value={settings.business.business_phone || ""}
                  onChange={(e) =>
                    updateSettings("business", "business_phone", e.target.value)
                  }
                  className="mt-1"
                  placeholder="Nomor telepon untuk bisnis"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences & Notifications */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Pengingat</p>
                  <p className="text-sm text-gray-500">
                    Pengingat jadwal via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email_reminders}
                  onCheckedChange={(checked) =>
                    updateSettings("notifications", "email_reminders", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Pengingat</p>
                  <p className="text-sm text-gray-500">
                    Pengingat jadwal via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.sms_reminders}
                  onCheckedChange={(checked) =>
                    updateSettings("notifications", "sms_reminders", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alert Pembayaran</p>
                  <p className="text-sm text-gray-500">Notifikasi pembayaran</p>
                </div>
                <Switch
                  checked={settings.notifications.payment_alerts}
                  onCheckedChange={(checked) =>
                    updateSettings("notifications", "payment_alerts", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Update Jadwal</p>
                  <p className="text-sm text-gray-500">Perubahan jadwal</p>
                </div>
                <Switch
                  checked={settings.notifications.schedule_updates}
                  onCheckedChange={(checked) =>
                    updateSettings("notifications", "schedule_updates", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preferensi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Tema</Label>
                <select
                  id="theme"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={settings.preferences.theme}
                  onChange={(e) =>
                    updateSettings("preferences", "theme", e.target.value)
                  }
                >
                  <option value="light">Terang</option>
                  <option value="dark">Gelap</option>
                  <option value="auto">Otomatis</option>
                </select>
              </div>
              <div>
                <Label htmlFor="language">Bahasa</Label>
                <select
                  id="language"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={settings.preferences.language}
                  onChange={(e) =>
                    updateSettings("preferences", "language", e.target.value)
                  }
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timezone">Zona Waktu</Label>
                <select
                  id="timezone"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={settings.preferences.timezone}
                  onChange={(e) =>
                    updateSettings("preferences", "timezone", e.target.value)
                  }
                >
                  <option value="Asia/Jakarta">WIB (Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Jayapura)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="currency">Mata Uang</Label>
                <select
                  id="currency"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={settings.preferences.currency}
                  onChange={(e) =>
                    updateSettings("preferences", "currency", e.target.value)
                  }
                >
                  <option value="IDR">Rupiah (IDR)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full rounded-full">
                Ubah Password
              </Button>
              <Button variant="outline" className="w-full rounded-full">
                Aktifkan 2FA
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full text-red-600 hover:text-red-700"
              >
                Hapus Akun
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
