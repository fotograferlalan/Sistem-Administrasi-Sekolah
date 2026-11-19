import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  GripVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SchoolProfile, Teacher } from '../types/admin';
import { formatTanggalIndonesia } from '../utils/formatters';
import {
  exportTeachersToDapodikExcel,
  parseDapodikSheet,
  ParsedDapodikSheetResult,
  ParsedDapodikWorkbook,
  readDapodikExcelFile,
  sortTeachersKepalaFirst,
} from '../utils/dapodikImport';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15';
const labelCls = 'block text-xs font-medium text-slate-700 mb-1';

interface TeachersViewProps {
  teachers: Teacher[];
  school: SchoolProfile;
  onSaveTeachers: (next: Teacher[]) => void;
}

const STATUS_FILTERS: Array<'Semua' | Teacher['statusKepegawaian']> = [
  'Semua',
  'PNS',
  'PPPK',
  'GTT / Honorer',
  'GTY',
  'Tendik',
];

function createEmptyTeacher(): Teacher {
  return {
    id: `ptk-${Date.now()}`,
    nama: '',
    nip: '-',
    nuptk: '-',
    nik: '-',
    nrg: '-',
    npwp: '-',
    tempatLahir: '',
    tanggalLahir: '1992-01-01',
    jenisKelamin: 'P',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    namaIbuKandung: '',
    pendidikanTerakhir: 'S1 PGSD',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Guru Sekolah Dasar',
    sertifikasiPendidik: 'Belum Sertifikasi',
    pangkatGolongan: '-',
    statusKepegawaian: 'GTT / Honorer',
    jenisPtk: 'Guru Kelas',
    jabatan: 'Guru Kelas',
    mengajarMapel: '-',
    tugasTambahan: '-',
    jamTatapMuka: 24,
    jamTugasTambahan: 0,
    skPengangkatan: '-',
    tmtMulai: '2024-07-01',
    lembagaPengangkat: 'Kepala Sekolah',
    sumberGaji: 'Dana BOSP',
    nomorSuratTugas: '-',
    tanggalSuratTugas: '',
    noHp: '-',
    email: '-',
    alamat: '',
    desaKelurahan: '',
    kecamatan: '',
    kodePos: '',
  };
}

