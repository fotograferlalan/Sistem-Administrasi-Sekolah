import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SchoolProfile, Student } from '../types/admin';
import { formatTanggalIndonesia } from '../utils/formatters';
import {
  exportStudentsToDapodikExcel,
  parseDapodikStudentSheet,
  ParsedDapodikStudentSheetResult,
  ParsedDapodikStudentWorkbook,
  readDapodikStudentExcelFile,
} from '../utils/dapodikStudentImport';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15';
const labelCls = 'block text-xs font-medium text-slate-700 mb-1';

interface StudentsViewProps {
  students: Student[];
  school: SchoolProfile;
  onSaveStudents: (next: Student[]) => void;
}

const KELAS_FILTERS = ['Semua', 'I', 'II', 'III', 'IV', 'V', 'VI'] as const;

function matchStudentClass(studentKelas: string, filterRoman: string): boolean {
  if (filterRoman === 'Semua') return true;
  const normalized = (studentKelas || '').toUpperCase().trim();
  const digitMap: Record<string, string> = {
    I: '1',
    II: '2',
    III: '3',
    IV: '4',
    V: '5',
    VI: '6',
  };
  const romanMatch = normalized.match(/\b(VI|IV|III|II|I|V)\b/);
  if (romanMatch) {
    return romanMatch[1] === filterRoman;
  }
  const digit = digitMap[filterRoman];
  if (digit) {
    const digitRegex = new RegExp(`\\b${digit}[A-Z]?\\b`);
    if (digitRegex.test(normalized)) return true;
  }
  return false;
}

function createEmptyStudent(): Student {
  return {
    id: `sis-${Date.now()}`,
    nama: '',
    nis: '',
    nisn: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '2016-01-01',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    kelas: 'IV (Empat)',
    rombel: 'Kelas 4',
    namaAyah: '',
    namaIbu: '',
    pekerjaanOrtu: 'Wiraswasta',
    alamatOrtu: '',
    noKk: '',
    noAktaLahir: '',
    anakKe: '1',
    jumlahSaudara: '1',
    sekolahAsal: '',
    jenisTinggal: 'Bersama orang tua',
    alatTransportasi: 'Jalan kaki',
    noHp: '',
    email: '',
    rt: '',
    rw: '',
    dusun: '',
    desaKelurahan: '',
    kecamatan: '',
    kodePos: '',
    penerimaKps: 'Tidak',
    noKps: '',
    penerimaKip: 'Tidak',
    noKip: '',
    nikAyah: '',
    tahunLahirAyah: '',
    pendidikanAyah: 'SMA / Sederajat',
    pekerjaanAyah: '',
    penghasilanAyah: '',
    nikIbu: '',
    tahunLahirIbu: '',
    pendidikanIbu: 'SMA / Sederajat',
    pekerjaanIbu: '',
    penghasilanIbu: '',
    namaWali: '',
    nikWali: '',
    pendidikanWali: '',
    pekerjaanWali: '',
    penghasilanWali: '',
  };
}

