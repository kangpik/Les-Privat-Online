import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

export default function LandingPage() {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Apple-style navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[980px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl">
              LesPrivat Pro
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 hover:cursor-pointer">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-none shadow-lg"
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-black text-white hover:bg-gray-800 text-sm px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-12">
        {/* Hero section */}
        <section className="py-20 text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">
            Kelola Les Privat dengan Mudah
          </h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-4">
            Platform manajemen les privat online untuk guru yang ingin
            mengoptimalkan jadwal, pembayaran, dan materi pembelajaran.
          </h3>
          <div className="flex justify-center space-x-6 text-xl text-blue-600">
            <Link to="/" className="flex items-center hover:underline">
              Pelajari lebih lanjut <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/signup" className="flex items-center hover:underline">
              Mulai sekarang <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-[#f5f5f7] text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">
            Fitur Lengkap untuk Guru Privat
          </h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-4">
            Semua yang Anda butuhkan untuk mengelola les privat secara
            profesional
          </h3>
          <div className="flex justify-center space-x-6 text-xl text-blue-600">
            <Link to="/" className="flex items-center hover:underline">
              Jelajahi fitur <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="flex items-center hover:underline">
              Lihat demo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-medium mb-2">Manajemen Jadwal</h4>
              <p className="text-gray-500">
                Kelola jadwal mengajar dengan kalender interaktif dan pengingat
                otomatis untuk setiap sesi.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-medium mb-2">Sistem Pembayaran</h4>
              <p className="text-gray-500">
                Catat transaksi pembayaran dan buat laporan keuangan untuk
                memantau pendapatan.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-medium mb-2">Materi Pembelajaran</h4>
              <p className="text-gray-500">
                Unggah dan kelola dokumen serta media pembelajaran untuk
                dibagikan kepada siswa.
              </p>
            </div>
          </div>
        </section>

        {/* Grid section for other features */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
          <div className="bg-[#f5f5f7] rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight mb-1">
              Dashboard Aktivitas
            </h2>
            <h3 className="text-xl font-medium text-gray-500 mb-4">
              Pantau semua aktivitas dalam satu tempat
            </h3>
            <div className="flex justify-center space-x-6 text-lg text-blue-600">
              <Link to="/" className="flex items-center hover:underline">
                Pelajari lebih lanjut <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center hover:underline"
              >
                Lihat dashboard <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 bg-white p-6 rounded-xl shadow-sm max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-blue-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-100 rounded w-8"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-green-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-100 rounded w-12"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-purple-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-100 rounded w-6"></div>
                </div>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-blue-100 rounded"></div>
                  <div className="h-8 bg-green-100 rounded"></div>
                  <div className="h-8 bg-purple-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f5f5f7] rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight mb-1">
              Multi-Tenant
            </h2>
            <h3 className="text-xl font-medium text-gray-500 mb-4">
              Solusi untuk sekolah dan lembaga
            </h3>
            <div className="flex justify-center space-x-6 text-lg text-blue-600">
              <Link to="/" className="flex items-center hover:underline">
                Pelajari lebih lanjut <ChevronRight className="h-4 w-4" />
              </Link>
              <Link to="/" className="flex items-center hover:underline">
                Hubungi sales <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 bg-white p-6 rounded-xl shadow-sm max-w-sm mx-auto text-left">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded flex-1"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded flex-1"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Settings className="h-3 w-3 text-white" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-12 text-xs text-gray-500">
        <div className="max-w-[980px] mx-auto px-4">
          <div className="border-b border-gray-300 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">
                LesPrivat Pro
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Fitur
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Harga
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Testimoni
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">
                Bantuan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Panduan Memulai
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Tutorial
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Dukungan
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">
                Perusahaan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Karir
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Kontak
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Privasi
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Kebijakan Cookie
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Lisensi
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="py-4">
            <p>Copyright © 2025 LesPrivat Pro. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