function normalizeMatchKey(t: Teacher): string {
  const nik = (t.nik || '').replace(/\D/g, '');
  if (nik.length >= 12) return `nik:${nik}`;
  const nuptk = (t.nuptk || '').replace(/\D/g, '');
  if (nuptk.length >= 12) return `nuptk:${nuptk}`;
  const nip = (t.nip || '').replace(/\D/g, '');
  if (nip.length >= 12) return `nip:${nip}`;
  return `nama:${t.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  school,
  onSaveTeachers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'Semua' | Teacher['statusKepegawaian']
  >('Semua');

  // Form state
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Detail drawer state
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);

  // Dapodik Excel Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedWorkbook, setParsedWorkbook] =
    useState<ParsedDapodikWorkbook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [parsedSheet, setParsedSheet] =
    useState<ParsedDapodikSheetResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(
    null
  );

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const isManualOrderActive =
    statusFilter === 'Semua' && searchQuery.trim() === '';

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teachers.filter((t) => {
      const matchStatus =
        statusFilter === 'Semua' || t.statusKepegawaian === statusFilter;
      const matchQuery =
        !q ||
        t.nama.toLowerCase().includes(q) ||
        (t.nip || '').toLowerCase().includes(q) ||
        (t.nuptk || '').toLowerCase().includes(q) ||
        (t.nik || '').toLowerCase().includes(q) ||
        t.jabatan.toLowerCase().includes(q) ||
        (t.jenisPtk || '').toLowerCase().includes(q) ||
        (t.tugasTambahan || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [teachers, searchQuery, statusFilter]);

  const handleMoveStep = (id: string, direction: -1 | 1) => {
    const idx = teachers.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= teachers.length) return;
    const next = [...teachers];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    onSaveTeachers(next);
  };

  const handleDropReorder = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = teachers.findIndex((t) => t.id === draggedId);
    const toIdx = teachers.findIndex((t) => t.id === targetId);
    if (fromIdx !== -1 && toIdx !== -1) {
      const next = [...teachers];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onSaveTeachers(next);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const stats = useMemo(() => {
    const asnCount = teachers.filter(
      (t) => t.statusKepegawaian === 'PNS' || t.statusKepegawaian === 'PPPK'
    ).length;
    const honorerCount = teachers.filter(
      (t) =>
        t.statusKepegawaian === 'GTT / Honorer' || t.statusKepegawaian === 'GTY'
    ).length;
    const tendikCount = teachers.filter(
      (t) => t.statusKepegawaian === 'Tendik'
    ).length;
    const totalJjm = teachers.reduce(
      (sum, t) => sum + (Number(t.jamTatapMuka) || 0),
      0
    );
    return { asnCount, honorerCount, tendikCount, totalJjm };
  }, [teachers]);

  const openNew = () => {
    setEditing(createEmptyTeacher());
    setIsFormOpen(true);
    setDetailTeacher(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.nama.trim()) return;
    const exists = teachers.some((t) => t.id === editing.id);
    const updatedRecord: Teacher = {
      ...editing,
      pendidikanTerakhir:
        editing.jenjangPendidikan && editing.jurusanProdi
          ? `${editing.jenjangPendidikan} ${editing.jurusanProdi}`
          : editing.pendidikanTerakhir,
    };
    if (exists) {
      onSaveTeachers(
        teachers.map((t) => (t.id === updatedRecord.id ? updatedRecord : t))
      );
    } else {
      onSaveTeachers([...teachers, updatedRecord]);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleExcelFileSelect = async (file: File) => {
    setImportError(null);
    setImportSuccessNotice(null);
    try {
      const wb = await readDapodikExcelFile(file);
      setImportFileName(file.name);
      setParsedWorkbook(wb);
      setSelectedSheet(wb.recommendedSheet);
      const sheetRes = parseDapodikSheet(wb.workbook, wb.recommendedSheet);
      setParsedSheet(sheetRes);
      if (sheetRes.teachers.length === 0) {
        setImportError(
          'Tidak ditemukan baris data PTK pada sheet terpilih. Pastikan file adalah unduhan Excel PTK dari Dapodik atau pilih sheet lain.'
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
    const sheetRes = parseDapodikSheet(parsedWorkbook.workbook, sheetName);
    setParsedSheet(sheetRes);
    if (sheetRes.teachers.length === 0) {
      setImportError(
        `Tidak ditemukan kolom "Nama" PTK yang dikenali pada sheet "${sheetName}".`
      );
    }
  };

  const existingKeySet = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((t) => map.set(normalizeMatchKey(t), t));
    return map;
  }, [teachers]);

  const handleConfirmImport = () => {
    if (!parsedSheet || parsedSheet.teachers.length === 0) return;

    if (importMode === 'replace') {
      onSaveTeachers(sortTeachersKepalaFirst(parsedSheet.teachers));
      setImportSuccessNotice(
        `Berhasil mengganti seluruh data dengan ${parsedSheet.teachers.length} PTK dari Dapodik.`
      );
    } else {
      const merged = [...teachers];
      let added = 0;
      let updated = 0;

      parsedSheet.teachers.forEach((incoming) => {
        const key = normalizeMatchKey(incoming);
        const existingIdx = merged.findIndex(
          (t) => normalizeMatchKey(t) === key
        );
        if (existingIdx !== -1) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            ...incoming,
            id: merged[existingIdx].id,
          };
          updated++;
        } else {
          merged.push(incoming);
          added++;
        }
      });

      onSaveTeachers(sortTeachersKepalaFirst(merged));
      setImportSuccessNotice(
        `Impor selesai: ${added} PTK baru ditambahkan, ${updated} PTK diperbarui.`
      );
    }

    setIsImportOpen(false);
    setParsedWorkbook(null);
    setParsedSheet(null);
    setTimeout(() => setImportSuccessNotice(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">
      {/* Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Data Guru &amp; Tenaga Kependidikan (PTK)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Database lengkap PTK sesuai struktur Dapodik untuk penerbitan SK Pengangkatan, SK Pembagian Tugas Mengajar, dan Surat Tugas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsImportOpen((v) => !v);
              setIsFormOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Impor Excel Dapodik
          </button>

          <button
            type="button"
            onClick={() =>
              exportTeachersToDapodikExcel(teachers, school.namaSekolah)
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Ekspor Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah PTK
          </button>
        </div>
      </div>

      {/* Import Feedback Banner */}
      {importSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs font-medium text-emerald-800">
          <span className="inline-flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            {importSuccessNotice}
          </span>
          <button
            type="button"
            onClick={() => setImportSuccessNotice(null)}
            className="text-emerald-700 hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500">Total PTK Terdaftar</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
            {teachers.length} Orang
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Guru ASN (PNS / PPPK)</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
            {stats.asnCount} Orang
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Guru Non-ASN (GTT / GTY)</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
            {stats.honorerCount} Orang
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tendik &amp; Total Jam Mengajar</p>
          <p className="text-sm font-semibold text-slate-900 tabular-nums mt-1.5">
            {stats.tendikCount} Tendik · {stats.totalJjm} JJM/Minggu
          </p>
        </div>
      </div>

      {/* DAPODIK EXCEL IMPORT PANEL */}
      {isImportOpen && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Impor Data PTK dari Unduhan Excel Dapodik
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Mendukung file unduhan langsung dari menu GTK Dapodik (<span className="font-mono">.xlsx</span>, <span className="font-mono">.xls</span>, <span className="font-mono">.csv</span>) maupun file <span className="font-mono">Profil Sekolah</span> multi-sheet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="p-1 text-slate-500 hover:text-slate-900"
              aria-label="Tutup panel impor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleExcelFileSelect(file);
              }}
              className="lg:col-span-2 border-2 border-dashed border-slate-300 hover:border-[#1E3A5F] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/60"
            >
              <Upload className="w-6 h-6 text-[#1E3A5F] mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                {importFileName
                  ? `File dipilih: ${importFileName}`
                  : 'Klik untuk memilih file Excel Dapodik atau seret ke sini'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Otomatis membaca baris header Dapodik (Nama, NUPTK, NIP, NIK, JK, Tempat/Tgl Lahir, Status, Jenis PTK, Pangkat, Pendidikan, Sertifikasi, TMT, SK, Mengajar, JJM, Tugas Tambahan, HP, Email, Alamat).
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleExcelFileSelect(file);
                }}
              />
            </label>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                Belum punya file contoh?
              </p>
              <p>
                Unduh file Excel berformat kolom Dapodik dari data saat ini untuk melihat struktur kolom yang didukung atau diedit massal di Microsoft Excel.
              </p>
              <button
                type="button"
                onClick={() =>
                  exportTeachersToDapodikExcel(teachers, school.namaSekolah)
                }
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Contoh Format Dapodik
              </button>
            </div>
          </div>

          {importError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5 text-xs font-medium text-rose-700">
              {importError}
            </div>
          )}

          {parsedWorkbook && parsedSheet && parsedSheet.teachers.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {parsedWorkbook.sheetNames.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Sheet:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900"
                      >
                        {parsedWorkbook.sheetNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <span className="text-slate-600">
                    Header terdeteksi pada baris{' '}
                    <strong className="tabular-nums">
                      #{parsedSheet.headerRowIndex + 1}
                    </strong>{' '}
                    ·{' '}
                    <strong className="tabular-nums">
                      {parsedSheet.teachers.length} PTK
                    </strong>{' '}
                    siap diimpor
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    Gabung &amp; Perbarui yang Cocok
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    Ganti Semua Data PTK
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">Nama PTK</th>
                      <th className="py-2 px-3">NIP / NUPTK / NIK</th>
                      <th className="py-2 px-3">Status &amp; Jenis PTK</th>
                      <th className="py-2 px-3">Pendidikan</th>
                      <th className="py-2 px-3 text-right">JJM</th>
                      <th className="py-2 px-3">Aksi Impor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedSheet.teachers.map((item, idx) => {
                      const isExisting =
                        importMode === 'merge' &&
                        existingKeySet.has(normalizeMatchKey(item));
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-500 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {item.nama} ({item.jenisKelamin})
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 tabular-nums">
                            <div>NIP: {item.nip}</div>
                            <div>NUPTK: {item.nuptk}</div>
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            <div>{item.statusKepegawaian}</div>
                            <div className="text-slate-500">{item.jenisPtk}</div>
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {item.pendidikanTerakhir}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">
                            {item.jamTatapMuka ?? 0}
                          </td>
                          <td className="py-2 px-3">
                            {importMode === 'replace' ? (
                              <span className="text-amber-700 font-medium">
                                Data Baru
                              </span>
                            ) : isExisting ? (
                              <span className="text-[#1E3A5F] font-medium">
                                Perbarui
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">
                                Tambah Baru
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedWorkbook(null);
                    setParsedSheet(null);
                    setImportFileName('');
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Reset File
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49]"
                >
                  <Check className="w-4 h-4" />
                  Terapkan Impor ({parsedSheet.teachers.length} PTK)
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* COMPREHENSIVE PTK ADD / EDIT FORM */}
      {isFormOpen && editing && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              {teachers.some((t) => t.id === editing.id)
                ? `Edit Data Lengkap PTK — ${editing.nama}`
                : 'Tambah Data PTK Baru (Format Lengkap Dapodik)'}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Tutup
            </button>
          </div>

          {/* 1. Identitas Pribadi */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              1. Identitas Pribadi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className={labelCls}>Nama Lengkap &amp; Gelar</label>
                <input
                  required
                  type="text"
                  value={editing.nama}
                  onChange={(e) =>
                    setEditing({ ...editing, nama: e.target.value })
                  }
                  placeholder="Contoh: Nadia Kusuma Wardani, S.Pd."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>NIK (16 Digit)</label>
                <input
                  type="text"
                  value={editing.nik || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nik: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Jenis Kelamin</label>
                <select
                  value={editing.jenisKelamin}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      jenisKelamin: e.target.value as 'L' | 'P',
                    })
                  }
                  className={inputCls}
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
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
              <div>
                <label className={labelCls}>Agama</label>
                <input
                  type="text"
                  value={editing.agama || 'Islam'}
                  onChange={(e) =>
                    setEditing({ ...editing, agama: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nama Ibu Kandung</label>
                <input
                  type="text"
                  value={editing.namaIbuKandung || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, namaIbuKandung: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* 2. Kepegawaian & SK */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Status Kepegawaian &amp; SK Pengangkatan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Status Kepegawaian</label>
                <select
                  value={editing.statusKepegawaian}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      statusKepegawaian: e.target
                        .value as Teacher['statusKepegawaian'],
                    })
                  }
                  className={inputCls}
                >
                  <option value="PNS">PNS</option>
                  <option value="PPPK">PPPK</option>
                  <option value="GTT / Honorer">GTT / Honorer</option>
                  <option value="GTY">GTY</option>
                  <option value="Tendik">Tendik</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Jenis PTK</label>
                <input
                  type="text"
                  value={editing.jenisPtk || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, jenisPtk: e.target.value })
                  }
                  placeholder="Guru Kelas / Guru Mapel / TAS"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>NIP</label>
                <input
                  type="text"
                  value={editing.nip}
                  onChange={(e) =>
                    setEditing({ ...editing, nip: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>NUPTK</label>
                <input
                  type="text"
                  value={editing.nuptk}
                  onChange={(e) =>
                    setEditing({ ...editing, nuptk: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Pangkat / Golongan</label>
                <input
                  type="text"
                  value={editing.pangkatGolongan}
                  onChange={(e) =>
                    setEditing({ ...editing, pangkatGolongan: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nomor SK Pengangkatan</label>
                <input
                  type="text"
                  value={editing.skPengangkatan || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, skPengangkatan: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>TMT Pengangkatan / Mulai</label>
                <input
                  type="date"
                  value={editing.tmtMulai}
                  onChange={(e) =>
                    setEditing({ ...editing, tmtMulai: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Lembaga Pengangkat</label>
                <input
                  type="text"
                  value={editing.lembagaPengangkat || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      lembagaPengangkat: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sumber Gaji / Honor</label>
                <input
                  type="text"
                  value={editing.sumberGaji || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, sumberGaji: e.target.value })
                  }
                  placeholder="APBD / Dana BOSP / Yayasan"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>NRG</label>
                <input
                  type="text"
                  value={editing.nrg || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nrg: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>NPWP</label>
                <input
                  type="text"
                  value={editing.npwp || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, npwp: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
            </div>
          </div>

          {/* 3. Pendidikan & Beban Tugas */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              3. Pendidikan, Sertifikasi &amp; Beban Mengajar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Jenjang Pendidikan</label>
                <input
                  type="text"
                  value={editing.jenjangPendidikan || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      jenjangPendidikan: e.target.value,
                    })
                  }
                  placeholder="S1 / S2 / D3"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Jurusan / Prodi</label>
                <input
                  type="text"
                  value={editing.jurusanProdi || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, jurusanProdi: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sertifikasi Pendidik</label>
                <input
                  type="text"
                  value={editing.sertifikasiPendidik || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sertifikasiPendidik: e.target.value,
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Jabatan / Kelas Ampu</label>
                <input
                  type="text"
                  value={editing.jabatan}
                  onChange={(e) =>
                    setEditing({ ...editing, jabatan: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Mata Pelajaran / Mengajar</label>
                <input
                  type="text"
                  value={editing.mengajarMapel || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, mengajarMapel: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>JJM / Jam Tatap Muka</label>
                <input
                  type="number"
                  min={0}
                  value={editing.jamTatapMuka ?? 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      jamTatapMuka: Number(e.target.value) || 0,
                    })
                  }
                  className={`${inputCls} font-mono tabular-nums`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Tugas Tambahan di Sekolah</label>
                <input
                  type="text"
                  value={editing.tugasTambahan || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, tugasTambahan: e.target.value })
                  }
                  placeholder="Wali Kelas, Kepala Perpustakaan, Operator Dapodik, dll."
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* 4. Kontak & Alamat */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              4. Kontak &amp; Alamat Domisili
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={editing.noHp || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, noHp: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>Email (belajar.id / Pribadi)</label>
                <input
                  type="email"
                  value={editing.email || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Alamat Lengkap</label>
                <input
                  type="text"
                  value={editing.alamat}
                  onChange={(e) =>
                    setEditing({ ...editing, alamat: e.target.value })
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
              className="px-5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49]"
            >
              Simpan Data PTK
            </button>
          </div>
        </form>
      )}

      {/* PTK DETAIL MODAL/PANEL */}
      {detailTeacher && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <p className="text-xs text-slate-500">
                {detailTeacher.statusKepegawaian} ·{' '}
                {detailTeacher.jenisPtk || detailTeacher.jabatan}
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                {detailTeacher.nama}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing({ ...detailTeacher });
                  setIsFormOpen(true);
                  setDetailTeacher(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#1E3A5F] hover:bg-slate-50"
              >
                Edit Data
              </button>
              <button
                type="button"
                onClick={() => setDetailTeacher(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
                aria-label="Tutup detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <p className="font-semibold text-slate-800 uppercase tracking-wider">
                Identitas &amp; Nomor Induk
              </p>
              <dl className="space-y-1.5">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">NIK</dt>
                  <dd className="font-mono text-slate-900">
                    {detailTeacher.nik || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">NIP</dt>
                  <dd className="font-mono text-slate-900">
                    {detailTeacher.nip || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">NUPTK</dt>
                  <dd className="font-mono text-slate-900">
                    {detailTeacher.nuptk || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">NRG</dt>
                  <dd className="font-mono text-slate-900">
                    {detailTeacher.nrg || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">TTL</dt>
                  <dd className="text-slate-900 text-right">
                    {detailTeacher.tempatLahir},{' '}
                    {formatTanggalIndonesia(detailTeacher.tanggalLahir)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Jenis Kelamin / Agama</dt>
                  <dd className="text-slate-900">
                    {detailTeacher.jenisKelamin === 'L'
                      ? 'Laki-laki'
                      : 'Perempuan'}{' '}
                    / {detailTeacher.agama || 'Islam'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-slate-800 uppercase tracking-wider">
                Kepegawaian &amp; Penugasan
              </p>
              <dl className="space-y-1.5">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Pangkat / Golongan</dt>
                  <dd className="text-slate-900">
                    {detailTeacher.pangkatGolongan || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">SK Pengangkatan</dt>
                  <dd className="font-mono text-slate-900 text-right">
                    {detailTeacher.skPengangkatan || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">TMT Mulai</dt>
                  <dd className="text-slate-900">
                    {formatTanggalIndonesia(detailTeacher.tmtMulai)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Lembaga / Sumber Gaji</dt>
                  <dd className="text-slate-900 text-right">
                    {detailTeacher.lembagaPengangkat || '-'} ·{' '}
                    {detailTeacher.sumberGaji || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Mengajar / JJM</dt>
                  <dd className="text-slate-900 text-right">
                    {detailTeacher.mengajarMapel || detailTeacher.jabatan} (
                    {detailTeacher.jamTatapMuka ?? 0} JJM)
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Tugas Tambahan</dt>
                  <dd className="text-slate-900 text-right">
                    {detailTeacher.tugasTambahan || '-'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-slate-800 uppercase tracking-wider">
                Pendidikan &amp; Kontak
              </p>
              <dl className="space-y-1.5">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Pendidikan</dt>
                  <dd className="text-slate-900 text-right">
                    {detailTeacher.pendidikanTerakhir}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Sertifikasi</dt>
                  <dd className="text-slate-900 text-right">
                    {detailTeacher.sertifikasiPendidik || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">No. HP</dt>
                  <dd className="font-mono text-slate-900">
                    {detailTeacher.noHp || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-slate-900 text-right break-all">
                    {detailTeacher.email || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-0.5">Alamat</dt>
                  <dd className="text-slate-900">{detailTeacher.alamat}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSaveTeachers(sortTeachersKepalaFirst(teachers))}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            title="Tempatkan Kepala Sekolah di urutan nomor 1"
          >
            Kepala Sekolah ke #1
          </button>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP, NUPTK, NIK, jabatan..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main High-Density PTK Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredTeachers.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {teachers.length === 0
                ? 'Belum ada data Guru / PTK terdaftar.'
                : 'Tidak ada PTK yang sesuai dengan filter atau pencarian.'}
            </p>
            <div className="flex justify-center gap-2">
              {teachers.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white"
                >
                  Impor dari Excel Dapodik
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('Semua');
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-3 w-24 text-center">Urutan</th>
                  <th className="py-3 px-4">Nama PTK &amp; Pendidikan</th>
                  <th className="py-3 px-4">NIP / NUPTK / NIK</th>
                  <th className="py-3 px-4">Status &amp; Golongan</th>
                  <th className="py-3 px-4">Jabatan &amp; Tugas Tambahan</th>
                  <th className="py-3 px-4 text-right">JJM</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTeachers.map((t, idx) => (
                  <tr
                    key={t.id}
                    draggable={isManualOrderActive}
                    onDragStart={() => {
                      if (isManualOrderActive) setDraggedId(t.id);
                    }}
                    onDragOver={(e) => {
                      if (!isManualOrderActive) return;
                      e.preventDefault();
                      if (dragOverId !== t.id) setDragOverId(t.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverId === t.id) setDragOverId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (isManualOrderActive) handleDropReorder(t.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    className={`transition-colors ${
                      dragOverId === t.id && draggedId !== t.id
                        ? 'bg-[#1E3A5F]/10'
                        : 'hover:bg-slate-50/80'
                    } ${draggedId === t.id ? 'opacity-50' : ''}`}
                  >
                    <td className="py-2.5 px-3 text-center text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {isManualOrderActive && (
                          <span
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700"
                            title="Seret untuk mengurutkan"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="w-5 text-center font-medium text-slate-700">
                          {idx + 1}
                        </span>
                        {isManualOrderActive && (
                          <div className="inline-flex flex-col">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveStep(t.id, -1)}
                              className="p-0.5 text-slate-400 hover:text-[#1E3A5F] disabled:opacity-25 disabled:pointer-events-none"
                              title="Naikkan urutan"
                              aria-label={`Naikkan ${t.nama}`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === filteredTeachers.length - 1}
                              onClick={() => handleMoveStep(t.id, 1)}
                              className="p-0.5 text-slate-400 hover:text-[#1E3A5F] disabled:opacity-25 disabled:pointer-events-none"
                              title="Turunkan urutan"
                              aria-label={`Turunkan ${t.nama}`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{t.nama}</div>
                      <div className="text-xs text-slate-500">
                        {t.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} ·{' '}
                        {t.pendidikanTerakhir}
                        {t.sertifikasiPendidik &&
                        t.sertifikasiPendidik !== '-' &&
                        t.sertifikasiPendidik !== 'Belum Sertifikasi'
                          ? ` · Sertifikasi`
                          : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                      <div>NIP: {t.nip || '-'}</div>
                      <div className="text-slate-500">
                        NUPTK: {t.nuptk || '-'}
                      </div>
                      {t.nik && t.nik !== '-' && (
                        <div className="text-slate-400">NIK: {t.nik}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700">
                      <div className="font-semibold text-slate-900">
                        {t.statusKepegawaian}
                      </div>
                      <div className="text-slate-500">
                        {t.pangkatGolongan || '-'}
                      </div>
                      <div className="text-slate-400">
                        TMT {formatTanggalIndonesia(t.tmtMulai)}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700 max-w-[260px]">
                      <div className="font-medium text-slate-900">
                        {t.jabatan}
                      </div>
                      {t.tugasTambahan && t.tugasTambahan !== '-' && (
                        <div className="text-slate-500 truncate">
                          {t.tugasTambahan}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-slate-800 tabular-nums">
                      {t.jamTatapMuka ?? 0}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDetailTeacher(t)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          title="Lihat profil lengkap Dapodik"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({ ...t });
                            setIsFormOpen(true);
                            setDetailTeacher(null);
                          }}
                          className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveTeachers(
                              teachers.filter((x) => x.id !== t.id)
                            );
                            if (detailTeacher?.id === t.id) {
                              setDetailTeacher(null);
                            }
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700"
                          title="Hapus data PTK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