function normalizeStudentMatchKey(s: Student): string {
  const nisn = (s.nisn || '').replace(/\D/g, '');
  if (nisn.length >= 8) return `nisn:${nisn}`;
  const nik = (s.nik || '').replace(/\D/g, '');
  if (nik.length >= 12) return `nik:${nik}`;
  const nis = (s.nis || '').replace(/\D/g, '');
  if (nis.length >= 3) return `nis:${nis}`;
  return `nama:${s.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  school,
  onSaveStudents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('Semua');

  // Form state
  const [editing, setEditing] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Detail modal state
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // Dapodik Excel Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedWorkbook, setParsedWorkbook] =
    useState<ParsedDapodikStudentWorkbook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [parsedSheet, setParsedSheet] =
    useState<ParsedDapodikStudentSheetResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchClass = matchStudentClass(s.kelas, classFilter);
      const matchQuery =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        (s.nis || '').toLowerCase().includes(q) ||
        (s.nisn || '').toLowerCase().includes(q) ||
        (s.nik || '').toLowerCase().includes(q) ||
        (s.namaAyah || '').toLowerCase().includes(q) ||
        (s.namaIbu || '').toLowerCase().includes(q) ||
        (s.kelas || '').toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [students, searchQuery, classFilter]);

  const stats = useMemo(() => {
    const maleCount = students.filter(
      (s) => s.jenisKelamin === 'Laki-laki'
    ).length;
    const femaleCount = students.filter(
      (s) => s.jenisKelamin === 'Perempuan'
    ).length;
    const kipCount = students.filter(
      (s) =>
        (s.penerimaKip || '').toLowerCase() === 'ya' ||
        (s.noKip && s.noKip !== '-')
    ).length;
    const rombelSet = new Set(
      students.map((s) => (s.rombel || s.kelas || '').trim()).filter(Boolean)
    );
    return {
      maleCount,
      femaleCount,
      kipCount,
      rombelCount: rombelSet.size,
    };
  }, [students]);

  const openNew = () => {
    setEditing(createEmptyStudent());
    setIsFormOpen(true);
    setDetailStudent(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.nama.trim()) return;
    const exists = students.some((s) => s.id === editing.id);
    const updatedRecord: Student = {
      ...editing,
      pekerjaanOrtu:
        editing.pekerjaanAyah ||
        editing.pekerjaanIbu ||
        editing.pekerjaanOrtu ||
        '-',
    };
    if (exists) {
      onSaveStudents(
        students.map((s) => (s.id === updatedRecord.id ? updatedRecord : s))
      );
    } else {
      onSaveStudents([...students, updatedRecord]);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleExcelFileSelect = async (file: File) => {
    setImportError(null);
    setImportSuccessNotice(null);
    try {
      const wb = await readDapodikStudentExcelFile(file);
      setImportFileName(file.name);
      setParsedWorkbook(wb);
      setSelectedSheet(wb.recommendedSheet);
      const sheetRes = parseDapodikStudentSheet(
        wb.workbook,
        wb.recommendedSheet
      );
      setParsedSheet(sheetRes);
      if (sheetRes.students.length === 0) {
        setImportError(
          'Tidak ditemukan baris data Peserta Didik pada sheet terpilih. Pastikan file adalah unduhan Excel Peserta Didik (PD) dari Dapodik atau pilih sheet lain.'
        );
      }
    } catch {
      setImportError(
        'Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.'
      );
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!parsedWorkbook) return;
    setSelectedSheet(sheetName);
    setImportError(null);
    const res = parseDapodikStudentSheet(parsedWorkbook.workbook, sheetName);
    setParsedSheet(res);
    if (res.students.length === 0) {
      setImportError(
        `Tidak ditemukan kolom Peserta Didik (Nama / NISN / NIPD) pada sheet "${sheetName}".`
      );
    }
  };

  const handleConfirmImport = () => {
    if (!parsedSheet || parsedSheet.students.length === 0) return;

    if (importMode === 'replace') {
      onSaveStudents(parsedSheet.students);
      setImportSuccessNotice(
        `${parsedSheet.students.length} data siswa berhasil diimpor (mengganti data sebelumnya).`
      );
    } else {
      const next = [...students];
      const indexByKey = new Map<string, number>();
      next.forEach((s, i) =>
        indexByKey.set(normalizeStudentMatchKey(s), i)
      );

      let added = 0;
      let updated = 0;
      for (const imp of parsedSheet.students) {
        const key = normalizeStudentMatchKey(imp);
        const existingIdx = indexByKey.get(key);
        if (existingIdx !== undefined) {
          next[existingIdx] = {
            ...next[existingIdx],
            ...imp,
            id: next[existingIdx].id,
          };
          updated++;
        } else {
          indexByKey.set(key, next.length);
          next.push(imp);
          added++;
        }
      }
      onSaveStudents(next);
      setImportSuccessNotice(
        `Impor Dapodik selesai: ${added} siswa ditambahkan, ${updated} data siswa diperbarui.`
      );
    }

    setParsedWorkbook(null);
    setParsedSheet(null);
    setImportFileName('');
    setIsImportOpen(false);
    setTimeout(() => setImportSuccessNotice(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">
      {/* Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Data Peserta Didik (Siswa SD)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Master data siswa lengkap sesuai struktur Dapodik beserta impor Excel Peserta Didik (.xlsx / .xls).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsImportOpen((prev) => !prev);
              setImportError(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-[#1E3A5F]" />
            Impor Excel Dapodik
          </button>

          <button
            type="button"
            onClick={() =>
              exportStudentsToDapodikExcel(students, school.namaSekolah)
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Excel
          </button>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <p className="text-xs text-slate-500">Total Peserta Didik</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
            {students.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Laki-laki / Perempuan</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
            {stats.maleCount} / {stats.femaleCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Jumlah Rombel / Kelas</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
            {stats.rombelCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Penerima KIP / PIP</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
            {stats.kipCount}
          </p>
        </div>
      </div>

      {importSuccessNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium text-emerald-800">
          <span className="inline-flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {importSuccessNotice}
          </span>
          <button
            type="button"
            onClick={() => setImportSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DAPODIK EXCEL IMPORT PANEL */}
      {isImportOpen && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
                Impor Excel Peserta Didik dari Dapodik
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Mendukung file ekspor <strong>Daftar Peserta Didik.xlsx</strong>,{' '}
                <strong>Profil Sekolah Dapodik</strong> (sheet PD/Peserta Didik), maupun file Excel/CSV berheader Nama, NIPD, NISN, NIK, No. KK, Akta Lahir, Rombel, KIP/KPS, dan Data Ayah/Ibu/Wali.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Tutup panel impor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleExcelFileSelect(f);
              e.target.value = '';
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {importFileName
                      ? `File terpilih: ${importFileName}`
                      : 'Pilih file Excel Dapodik Peserta Didik (.xlsx / .xls / .csv)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pembacaan header ganda (Data Ayah / Data Ibu / Data Wali) otomatis terdeteksi di browser tanpa unggah ke server.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pilih File Excel
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Mode Penggabungan Data</label>
              <select
                value={importMode}
                onChange={(e) =>
                  setImportMode(e.target.value as 'merge' | 'replace')
                }
                className={inputCls}
              >
                <option value="merge">
                  Gabung &amp; Perbarui (Cek NISN / NIK)
                </option>
                <option value="replace">
                  Ganti Seluruh Data Siswa Saat Ini
                </option>
              </select>
            </div>
          </div>

          {parsedWorkbook && parsedWorkbook.sheetNames.length > 1 && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs font-medium text-slate-700">
                Pilih Sheet Workbook ({parsedWorkbook.sheetNames.length}):
              </span>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
              >
                {parsedWorkbook.sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {importError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              {importError}
            </div>
          )}

          {parsedSheet && parsedSheet.students.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-700">
                  Berhasil membaca{' '}
                  <strong className="text-slate-900 tabular-nums">
                    {parsedSheet.students.length} Peserta Didik
                  </strong>{' '}
                  dari sheet <strong>{parsedSheet.sheetName}</strong> (baris
                  header ke-{parsedSheet.headerRowIndex + 1},{' '}
                  {parsedSheet.detectedColumns.length} kolom terdeteksi).
                </div>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan {parsedSheet.students.length} Siswa ke Master Data
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3">NIPD / NISN</th>
                      <th className="py-2 px-3">L/P</th>
                      <th className="py-2 px-3">Kelas / Rombel</th>
                      <th className="py-2 px-3">TTL</th>
                      <th className="py-2 px-3">Ayah / Ibu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {parsedSheet.students.slice(0, 50).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-center text-slate-500 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-slate-900">
                          {s.nama}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-700 tabular-nums">
                          {s.nis} / {s.nisn}
                        </td>
                        <td className="py-1.5 px-3 text-slate-700">
                          {s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800">
                          {s.kelas}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">
                          {s.tempatLahir}, {formatTanggalIndonesia(s.tanggalLahir)}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">
                          {s.namaAyah} / {s.namaIbu}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ADD / EDIT COMPLETE STUDENT FORM */}
      {isFormOpen && editing && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              {students.some((s) => s.id === editing.id)
                ? 'Edit Data Peserta Didik Lengkap (Dapodik)'
                : 'Tambah Data Peserta Didik Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Tutup
            </button>
          </div>

          {/* Section 1: Identitas Utama */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              1. Identitas Peserta Didik
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Nama Lengkap Siswa *</label>
                <input
                  required
                  type="text"
                  value={editing.nama}
                  onChange={(e) =>
                    setEditing({ ...editing, nama: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>NIPD / NIS</label>
                <input
                  type="text"
                  value={editing.nis}
                  onChange={(e) =>
                    setEditing({ ...editing, nis: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>NISN</label>
                <input
                  type="text"
                  value={editing.nisn}
                  onChange={(e) =>
                    setEditing({ ...editing, nisn: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>NIK Siswa</label>
                <input
                  type="text"
                  value={editing.nik}
                  onChange={(e) =>
                    setEditing({ ...editing, nik: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Nomor KK</label>
                <input
                  type="text"
                  value={editing.noKk || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, noKk: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>No. Registrasi Akta Lahir</label>
                <input
                  type="text"
                  value={editing.noAktaLahir || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, noAktaLahir: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Tempat Lahir</label>
                <input
                  type="text"
                  value={editing.tempatLahir}
                  onChange={(e) =>
                    setEditing({ ...editing, tempatLahir: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tanggal Lahir</label>
                <input
                  type="date"
                  value={editing.tanggalLahir}
                  onChange={(e) =>
                    setEditing({ ...editing, tanggalLahir: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Jenis Kelamin</label>
                  <select
                    value={editing.jenisKelamin}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        jenisKelamin: e.target.value as
                          | 'Laki-laki'
                          | 'Perempuan',
                      })
                    }
                    className={inputCls}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Agama</label>
                  <input
                    type="text"
                    value={editing.agama}
                    onChange={(e) =>
                      setEditing({ ...editing, agama: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Rombel & Bantuan */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Rombel, Sekolah Asal &amp; KIP/KPS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Kelas / Rombel Saat Ini</label>
                <input
                  type="text"
                  value={editing.kelas}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      kelas: e.target.value,
                      rombel: e.target.value,
                    })
                  }
                  placeholder="Contoh: V (Lima) / Kelas 5"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sekolah Asal (TK/PAUD/SD)</label>
                <input
                  type="text"
                  value={editing.sekolahAsal || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, sekolahAsal: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Anak Ke-</label>
                  <input
                    type="text"
                    value={editing.anakKe || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, anakKe: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Jml Saudara</label>
                  <input
                    type="text"
                    value={editing.jumlahSaudara || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, jumlahSaudara: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Jenis Tinggal</label>
                <input
                  type="text"
                  value={editing.jenisTinggal || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, jenisTinggal: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Penerima KIP</label>
                  <select
                    value={editing.penerimaKip || 'Tidak'}
                    onChange={(e) =>
                      setEditing({ ...editing, penerimaKip: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nomor KIP / PIP</label>
                  <input
                    type="text"
                    value={editing.noKip || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, noKip: e.target.value })
                    }
                    className={`${inputCls} font-mono text-xs`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Penerima KPS</label>
                  <select
                    value={editing.penerimaKps || 'Tidak'}
                    onChange={(e) =>
                      setEditing({ ...editing, penerimaKps: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>No. KPS</label>
                  <input
                    type="text"
                    value={editing.noKps || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, noKps: e.target.value })
                    }
                    className={`${inputCls} font-mono text-xs`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Data Orang Tua & Wali */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              3. Data Ayah, Ibu &amp; Wali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Nama Ayah</label>
                <input
                  type="text"
                  value={editing.namaAyah}
                  onChange={(e) =>
                    setEditing({ ...editing, namaAyah: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>NIK Ayah</label>
                <input
                  type="text"
                  value={editing.nikAyah || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nikAyah: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Pekerjaan Ayah</label>
                <input
                  type="text"
                  value={editing.pekerjaanAyah || editing.pekerjaanOrtu}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      pekerjaanAyah: e.target.value,
                      pekerjaanOrtu: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nama Ibu Kandung</label>
                <input
                  type="text"
                  value={editing.namaIbu}
                  onChange={(e) =>
                    setEditing({ ...editing, namaIbu: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>NIK Ibu</label>
                <input
                  type="text"
                  value={editing.nikIbu || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nikIbu: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Pekerjaan Ibu</label>
                <input
                  type="text"
                  value={editing.pekerjaanIbu || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, pekerjaanIbu: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nama Wali (jika ada)</label>
                <input
                  type="text"
                  value={editing.namaWali || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, namaWali: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>No. HP Orang Tua / Wali</label>
                <input
                  type="text"
                  value={editing.noHp || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, noHp: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Alamat Lengkap</label>
                <input
                  type="text"
                  value={editing.alamatOrtu}
                  onChange={(e) =>
                    setEditing({ ...editing, alamatOrtu: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white"
            >
              Simpan Data Siswa
            </button>
          </div>
        </form>
      )}

      {/* DETAIL MODAL */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {detailStudent.nama}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelas {detailStudent.kelas} · NIS {detailStudent.nis || '-'} ·
                  NISN {detailStudent.nisn || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-800 uppercase tracking-wide text-[11px]">
                  Identitas &amp; Kependudukan
                </p>
                <p>
                  <span className="text-slate-500">TTL:</span>{' '}
                  {detailStudent.tempatLahir},{' '}
                  {formatTanggalIndonesia(detailStudent.tanggalLahir)}
                </p>
                <p>
                  <span className="text-slate-500">Jenis Kelamin:</span>{' '}
                  {detailStudent.jenisKelamin} · {detailStudent.agama}
                </p>
                <p className="font-mono">
                  <span className="text-slate-500 font-sans">NIK:</span>{' '}
                  {detailStudent.nik || '-'}
                </p>
                <p className="font-mono">
                  <span className="text-slate-500 font-sans">No. KK:</span>{' '}
                  {detailStudent.noKk || '-'}
                </p>
                <p className="font-mono">
                  <span className="text-slate-500 font-sans">
                    No. Akta Lahir:
                  </span>{' '}
                  {detailStudent.noAktaLahir || '-'}
                </p>
                <p>
                  <span className="text-slate-500">KIP / KPS:</span>{' '}
                  {detailStudent.penerimaKip || 'Tidak'} (
                  {detailStudent.noKip || '-'}) /{' '}
                  {detailStudent.penerimaKps || 'Tidak'}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-slate-800 uppercase tracking-wide text-[11px]">
                  Orang Tua &amp; Alamat
                </p>
                <p>
                  <span className="text-slate-500">Ayah:</span>{' '}
                  {detailStudent.namaAyah || '-'} (
                  {detailStudent.pekerjaanAyah ||
                    detailStudent.pekerjaanOrtu ||
                    '-'}
                  )
                </p>
                <p>
                  <span className="text-slate-500">Ibu Kandung:</span>{' '}
                  {detailStudent.namaIbu || '-'} (
                  {detailStudent.pekerjaanIbu || '-'})
                </p>
                {detailStudent.namaWali && (
                  <p>
                    <span className="text-slate-500">Wali:</span>{' '}
                    {detailStudent.namaWali} (
                    {detailStudent.pekerjaanWali || '-'})
                  </p>
                )}
                <p>
                  <span className="text-slate-500">No. HP / Email:</span>{' '}
                  {detailStudent.noHp || '-'} / {detailStudent.email || '-'}
                </p>
                <p>
                  <span className="text-slate-500">Alamat:</span>{' '}
                  {detailStudent.alamatOrtu || '-'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setEditing({ ...detailStudent });
                  setDetailStudent(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white"
              >
                Edit Data Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Class Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {KELAS_FILTERS.map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => setClassFilter(cls)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                classFilter === cls
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cls === 'Semua' ? 'Semua Kelas' : `Kelas ${cls}`}
            </button>
          ))}
        </div>

        <div className="relative md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, NISN, NIK, ortu..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NIPD / NISN / NIK</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">TTL</th>
                <th className="py-3 px-4">Orang Tua (Ayah / Ibu)</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 text-center text-xs text-slate-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-900">{s.nama}</div>
                    <div className="text-xs text-slate-500">
                      {s.jenisKelamin} · {s.agama}
                      {s.noKip && s.noKip !== '-' ? ` · KIP ${s.noKip}` : ''}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                    <div>NIS: {s.nis || '-'}</div>
                    <div className="text-slate-500">NISN: {s.nisn || '-'}</div>
                    {s.nik && s.nik !== '-' && (
                      <div className="text-[11px] text-slate-400">
                        NIK: {s.nik}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                    Kelas {s.kelas}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    {s.tempatLahir}, {formatTanggalIndonesia(s.tanggalLahir)}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    <div className="font-medium text-slate-800">
                      {s.namaAyah || '-'} / {s.namaIbu || '-'}
                    </div>
                    <div className="truncate max-w-[220px]">
                      {s.alamatOrtu || '-'}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDetailStudent(s)}
                        className="text-xs font-medium text-slate-600 hover:text-[#1E3A5F]"
                        title="Lihat detail lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({ ...s });
                          setIsFormOpen(true);
                          setDetailStudent(null);
                        }}
                        className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveStudents(students.filter((x) => x.id !== s.id))
                        }
                        className="text-xs text-rose-600 hover:text-rose-700"
                        title="Hapus data siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 px-4 text-center text-xs text-slate-500"
                  >
                    Tidak ada data siswa yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
