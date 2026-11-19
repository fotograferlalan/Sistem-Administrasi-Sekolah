import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GraduationCap,
  Send,
  Settings2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ArchivedDocument,
  DocumentCategory,
  DocumentType,
  SchoolProfile,
} from '../types/admin';
import { DOC_TEMPLATES, SD_SCHOOL_DIRECTORY } from '../data/defaultData';
import { formatTanggalIndonesia } from '../utils/formatters';

type DashboardTargetTab =
  | 'agenda'
  | 'teachers'
  | 'students'
  | 'absen_pegawai'
  | 'absen_siswa_kelas'
  | 'absen_siswa_mapel'
  | 'settings';

interface DashboardOverviewProps {
  school: SchoolProfile;
  archives: ArchivedDocument[];
  teacherCount: number;
  studentCount: number;
  onStartDocument: (type: DocumentType) => void;
  onOpenArchiveItem: (item: ArchivedDocument) => void;
  onNavigateTab: (tab: DashboardTargetTab) => void;
  onSelectSchoolPreset: (npsn: string) => void;
}

const HERO_IMAGE_SRC = '/src/assets/images/hero_sekolah_sd_1795104706373.jpg';
const ADMIN_IMAGE_SRC =
  '/src/assets/images/ilustrasi_administrasi_sekolah_1795104706160.jpg';
const CLASSROOM_IMAGE_SRC =
  '/src/assets/images/ilustrasi_pembelajaran_sd_1795104706565.jpg';

const SmartImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackLabel: string;
}> = ({ src, alt, className = '', fallbackLabel }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-slate-800 text-white/85 p-6 text-center ${className}`}
      >
        <Building2 className="w-8 h-8 mb-2 opacity-80" />
        <span className="text-xs font-medium tracking-wide">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

function getTemplateIcon(type: DocumentType) {
  switch (type) {
    case 'sk_pengangkatan_guru':
      return UserCheck;
    case 'sk_pembagian_tugas':
      return BookOpen;
    case 'surat_mutasi':
    case 'surat_pindah_sekolah':
      return Send;
    case 'surat_siap_terima':
      return UserPlus;
    case 'surat_keterangan_lulus':
      return GraduationCap;
    case 'surat_tugas':
    case 'surat_undangan':
      return FileCheck2;
    default:
      return FileText;
  }
}

const CATEGORY_FILTERS: Array<'Semua' | DocumentCategory> = [
  'Semua',
  'SK Kepegawaian',
  'Mutasi & Kesiswaan',
  'Operasional & Dinas',
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  school,
  archives,
  teacherCount,
  studentCount,
  onStartDocument,
  onOpenArchiveItem,
  onNavigateTab,
  onSelectSchoolPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'Semua' | DocumentCategory
  >('Semua');

  const recentArchives = archives.slice(0, 5);
  const skCount = archives.filter((a) => a.category === 'SK Kepegawaian').length;
  const mutasiCount = archives.filter(
    (a) =>
      a.docType === 'surat_mutasi' ||
      a.docType === 'surat_pindah_sekolah' ||
      a.docType === 'surat_siap_terima'
  ).length;

  const filteredTemplates =
    selectedCategory === 'Semua'
      ? DOC_TEMPLATES
      : DOC_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-8">
      {/* Modern Split Hero Section */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: School Identity & Primary Actions */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500">
                <span className="font-mono tabular-nums text-[#1E3A5F] font-semibold">
                  NPSN {school.npsn}
                </span>
                <span aria-hidden="true">·</span>
                <span>Status {school.statusSekolah}</span>
                <span aria-hidden="true">·</span>
                <span>Akreditasi {school.akreditasi}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  TP {school.tahunPelajaran} ({school.semester})
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                {school.namaSekolah}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                {school.alamat}, Kec. {school.kecamatan}, {school.kabupatenKota} ·
                Kepala Sekolah:{' '}
                <span className="font-semibold text-slate-800">
                  {school.namaKepalaSekolah}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <select
                aria-label="Pilih sekolah aktif dari daftar 30 sekolah"
                value={
                  SD_SCHOOL_DIRECTORY.some((s) => s.npsn === school.npsn)
                    ? school.npsn
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) onSelectSchoolPreset(e.target.value);
                }}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:border-slate-400 focus:border-[#1E3A5F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 max-w-[250px]"
              >
                <option value="">Ganti Sekolah (30 SD)...</option>
                {SD_SCHOOL_DIRECTORY.map((entry) => (
                  <option key={entry.npsn} value={entry.npsn}>
                    {entry.namaSekolah} ({entry.npsn})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                Atur Kop Sekolah
              </button>

              <button
                type="button"
                onClick={() => onStartDocument('sk_pembagian_tugas')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
              >
                Buat SK / Surat Baru
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Editorial School Architecture Hero Image */}
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200">
            <SmartImage
              src={HERO_IMAGE_SRC}
              alt={`Lingkungan sekolah dasar modern untuk layanan tata usaha ${school.namaSekolah}`}
              fallbackLabel={school.namaSekolah}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent pointer-events-none"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-200 tabular-nums">
                  Kode Surat {school.kodeSuratSekolah}
                </p>
                <p className="text-sm font-semibold truncate">
                  {school.kabupatenKota}, {school.provinsi}
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-200 whitespace-nowrap shrink-0">
                Format Cetak F4 / A4
              </span>
            </div>
          </div>
        </div>

        {/* Clean 4-Column Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 border-t border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={() => onNavigateTab('agenda')}
            className="text-left px-6 py-4 hover:bg-white transition-colors"
          >
            <p className="text-xs text-slate-500">Arsip Surat Keluar</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
              {archives.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onStartDocument('sk_pembagian_tugas')}
            className="text-left px-6 py-4 hover:bg-white transition-colors"
          >
            <p className="text-xs text-slate-500">SK Kepegawaian Terbit</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
              {skCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('agenda')}
            className="text-left px-6 py-4 hover:bg-white transition-colors"
          >
            <p className="text-xs text-slate-500">Dokumen Mutasi &amp; Pindah</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
              {mutasiCount}
            </p>
          </button>

          <div className="px-6 py-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500">Master Data Sekolah</p>
              <p className="text-sm font-semibold text-slate-900 tabular-nums mt-1">
                {teacherCount} PTK · {studentCount} Siswa
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('teachers')}
                className="text-xs font-medium text-[#1E3A5F] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                PTK
              </button>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('students')}
                className="text-xs font-medium text-[#1E3A5F] hover:underline whitespace-nowrap"
              >
                Siswa
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Up Visual Module Spotlight: Persuratan & Absensi Terpadu */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch">
          <div className="sm:col-span-5 relative min-h-[170px] bg-slate-100">
            <SmartImage
              src={ADMIN_IMAGE_SRC}
              alt="Meja kerja tata usaha sekolah dengan berkas SK dan perlengkapan administrasi"
              fallbackLabel="Administrasi & Kepegawaian"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F]">
                Tata Persuratan &amp; Kepegawaian
              </p>
              <h2 className="text-base font-bold text-slate-900">
                SK Resmi &amp; Absensi PTK / Pengawas
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Susun SK Pembagian Tugas sesuai urutan master PTK, SK
                Pengangkatan Guru, serta rekap kehadiran pegawai dan kunjungan
                pengawas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onStartDocument('sk_pembagian_tugas')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A5F] text-xs font-medium text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                SK Pembagian Tugas
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('absen_pegawai')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
                Absen Pegawai &amp; Pengawas
              </button>
            </div>
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch">
          <div className="sm:col-span-5 relative min-h-[170px] bg-slate-100">
            <SmartImage
              src={CLASSROOM_IMAGE_SRC}
              alt="Ruang kelas sekolah dasar yang terang dan tertata rapi"
              fallbackLabel="Kesiswaan & Absensi Kelas"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F]">
                Kesiswaan &amp; Akademik
              </p>
              <h2 className="text-base font-bold text-slate-900">
                Data Dapodik &amp; Absen Siswa Kelas / Mapel
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Impor data siswa lengkap dari Excel Dapodik dengan NIS &amp;
                NISN terintegrasi ke lembar absen kelas dan mata pelajaran.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('absen_siswa_kelas')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A5F] text-xs font-medium text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Absen Kelas
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('absen_siswa_mapel')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-slate-500" />
                Absen Mapel
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('students')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                Data Siswa
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* Filterable Template Catalog Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Layanan Pembuatan SK &amp; Surat Resmi SD
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Pilih jenis naskah dinas untuk mengisi formulir otomatis dan
              mencetak pada kertas F4 atau A4.
            </p>
          </div>

          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/70 border border-slate-200 self-start md:self-auto"
            role="tablist"
            aria-label="Filter kategori surat"
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'Semua'
                  ? DOC_TEMPLATES.length
                  : DOC_TEMPLATES.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white text-[#1E3A5F] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}{' '}
                  <span className="font-mono tabular-nums text-[11px] opacity-75">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => {
            const Icon = getTemplateIcon(tpl.type);
            return (
              <button
                key={tpl.type}
                type="button"
                onClick={() => onStartDocument(tpl.type)}
                className="group text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-[#1E3A5F]/50 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {tpl.category} ·{' '}
                      <span className="font-mono tabular-nums text-slate-600">
                        {tpl.classificationCode}
                      </span>
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#1E3A5F]/10 flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#1E3A5F] transition-colors" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#1E3A5F] transition-colors">
                    {tpl.label}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A5F] pt-1">
                  <span>Buat Dokumen</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Archive Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Buku Agenda Surat Keluar Terbaru
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('agenda')}
            className="text-xs font-semibold text-[#1E3A5F] hover:underline whitespace-nowrap"
          >
            Lihat Semua Arsip ({archives.length})
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {recentArchives.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-slate-500">
                Belum ada surat yang diarsipkan. Mulai buat dokumen dari daftar
                layanan di atas.
              </p>
              <button
                type="button"
                onClick={() => onStartDocument('sk_pengangkatan_guru')}
                className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] transition-colors"
              >
                Buat Dokumen Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Nomor Surat</th>
                    <th className="py-2.5 px-4">Perihal / Judul</th>
                    <th className="py-2.5 px-4">Subjek</th>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {recentArchives.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {item.nomorSurat}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {item.judul}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">
                        {item.subjekUtama}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatTanggalIndonesia(item.tanggalSurat)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenArchiveItem(item)}
                          className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                        >
                          Buka &amp; Cetak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
