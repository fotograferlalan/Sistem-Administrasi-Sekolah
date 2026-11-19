import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Check,
  CheckCheck,
  Download,
  Eraser,
  FileSpreadsheet,
  Plus,
  Printer,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  AttendanceStatus,
  SchoolProfile,
  Student,
  SupervisorVisitRow,
  Teacher,
} from '../types/admin';
import { KopSurat } from './LetterPreview';
import {
  exportPaperToWord,
  formatTanggalIndonesia,
  printPaperElement,
  todayIsoDate,
} from '../utils/formatters';

const BULAN_NAMA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const KELAS_LIST = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

const MAPEL_SD_LIST = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Seni Budaya dan Prakarya (SBdP)',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Bahasa Inggris',
  'Muatan Lokal',
];

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15';
const labelCls = 'block text-xs font-medium text-slate-700 mb-1';

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getDaysInYearMonth(ym: string): number {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = Number(mStr) || 1;
  return new Date(y, m, 0).getDate();
}

function formatYearMonthIndo(ym: string): string {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const mIdx = (Number(mStr) || 1) - 1;
  return `${BULAN_NAMA[mIdx] || 'Januari'} ${y}`;
}

function isWeekendDay(ym: string, day: number): boolean {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = (Number(mStr) || 1) - 1;
  const dow = new Date(y, m, day).getDay();
  return dow === 0;
}

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

function loadJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function nextAttendanceStatus(
  current: AttendanceStatus,
  allowDinasLuar: boolean
): AttendanceStatus {
  const cycle: AttendanceStatus[] = allowDinasLuar
    ? ['', 'H', 'S', 'I', 'A', 'DL']
    : ['', 'H', 'S', 'I', 'A'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

function statusCellClass(status: AttendanceStatus, isSunday = false): string {
  if (status === 'H') return 'bg-emerald-50 text-emerald-800 font-semibold';
  if (status === 'S') return 'bg-amber-50 text-amber-800 font-semibold';
  if (status === 'I') return 'bg-sky-50 text-sky-800 font-semibold';
  if (status === 'A') return 'bg-rose-50 text-rose-800 font-semibold';
  if (status === 'DL') return 'bg-indigo-50 text-indigo-800 font-semibold';
  return isSunday ? 'bg-rose-50/40 text-slate-400' : 'bg-white text-slate-400';
}

/* =========================================================
   1. ABSEN PEGAWAI & ABSEN PENGAWAS SEKOLAH
========================================================= */
interface AbsenPegawaiPengawasViewProps {
  school: SchoolProfile;
  teachers: Teacher[];
}

const DEFAULT_SUPERVISOR_VISITS: SupervisorVisitRow[] = [
  {
    id: 'sup-1',
    tanggal: todayIsoDate(),
    namaPengawas: 'Drs. Bambang Supriyadi, M.Pd.',
    nip: '19680912 199303 1 007',
    pangkatGolongan: 'Pembina Utama Muda / IV-c',
    wilayahBinaan: 'Korwil Disdikbud Kecamatan',
    jamDatang: '08.15',
    jamPulang: '11.30',
    materiPembinaan: 'Supervisi Administrasi Sekolah, Kurikulum & Kesiapan Pembelajaran',
    tindakLanjut: 'Perangkat ajar dan daftar hadir guru telah diperiksa dan lengkap.',
  },
];

export const AbsenPegawaiPengawasView: React.FC<
  AbsenPegawaiPengawasViewProps
> = ({ school, teachers }) => {
  const [subMode, setSubMode] = useState<'pegawai' | 'pengawas'>('pegawai');
  const [viewMode, setViewMode] = useState<'input' | 'preview'>('input');
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);
  const [selectedDay, setSelectedDay] = useState<number>(() =>
    new Date().getDate()
  );
  const [blankPrint, setBlankPrint] = useState(false);

  const [staffMarks, setStaffMarks] = useState<Record<string, AttendanceStatus>>(
    () => loadJsonStorage('tatausaha_sd_absen_pegawai_v1', {})
  );
  const [supervisorVisits, setSupervisorVisits] = useState<SupervisorVisitRow[]>(
    () =>
      loadJsonStorage(
        'tatausaha_sd_absen_pengawas_v1',
        DEFAULT_SUPERVISOR_VISITS
      )
  );
  const [newVisit, setNewVisit] = useState<SupervisorVisitRow>({
    id: '',
    tanggal: todayIsoDate(),
    namaPengawas: '',
    nip: '',
    pangkatGolongan: 'Pembina / IV-a',
    wilayahBinaan: `Korwil Kec. ${school.kecamatan}`,
    jamDatang: '08.00',
    jamPulang: '11.00',
    materiPembinaan: '',
    tindakLanjut: '',
  });
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [pengawasSign, setPengawasSign] = useState<{
    nama: string;
    nuptk: string;
    nip: string;
    jabatan: string;
  }>(() => {
    const defaults = {
      nama: 'I WAYAN SETAT, S.Pd.SD',
      nuptk: '000000000',
      nip: '19690309 199509 1 001',
      jabatan: '',
    };
    const stored = loadJsonStorage<Partial<typeof defaults>>(
      'tatausaha_sd_absen_pegawai_pengawas_ttd_v1',
      {}
    );
    return {
      ...defaults,
      ...stored,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'tatausaha_sd_absen_pegawai_pengawas_ttd_v1',
        JSON.stringify(pengawasSign)
      );
    } catch {
      // ignore
    }
  }, [pengawasSign]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'tatausaha_sd_absen_pegawai_v1',
        JSON.stringify(staffMarks)
      );
    } catch {
      // ignore
    }
  }, [staffMarks]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'tatausaha_sd_absen_pengawas_v1',
        JSON.stringify(supervisorVisits)
      );
    } catch {
      // ignore
    }
  }, [supervisorVisits]);

  const daysInMonth = useMemo(
    () => getDaysInYearMonth(yearMonth),
    [yearMonth]
  );
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const getMark = (teacherId: string, day: number): AttendanceStatus =>
    staffMarks[`${yearMonth}|${teacherId}|${day}`] || '';

  const setMark = (
    teacherId: string,
    day: number,
    status: AttendanceStatus
  ) => {
    const key = `${yearMonth}|${teacherId}|${day}`;
    setStaffMarks((prev) => {
      const next = { ...prev };
      if (!status) {
        delete next[key];
      } else {
        next[key] = status;
      }
      return next;
    });
  };

  const handleMarkAllToday = (status: AttendanceStatus) => {
    const safeDay = Math.min(selectedDay, daysInMonth);
    setStaffMarks((prev) => {
      const next = { ...prev };
      teachers.forEach((t) => {
        const key = `${yearMonth}|${t.id}|${safeDay}`;
        if (!status) delete next[key];
        else next[key] = status;
      });
      return next;
    });
  };

  const handleClearMonth = () => {
    setStaffMarks((prev) => {
      const next: Record<string, AttendanceStatus> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (!k.startsWith(`${yearMonth}|`)) {
          next[k] = v;
        }
      });
      return next;
    });
  };

  const getTeacherSummary = (teacherId: string) => {
    let h = 0;
    let s = 0;
    let i = 0;
    let a = 0;
    let dl = 0;
    daysArray.forEach((d) => {
      const st = getMark(teacherId, d);
      if (st === 'H') h++;
      else if (st === 'S') s++;
      else if (st === 'I') i++;
      else if (st === 'A') a++;
      else if (st === 'DL') dl++;
    });
    return { h, s, i, a, dl };
  };

  const handleExportExcel = () => {
    if (subMode === 'pegawai') {
      const rows = teachers.map((t, idx) => {
        const sum = getTeacherSummary(t.id);
        const row: Record<string, string | number> = {
          No: idx + 1,
          'Nama Pegawai / PTK': t.nama,
          NUPTK: t.nuptk || '-',
          NIP: t.nip || '-',
          Jabatan: t.jabatan || '-',
          Status: t.statusKepegawaian,
        };
        daysArray.forEach((d) => {
          row[String(d)] = blankPrint ? '' : getMark(t.id, d) || '';
        });
        row['H'] = blankPrint ? '' : sum.h;
        row['S'] = blankPrint ? '' : sum.s;
        row['I'] = blankPrint ? '' : sum.i;
        row['A'] = blankPrint ? '' : sum.a;
        row['DL'] = blankPrint ? '' : sum.dl;
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Absen Pegawai');
      XLSX.writeFile(
        wb,
        `Absen_Pegawai_${school.kodeSuratSekolah}_${yearMonth}.xlsx`
      );
    } else {
      const rows = supervisorVisits.map((v, idx) => ({
        No: idx + 1,
        Tanggal: formatTanggalIndonesia(v.tanggal),
        'Nama Pengawas': v.namaPengawas,
        NIP: v.nip,
        'Pangkat / Gol': v.pangkatGolongan,
        'Unit / Korwil': v.wilayahBinaan,
        'Jam Datang': v.jamDatang,
        'Jam Pulang': v.jamPulang,
        'Materi Pembinaan': v.materiPembinaan,
        'Catatan / Tindak Lanjut': v.tindakLanjut,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Absen Pengawas');
      XLSX.writeFile(wb, `Absen_Pengawas_${school.kodeSuratSekolah}.xlsx`);
    }
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisit.namaPengawas.trim()) return;
    setSupervisorVisits((prev) => [
      { ...newVisit, id: `sup-${Date.now()}` },
      ...prev,
    ]);
    setNewVisit({
      id: '',
      tanggal: todayIsoDate(),
      namaPengawas: '',
      nip: '',
      pangkatGolongan: 'Pembina / IV-a',
      wilayahBinaan: `Korwil Kec. ${school.kecamatan}`,
      jamDatang: '08.00',
      jamPulang: '11.00',
      materiPembinaan: '',
      tindakLanjut: '',
    });
    setShowAddVisit(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-5 print:p-0 print:max-w-none">
      {/* Header & Controls */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Absen Pegawai &amp; Pengawas Sekolah
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Daftar hadir harian/bulanan Guru &amp; Tendik serta buku hadir kunjungan Pengawas Sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setSubMode('pegawai')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                subMode === 'pegawai'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absen Pegawai ({teachers.length} PTK)
            </button>
            <button
              type="button"
              onClick={() => setSubMode('pengawas')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                subMode === 'pengawas'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absen Pengawas ({supervisorVisits.length})
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('input')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                viewMode === 'input'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input &amp; Kelola
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                viewMode === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau Cetak
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              setTimeout(
                () =>
                  exportPaperToWord(
                    'absen-pegawai-paper',
                    subMode === 'pegawai'
                      ? `Absen_Pegawai_${yearMonth}`
                      : `Absen_Pengawas_${school.kodeSuratSekolah}`
                  ),
                60
              );
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Word
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              printPaperElement('absen-pegawai-paper', {
                title:
                  subMode === 'pegawai'
                    ? `Absen Pegawai ${formatYearMonthIndo(yearMonth)}`
                    : `Absen Pengawas ${school.namaSekolah}`,
                paperSize: subMode === 'pegawai' ? 'A4' : 'F4',
                orientation: subMode === 'pegawai' ? 'landscape' : 'portrait',
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {subMode === 'pegawai' ? (
        <>
          {/* Filter & Action Toolbar */}
          <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <label className="text-xs font-medium text-slate-700">
                  Bulan:
                </label>
                <input
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-700">
                  Tgl Isi Cepat:
                </label>
                <select
                  value={Math.min(selectedDay, daysInMonth)}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 tabular-nums"
                >
                  {daysArray.map((d) => (
                    <option key={d} value={d}>
                      Tanggal {d}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleMarkAllToday('H')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai Semua Hadir (Tgl {Math.min(selectedDay, daysInMonth)})
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blankPrint}
                  onChange={(e) => setBlankPrint(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A5F]"
                />
                Cetak Blangko Kosong
              </label>
              <button
                type="button"
                onClick={handleClearMonth}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:text-rose-600 whitespace-nowrap"
              >
                <Eraser className="w-3.5 h-3.5" />
                Kosongkan Bulan Ini
              </button>
            </div>
          </div>

          {/* Penandatangan Pengawas di Lembar Cetak */}
          <div className="no-print bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0">
              TTD Pengawas (Lembar Cetak):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
              <input
                type="text"
                aria-label="Nama Pengawas pada tanda tangan lembar cetak"
                value={pengawasSign.nama}
                onChange={(e) =>
                  setPengawasSign((prev) => ({ ...prev, nama: e.target.value }))
                }
                placeholder="Nama Pengawas & Gelar"
                className={inputCls}
              />
              <input
                type="text"
                aria-label="NUPTK Pengawas pada tanda tangan lembar cetak"
                value={pengawasSign.nuptk}
                onChange={(e) =>
                  setPengawasSign((prev) => ({
                    ...prev,
                    nuptk: e.target.value,
                  }))
                }
                placeholder="NUPTK Pengawas"
                className={`${inputCls} font-mono`}
              />
              <input
                type="text"
                aria-label="NIP Pengawas pada tanda tangan lembar cetak"
                value={pengawasSign.nip}
                onChange={(e) =>
                  setPengawasSign((prev) => ({ ...prev, nip: e.target.value }))
                }
                placeholder="NIP Pengawas"
                className={`${inputCls} font-mono`}
              />
              <input
                type="text"
                aria-label="Keterangan jabatan pengawas (opsional)"
                value={pengawasSign.jabatan}
                onChange={(e) =>
                  setPengawasSign((prev) => ({
                    ...prev,
                    jabatan: e.target.value,
                  }))
                }
                placeholder="Jabatan baris 2 (opsional)"
                className={inputCls}
              />
            </div>
          </div>

          {viewMode === 'input' && (
            <div className="no-print bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>
                  Klik sel tanggal untuk mengganti status:{' '}
                  <strong className="text-emerald-700">H</strong> (Hadir) ·{' '}
                  <strong className="text-amber-700">S</strong> (Sakit) ·{' '}
                  <strong className="text-sky-700">I</strong> (Izin) ·{' '}
                  <strong className="text-rose-700">A</strong> (Alpha) ·{' '}
                  <strong className="text-indigo-700">DL</strong> (Dinas Luar)
                </span>
                <span className="font-medium text-slate-700 tabular-nums">
                  {formatYearMonthIndo(yearMonth)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 px-2.5 text-center sticky left-0 z-10 bg-slate-50 border-r border-slate-200 w-9">
                        No
                      </th>
                      <th className="py-2 px-3 sticky left-9 z-10 bg-slate-50 border-r border-slate-200 min-w-[210px]">
                        Nama Pegawai / PTK
                      </th>
                      {daysArray.map((d) => {
                        const sun = isWeekendDay(yearMonth, d);
                        return (
                          <th
                            key={d}
                            className={`py-2 px-1 text-center min-w-[28px] border-r border-slate-200 tabular-nums ${
                              sun ? 'bg-rose-50 text-rose-700' : ''
                            }`}
                          >
                            {d}
                          </th>
                        );
                      })}
                      <th className="py-2 px-1.5 text-center bg-emerald-50/70 text-emerald-800 border-r border-slate-200">
                        H
                      </th>
                      <th className="py-2 px-1.5 text-center bg-amber-50/70 text-amber-800 border-r border-slate-200">
                        S
                      </th>
                      <th className="py-2 px-1.5 text-center bg-sky-50/70 text-sky-800 border-r border-slate-200">
                        I
                      </th>
                      <th className="py-2 px-1.5 text-center bg-rose-50/70 text-rose-800 border-r border-slate-200">
                        A
                      </th>
                      <th className="py-2 px-1.5 text-center bg-indigo-50/70 text-indigo-800">
                        DL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {teachers.map((t, idx) => {
                      const sum = getTeacherSummary(t.id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-2.5 text-center text-slate-500 sticky left-0 z-10 bg-white border-r border-slate-200 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 sticky left-9 z-10 bg-white border-r border-slate-200">
                            <div className="font-medium text-slate-900 truncate max-w-[200px]">
                              {t.nama}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {t.jabatan}
                              {t.nuptk && t.nuptk !== '-'
                                ? ` · NUPTK ${t.nuptk}`
                                : ''}
                            </div>
                          </td>
                          {daysArray.map((d) => {
                            const st = getMark(t.id, d);
                            const sun = isWeekendDay(yearMonth, d);
                            return (
                              <td
                                key={d}
                                className="p-0 border-r border-slate-200 text-center"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMark(
                                      t.id,
                                      d,
                                      nextAttendanceStatus(st, true)
                                    )
                                  }
                                  className={`w-full h-9 text-[11px] font-mono transition-colors hover:ring-1 hover:ring-inset hover:ring-[#1E3A5F] ${statusCellClass(
                                    st,
                                    sun
                                  )}`}
                                  title={`${t.nama} — Tgl ${d}`}
                                >
                                  {st || '·'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="py-2 px-1.5 text-center font-mono font-semibold text-emerald-700 border-r border-slate-200 tabular-nums">
                            {sum.h}
                          </td>
                          <td className="py-2 px-1.5 text-center font-mono font-semibold text-amber-700 border-r border-slate-200 tabular-nums">
                            {sum.s}
                          </td>
                          <td className="py-2 px-1.5 text-center font-mono font-semibold text-sky-700 border-r border-slate-200 tabular-nums">
                            {sum.i}
                          </td>
                          <td className="py-2 px-1.5 text-center font-mono font-semibold text-rose-700 border-r border-slate-200 tabular-nums">
                            {sum.a}
                          </td>
                          <td className="py-2 px-1.5 text-center font-mono font-semibold text-indigo-700 tabular-nums">
                            {sum.dl}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Printable Paper Sheet */}
          <div
            className={`${
              viewMode === 'preview' ? 'block' : 'hidden print:block'
            } print-only-container overflow-x-auto pb-8`}
          >
            <div
              id="absen-pegawai-paper"
              className="paper-sheet mx-auto shadow-md border border-slate-200 print:shadow-none print:border-none"
              style={{
                width: '297mm',
                minHeight: '210mm',
                padding: '12mm 12mm',
              }}
            >
              <KopSurat school={school} />

              <div className="text-center mb-3">
                <p className="text-[12pt] font-bold uppercase underline">
                  DAFTAR HADIR PEGAWAI / GURU &amp; TENAGA KEPENDIDIKAN
                </p>
                <p className="text-[10.5pt] mt-0.5">
                  Bulan: {formatYearMonthIndo(yearMonth)} · Tahun Pelajaran{' '}
                  {school.tahunPelajaran}
                </p>
              </div>

              <table className="doc-table w-full border border-black text-[8pt]">
                <thead>
                  <tr className="bg-slate-100">
                    <th
                      rowSpan={2}
                      className="border border-black px-1 py-1 text-center w-6"
                    >
                      No
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-black px-2 py-1 text-left min-w-[155px]"
                    >
                      Nama / NUPTK / NIP
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-black px-1.5 py-1 text-left min-w-[85px]"
                    >
                      Jabatan
                    </th>
                    <th
                      colSpan={daysInMonth}
                      className="border border-black px-1 py-0.5 text-center"
                    >
                      Tanggal
                    </th>
                    <th
                      colSpan={5}
                      className="border border-black px-1 py-0.5 text-center"
                    >
                      Rekap
                    </th>
                  </tr>
                  <tr className="bg-slate-100">
                    {daysArray.map((d) => (
                      <th
                        key={d}
                        className="border border-black px-0.5 py-0.5 text-center w-[17px] tabular-nums"
                      >
                        {d}
                      </th>
                    ))}
                    <th className="border border-black px-1 py-0.5 text-center w-5">
                      H
                    </th>
                    <th className="border border-black px-1 py-0.5 text-center w-5">
                      S
                    </th>
                    <th className="border border-black px-1 py-0.5 text-center w-5">
                      I
                    </th>
                    <th className="border border-black px-1 py-0.5 text-center w-5">
                      A
                    </th>
                    <th className="border border-black px-1 py-0.5 text-center w-6">
                      DL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, idx) => {
                    const sum = getTeacherSummary(t.id);
                    return (
                      <tr key={t.id}>
                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="border border-black px-1.5 py-1">
                          <div className="font-semibold leading-tight">
                            {t.nama}
                          </div>
                          {t.nuptk && t.nuptk !== '-' && (
                            <div className="text-[7pt] leading-tight tabular-nums">
                              NUPTK. {t.nuptk}
                            </div>
                          )}
                          {t.nip && t.nip !== '-' && (
                            <div className="text-[7pt] leading-tight tabular-nums">
                              NIP. {t.nip}
                            </div>
                          )}
                        </td>
                        <td className="border border-black px-1.5 py-1 leading-tight">
                          {t.jabatan}
                        </td>
                        {daysArray.map((d) => (
                          <td
                            key={d}
                            className="border border-black px-0.5 py-1 text-center tabular-nums"
                          >
                            {blankPrint ? '' : getMark(t.id, d)}
                          </td>
                        ))}
                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                          {blankPrint ? '' : sum.h}
                        </td>
                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                          {blankPrint ? '' : sum.s}
                        </td>
                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                          {blankPrint ? '' : sum.i}
                        </td>
                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                          {blankPrint ? '' : sum.a}
                        </td>
                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                          {blankPrint ? '' : sum.dl}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-3 text-[8.5pt]">
                <span className="font-semibold">Keterangan:</span> H = Hadir · S
                = Sakit · I = Izin · A = Alpha / Tanpa Keterangan · DL = Dinas
                Luar
              </div>

              <div className="mt-4 flex justify-between items-start text-[9pt]">
                <div className="w-[240px] text-left">
                  <p>Mengetahui</p>
                  {pengawasSign.jabatan.trim() && (
                    <p>{pengawasSign.jabatan}</p>
                  )}
                  <div className="h-14" />
                  <p className="font-bold underline">
                    {pengawasSign.nama || '........................................'}
                  </p>
                  {pengawasSign.nuptk.trim() && (
                    <p>NUPTK. {pengawasSign.nuptk}</p>
                  )}
                  {pengawasSign.nip.trim() && (
                    <p>NIP. {pengawasSign.nip}</p>
                  )}
                </div>

                <div className="w-[240px] text-left">
                  <p>
                    {school.kabupatenKota},{' '}
                    {formatTanggalIndonesia(todayIsoDate())}
                  </p>
                  <p>Kepala {school.namaSekolah}</p>
                  <div className="h-14" />
                  <p className="font-bold underline">
                    {school.namaKepalaSekolah}
                  </p>
                  <p>NIP. {school.nipKepalaSekolah}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* SUBMODE: ABSEN PENGAWAS SEKOLAH */
        <>
          <div className="no-print flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-600">
              Catatan resmi kehadiran dan hasil pembinaan/supervisi Pengawas Sekolah di{' '}
              <span className="font-semibold text-slate-900">
                {school.namaSekolah}
              </span>
              .
            </div>
            <button
              type="button"
              onClick={() => setShowAddVisit((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Catat Kehadiran Pengawas
            </button>
          </div>

          {showAddVisit && (
            <form
              onSubmit={handleAddVisit}
              className="no-print bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <h2 className="text-sm font-bold text-slate-900">
                Tambah Daftar Hadir Pengawas Sekolah
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Nama Pengawas &amp; Gelar *</label>
                  <input
                    type="text"
                    required
                    value={newVisit.namaPengawas}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, namaPengawas: e.target.value })
                    }
                    placeholder="Drs. H. Ahmad..., M.Pd."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>NIP Pengawas</label>
                  <input
                    type="text"
                    value={newVisit.nip}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, nip: e.target.value })
                    }
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={newVisit.pangkatGolongan}
                    onChange={(e) =>
                      setNewVisit({
                        ...newVisit,
                        pangkatGolongan: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tanggal Kunjungan</label>
                  <input
                    type="date"
                    value={newVisit.tanggal}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, tanggal: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Jam Datang</label>
                    <input
                      type="text"
                      value={newVisit.jamDatang}
                      onChange={(e) =>
                        setNewVisit({ ...newVisit, jamDatang: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Jam Pulang</label>
                    <input
                      type="text"
                      value={newVisit.jamPulang}
                      onChange={(e) =>
                        setNewVisit({ ...newVisit, jamPulang: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Unit / Wilayah Binaan</label>
                  <input
                    type="text"
                    value={newVisit.wilayahBinaan}
                    onChange={(e) =>
                      setNewVisit({
                        ...newVisit,
                        wilayahBinaan: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Keperluan / Materi Pembinaan
                  </label>
                  <input
                    type="text"
                    value={newVisit.materiPembinaan}
                    onChange={(e) =>
                      setNewVisit({
                        ...newVisit,
                        materiPembinaan: e.target.value,
                      })
                    }
                    placeholder="Supervisi akademik, pemeriksaan administrasi..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Catatan / Tindak Lanjut</label>
                  <input
                    type="text"
                    value={newVisit.tindakLanjut}
                    onChange={(e) =>
                      setNewVisit({
                        ...newVisit,
                        tindakLanjut: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVisit(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white"
                >
                  Simpan Kehadiran Pengawas
                </button>
              </div>
            </form>
          )}

          {viewMode === 'input' && (
            <div className="no-print bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4 w-10 text-center">No</th>
                      <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                      <th className="py-3 px-4">Nama &amp; NIP Pengawas</th>
                      <th className="py-3 px-4">Materi Pembinaan</th>
                      <th className="py-3 px-4">Catatan / Tindak Lanjut</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {supervisorVisits.map((v, idx) => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-center text-slate-500 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                          <div className="font-medium text-slate-900">
                            {formatTanggalIndonesia(v.tanggal)}
                          </div>
                          <div className="text-slate-500">
                            {v.jamDatang} – {v.jamPulang} WIB
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {v.namaPengawas}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            NIP. {v.nip || '-'} · {v.pangkatGolongan}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[240px]">
                          {v.materiPembinaan || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[220px]">
                          {v.tindakLanjut || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSupervisorVisits((prev) =>
                                prev.filter((x) => x.id !== v.id)
                              )
                            }
                            className="text-rose-600 hover:text-rose-700"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Printable Pengawas Sheet */}
          <div
            className={`${
              viewMode === 'preview' ? 'block' : 'hidden print:block'
            } print-only-container overflow-x-auto pb-8`}
          >
            <div
              id="absen-pegawai-paper"
              className="paper-sheet mx-auto shadow-md border border-slate-200 print:shadow-none print:border-none"
              style={{
                width: '215mm',
                minHeight: '330mm',
                padding: '15mm 16mm',
              }}
            >
              <KopSurat school={school} />

              <div className="text-center mb-4">
                <p className="text-[12.5pt] font-bold uppercase underline">
                  DAFTAR HADIR &amp; BUKU PEMBINAAN PENGAWAS SEKOLAH
                </p>
                <p className="text-[10.5pt] mt-0.5">
                  Tahun Pelajaran {school.tahunPelajaran}
                </p>
              </div>

              <table className="doc-table w-full border border-black text-[9.5pt]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black px-2 py-1.5 text-center w-8">
                      No
                    </th>
                    <th className="border border-black px-2 py-1.5 text-left w-28">
                      Hari / Tanggal
                    </th>
                    <th className="border border-black px-2 py-1.5 text-left">
                      Nama Pengawas &amp; NIP
                    </th>
                    <th className="border border-black px-2 py-1.5 text-center w-24">
                      Datang / Pulang
                    </th>
                    <th className="border border-black px-2 py-1.5 text-left">
                      Keperluan / Materi Pembinaan
                    </th>
                    <th className="border border-black px-2 py-1.5 text-center w-24">
                      Paraf Pengawas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supervisorVisits.map((v, idx) => (
                    <tr key={v.id}>
                      <td className="border border-black px-2 py-2 text-center align-top tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-2 py-2 align-top">
                        {formatTanggalIndonesia(v.tanggal)}
                      </td>
                      <td className="border border-black px-2 py-2 align-top">
                        <div className="font-semibold">{v.namaPengawas}</div>
                        <div className="text-[8.5pt]">NIP. {v.nip || '-'}</div>
                        <div className="text-[8.5pt]">{v.pangkatGolongan}</div>
                      </td>
                      <td className="border border-black px-2 py-2 text-center align-top tabular-nums">
                        {v.jamDatang} – {v.jamPulang}
                      </td>
                      <td className="border border-black px-2 py-2 align-top">
                        <div>{v.materiPembinaan}</div>
                        {v.tindakLanjut && (
                          <div className="text-[8.5pt] mt-1 italic">
                            Catatan: {v.tindakLanjut}
                          </div>
                        )}
                      </td>
                      <td className="border border-black px-2 py-4 text-center align-bottom text-[8pt] text-slate-400">
                        (...............)
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: 4 }).map((_, emptyIdx) => (
                    <tr key={`empty-sup-${emptyIdx}`}>
                      <td className="border border-black px-2 py-4 text-center tabular-nums">
                        {supervisorVisits.length + emptyIdx + 1}
                      </td>
                      <td className="border border-black px-2 py-4">&nbsp;</td>
                      <td className="border border-black px-2 py-4">&nbsp;</td>
                      <td className="border border-black px-2 py-4">&nbsp;</td>
                      <td className="border border-black px-2 py-4">&nbsp;</td>
                      <td className="border border-black px-2 py-4">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 flex justify-end text-[10.5pt]">
                <div className="w-[240px]">
                  <p>
                    Mengetahui, Kepala {school.namaSekolah}
                  </p>
                  <div className="h-16" />
                  <p className="font-bold underline">
                    {school.namaKepalaSekolah}
                  </p>
                  <p>NIP. {school.nipKepalaSekolah}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* =========================================================
   2. ABSEN SISWA KELAS
========================================================= */
interface AbsenSiswaKelasViewProps {
  school: SchoolProfile;
  students: Student[];
  teachers: Teacher[];
}

export const AbsenSiswaKelasView: React.FC<AbsenSiswaKelasViewProps> = ({
  school,
  students,
  teachers,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);
  const [selectedDay, setSelectedDay] = useState<number>(() =>
    new Date().getDate()
  );
  const [viewMode, setViewMode] = useState<'input' | 'preview'>('input');
  const [blankPrint, setBlankPrint] = useState(false);
  const [waliKelasId, setWaliKelasId] = useState<string>('');
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() =>
    loadJsonStorage('tatausaha_sd_absen_kelas_v1', {})
  );

  useEffect(() => {
    try {
      localStorage.setItem('tatausaha_sd_absen_kelas_v1', JSON.stringify(marks));
    } catch {
      // ignore
    }
  }, [marks]);

  const filteredStudents = useMemo(
    () => students.filter((s) => matchStudentClass(s.kelas, selectedClass)),
    [students, selectedClass]
  );

  const daysInMonth = useMemo(
    () => getDaysInYearMonth(yearMonth),
    [yearMonth]
  );
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const selectedWali = useMemo(() => {
    if (waliKelasId) {
      return teachers.find((t) => t.id === waliKelasId);
    }
    if (selectedClass !== 'Semua') {
      return teachers.find((t) =>
        matchStudentClass(t.jabatan || '', selectedClass)
      );
    }
    return teachers.find((t) =>
      (t.jabatan || '').toLowerCase().includes('guru kelas')
    );
  }, [teachers, waliKelasId, selectedClass]);

  const getMark = (studentId: string, day: number): AttendanceStatus =>
    marks[`${yearMonth}|${studentId}|${day}`] || '';

  const setMark = (
    studentId: string,
    day: number,
    status: AttendanceStatus
  ) => {
    const key = `${yearMonth}|${studentId}|${day}`;
    setMarks((prev) => {
      const next = { ...prev };
      if (!status) delete next[key];
      else next[key] = status;
      return next;
    });
  };

  const handleMarkAllToday = (status: AttendanceStatus) => {
    const safeDay = Math.min(selectedDay, daysInMonth);
    setMarks((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((s) => {
        const key = `${yearMonth}|${s.id}|${safeDay}`;
        if (!status) delete next[key];
        else next[key] = status;
      });
      return next;
    });
  };

  const handleClearMonth = () => {
    setMarks((prev) => {
      const next: Record<string, AttendanceStatus> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const parts = k.split('|');
        const matchesMonth = parts[0] === yearMonth;
        const inClass = filteredStudents.some((s) => s.id === parts[1]);
        if (!(matchesMonth && inClass)) {
          next[k] = v;
        }
      });
      return next;
    });
  };

  const getStudentSummary = (studentId: string) => {
    let h = 0;
    let s = 0;
    let i = 0;
    let a = 0;
    daysArray.forEach((d) => {
      const st = getMark(studentId, d);
      if (st === 'H') h++;
      else if (st === 'S') s++;
      else if (st === 'I') i++;
      else if (st === 'A') a++;
    });
    return { h, s, i, a };
  };

  const handleExportExcel = () => {
    const rows = filteredStudents.map((st, idx) => {
      const sum = getStudentSummary(st.id);
      const row: Record<string, string | number> = {
        No: idx + 1,
        'Nama Siswa': st.nama,
        NIS: st.nis,
        NISN: st.nisn,
        'L/P': st.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
        Kelas: st.kelas,
      };
      daysArray.forEach((d) => {
        row[String(d)] = blankPrint ? '' : getMark(st.id, d) || '';
      });
      row['H'] = blankPrint ? '' : sum.h;
      row['S'] = blankPrint ? '' : sum.s;
      row['I'] = blankPrint ? '' : sum.i;
      row['A'] = blankPrint ? '' : sum.a;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absen Siswa Kelas');
    XLSX.writeFile(
      wb,
      `Absen_Kelas_${selectedClass}_${yearMonth}.xlsx`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-5 print:p-0 print:max-w-none">
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Absen Siswa Kelas
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Daftar hadir bulanan peserta didik per rombongan belajar / wali kelas SD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('input')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                viewMode === 'input'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input &amp; Rekap
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                viewMode === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau Cetak
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              setTimeout(
                () =>
                  exportPaperToWord(
                    'absen-kelas-paper',
                    `Absen_Siswa_Kelas_${selectedClass}_${yearMonth}`
                  ),
                60
              );
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Word
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              printPaperElement('absen-kelas-paper', {
                title: `Absen Siswa Kelas ${selectedClass} ${formatYearMonthIndo(yearMonth)}`,
                paperSize: 'A4',
                orientation: 'landscape',
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Pilih Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={inputCls}
            >
              <option value="Semua">Semua Kelas ({students.length} Siswa)</option>
              {KELAS_LIST.map((k) => {
                const cnt = students.filter((s) =>
                  matchStudentClass(s.kelas, k)
                ).length;
                return (
                  <option key={k} value={k}>
                    Kelas {k} ({cnt} Siswa)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className={labelCls}>Bulan &amp; Tahun</label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Wali Kelas (Penandatangan)</label>
            <select
              value={waliKelasId || selectedWali?.id || ''}
              onChange={(e) => setWaliKelasId(e.target.value)}
              className={inputCls}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama} ({t.jabatan})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Isi Cepat Tanggal</label>
            <div className="flex items-center gap-2">
              <select
                value={Math.min(selectedDay, daysInMonth)}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 tabular-nums"
              >
                {daysArray.map((d) => (
                  <option key={d} value={d}>
                    Tgl {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleMarkAllToday('H')}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                Hadir Semua
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-800">{filteredStudents.length}</strong> siswa · Klik sel tanggal untuk ubah status (H / S / I / A)
          </span>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={blankPrint}
                onChange={(e) => setBlankPrint(e.target.checked)}
                className="rounded border-slate-300 text-[#1E3A5F]"
              />
              Cetak Blangko Kosong
            </label>
            <button
              type="button"
              onClick={handleClearMonth}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:text-rose-600"
            >
              <Eraser className="w-3.5 h-3.5" />
              Kosongkan Bulan Ini
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'input' && (
        <div className="no-print bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Belum ada data siswa untuk Kelas {selectedClass}. Tambahkan siswa di menu Data Siswa atau pilih Semua Kelas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="py-2 px-2.5 text-center sticky left-0 z-10 bg-slate-50 border-r border-slate-200 w-9">
                      No
                    </th>
                    <th className="py-2 px-3 sticky left-9 z-10 bg-slate-50 border-r border-slate-200 min-w-[200px]">
                      Nama Siswa
                    </th>
                    <th className="py-2 px-2 text-center border-r border-slate-200">
                      L/P
                    </th>
                    {daysArray.map((d) => {
                      const sun = isWeekendDay(yearMonth, d);
                      return (
                        <th
                          key={d}
                          className={`py-2 px-1 text-center min-w-[28px] border-r border-slate-200 tabular-nums ${
                            sun ? 'bg-rose-50 text-rose-700' : ''
                          }`}
                        >
                          {d}
                        </th>
                      );
                    })}
                    <th className="py-2 px-1.5 text-center bg-emerald-50/70 text-emerald-800 border-r border-slate-200">
                      H
                    </th>
                    <th className="py-2 px-1.5 text-center bg-amber-50/70 text-amber-800 border-r border-slate-200">
                      S
                    </th>
                    <th className="py-2 px-1.5 text-center bg-sky-50/70 text-sky-800 border-r border-slate-200">
                      I
                    </th>
                    <th className="py-2 px-1.5 text-center bg-rose-50/70 text-rose-800">
                      A
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredStudents.map((st, idx) => {
                    const sum = getStudentSummary(st.id);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-2.5 text-center text-slate-500 sticky left-0 z-10 bg-white border-r border-slate-200 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 sticky left-9 z-10 bg-white border-r border-slate-200 min-w-[230px]">
                          <div className="font-medium text-slate-900 truncate max-w-[220px]">
                            {st.nama}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            NIS {st.nis || '-'} · NISN {st.nisn || '-'} · Kls {st.kelas}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-600">
                          {st.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </td>
                        {daysArray.map((d) => {
                          const mark = getMark(st.id, d);
                          const sun = isWeekendDay(yearMonth, d);
                          return (
                            <td
                              key={d}
                              className="p-0 border-r border-slate-200 text-center"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setMark(
                                    st.id,
                                    d,
                                    nextAttendanceStatus(mark, false)
                                  )
                                }
                                className={`w-full h-9 text-[11px] font-mono transition-colors hover:ring-1 hover:ring-inset hover:ring-[#1E3A5F] ${statusCellClass(
                                  mark,
                                  sun
                                )}`}
                              >
                                {mark || '·'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-emerald-700 border-r border-slate-200 tabular-nums">
                          {sum.h}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-amber-700 border-r border-slate-200 tabular-nums">
                          {sum.s}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-sky-700 border-r border-slate-200 tabular-nums">
                          {sum.i}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-rose-700 tabular-nums">
                          {sum.a}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Sheet */}
      <div
        className={`${
          viewMode === 'preview' ? 'block' : 'hidden print:block'
        } print-only-container overflow-x-auto pb-8`}
      >
        <div
          id="absen-kelas-paper"
          className="paper-sheet mx-auto shadow-md border border-slate-200 print:shadow-none print:border-none"
          style={{
            width: '297mm',
            minHeight: '210mm',
            padding: '12mm 12mm',
          }}
        >
          <KopSurat school={school} />

          <div className="text-center mb-3">
            <p className="text-[12pt] font-bold uppercase underline">
              DAFTAR HADIR PESERTA DIDIK (ABSEN KELAS)
            </p>
            <p className="text-[10.5pt] mt-0.5">
              Kelas:{' '}
              {selectedClass === 'Semua'
                ? 'Semua Kelas (I – VI)'
                : `Kelas ${selectedClass}`}{' '}
              · Bulan: {formatYearMonthIndo(yearMonth)} · Tahun Pelajaran{' '}
              {school.tahunPelajaran}
            </p>
          </div>

          <table className="doc-table w-full border border-black text-[8pt]">
            <thead>
              <tr className="bg-slate-100">
                <th
                  rowSpan={2}
                  className="border border-black px-1 py-1 text-center w-6"
                >
                  No
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 text-left min-w-[70px]"
                >
                  NIS / NISN
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-1 text-left min-w-[155px]"
                >
                  Nama Siswa
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1 py-1 text-center w-7"
                >
                  L/P
                </th>
                <th
                  colSpan={daysInMonth}
                  className="border border-black px-1 py-0.5 text-center"
                >
                  Tanggal
                </th>
                <th
                  colSpan={4}
                  className="border border-black px-1 py-0.5 text-center"
                >
                  Jumlah
                </th>
              </tr>
              <tr className="bg-slate-100">
                {daysArray.map((d) => (
                  <th
                    key={d}
                    className="border border-black px-0.5 py-0.5 text-center w-[17px] tabular-nums"
                  >
                    {d}
                  </th>
                ))}
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  H
                </th>
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  S
                </th>
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  I
                </th>
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  A
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st, idx) => {
                const sum = getStudentSummary(st.id);
                return (
                  <tr key={st.id}>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-[7pt] tabular-nums">
                      {st.nis || '-'} / {st.nisn || '-'}
                    </td>
                    <td className="border border-black px-1.5 py-1 font-medium">
                      {st.nama}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {st.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                    </td>
                    {daysArray.map((d) => (
                      <td
                        key={d}
                        className="border border-black px-0.5 py-1 text-center tabular-nums"
                      >
                        {blankPrint ? '' : getMark(st.id, d)}
                      </td>
                    ))}
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.h}
                    </td>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.s}
                    </td>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.i}
                    </td>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.a}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 flex justify-between items-start text-[9pt]">
            <div className="w-[230px]">
              <p>Mengetahui,</p>
              <p>Kepala {school.namaSekolah}</p>
              <div className="h-14" />
              <p className="font-bold underline">{school.namaKepalaSekolah}</p>
              <p>NIP. {school.nipKepalaSekolah}</p>
            </div>

            <div className="text-[8.5pt] pt-1">
              <p className="font-semibold">Keterangan:</p>
              <p>H = Hadir · S = Sakit · I = Izin · A = Alpha</p>
            </div>

            <div className="w-[230px]">
              <p>
                {school.kabupatenKota}, {formatTanggalIndonesia(todayIsoDate())}
              </p>
              <p>
                Wali Kelas{' '}
                {selectedClass === 'Semua' ? '' : selectedClass}
              </p>
              <div className="h-14" />
              <p className="font-bold underline">
                {selectedWali?.nama || '........................................'}
              </p>
              <p>NIP. {selectedWali?.nip || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   3. ABSEN SISWA MAPEL (MATA PELAJARAN)
========================================================= */
interface AbsenSiswaMapelViewProps {
  school: SchoolProfile;
  students: Student[];
  teachers: Teacher[];
}

export const AbsenSiswaMapelView: React.FC<AbsenSiswaMapelViewProps> = ({
  school,
  students,
  teachers,
}) => {
  const [selectedMapel, setSelectedMapel] = useState<string>(MAPEL_SD_LIST[0]);
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [columnMode, setColumnMode] = useState<'pertemuan' | 'bulanan'>(
    'pertemuan'
  );
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);
  const [selectedCol, setSelectedCol] = useState<number>(1);
  const [guruMapelId, setGuruMapelId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'input' | 'preview'>('input');
  const [blankPrint, setBlankPrint] = useState(false);

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() =>
    loadJsonStorage('tatausaha_sd_absen_mapel_v1', {})
  );

  useEffect(() => {
    try {
      localStorage.setItem('tatausaha_sd_absen_mapel_v1', JSON.stringify(marks));
    } catch {
      // ignore
    }
  }, [marks]);

  const filteredStudents = useMemo(
    () => students.filter((s) => matchStudentClass(s.kelas, selectedClass)),
    [students, selectedClass]
  );

  const columnCount = useMemo(
    () => (columnMode === 'pertemuan' ? 16 : getDaysInYearMonth(yearMonth)),
    [columnMode, yearMonth]
  );

  const columnsArray = useMemo(
    () => Array.from({ length: columnCount }, (_, i) => i + 1),
    [columnCount]
  );

  const selectedGuru = useMemo(() => {
    if (guruMapelId) {
      return teachers.find((t) => t.id === guruMapelId);
    }
    const lowerMapel = selectedMapel.toLowerCase();
    return (
      teachers.find(
        (t) =>
          (t.mengajarMapel || '').toLowerCase().includes(lowerMapel.slice(0, 8)) ||
          (t.jabatan || '').toLowerCase().includes(lowerMapel.slice(0, 6))
      ) || teachers[1] || teachers[0]
    );
  }, [teachers, guruMapelId, selectedMapel]);

  const contextPrefix = `${columnMode}|${
    columnMode === 'bulanan' ? yearMonth : school.semester
  }|${selectedMapel}|${selectedClass}`;

  const getMark = (studentId: string, col: number): AttendanceStatus =>
    marks[`${contextPrefix}|${studentId}|${col}`] || '';

  const setMark = (
    studentId: string,
    col: number,
    status: AttendanceStatus
  ) => {
    const key = `${contextPrefix}|${studentId}|${col}`;
    setMarks((prev) => {
      const next = { ...prev };
      if (!status) delete next[key];
      else next[key] = status;
      return next;
    });
  };

  const handleMarkAllColumn = (status: AttendanceStatus) => {
    const safeCol = Math.min(selectedCol, columnCount);
    setMarks((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((s) => {
        const key = `${contextPrefix}|${s.id}|${safeCol}`;
        if (!status) delete next[key];
        else next[key] = status;
      });
      return next;
    });
  };

  const handleClearCurrent = () => {
    setMarks((prev) => {
      const next: Record<string, AttendanceStatus> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (!k.startsWith(`${contextPrefix}|`)) {
          next[k] = v;
        }
      });
      return next;
    });
  };

  const getStudentSummary = (studentId: string) => {
    let h = 0;
    let s = 0;
    let i = 0;
    let a = 0;
    columnsArray.forEach((c) => {
      const st = getMark(studentId, c);
      if (st === 'H') h++;
      else if (st === 'S') s++;
      else if (st === 'I') i++;
      else if (st === 'A') a++;
    });
    return { h, s, i, a };
  };

  const handleExportExcel = () => {
    const rows = filteredStudents.map((st, idx) => {
      const sum = getStudentSummary(st.id);
      const row: Record<string, string | number> = {
        No: idx + 1,
        'Nama Siswa': st.nama,
        NIS: st.nis || '-',
        NISN: st.nisn || '-',
        Kelas: st.kelas,
        'Mata Pelajaran': selectedMapel,
      };
      columnsArray.forEach((c) => {
        const colHeader = columnMode === 'pertemuan' ? `P${c}` : String(c);
        row[colHeader] = blankPrint ? '' : getMark(st.id, c) || '';
      });
      row['H'] = blankPrint ? '' : sum.h;
      row['S'] = blankPrint ? '' : sum.s;
      row['I'] = blankPrint ? '' : sum.i;
      row['A'] = blankPrint ? '' : sum.a;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absen Mapel');
    XLSX.writeFile(
      wb,
      `Absen_Mapel_${selectedMapel.slice(0, 18)}_Kls_${selectedClass}.xlsx`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-5 print:p-0 print:max-w-none">
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Absen Siswa Mata Pelajaran
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Daftar hadir siswa per mata pelajaran (Pertemuan P1–P16 atau Bulanan) lengkap dengan Kop Surat resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('input')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                viewMode === 'input'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input &amp; Rekap
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                viewMode === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau Cetak
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              setTimeout(
                () =>
                  exportPaperToWord(
                    'absen-mapel-paper',
                    `Absen_Mapel_${selectedMapel.slice(0, 20)}_Kelas_${selectedClass}`
                  ),
                60
              );
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Word
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              printPaperElement('absen-mapel-paper', {
                title: `Absen Mapel ${selectedMapel} Kelas ${selectedClass}`,
                paperSize: columnMode === 'bulanan' ? 'A4' : 'F4',
                orientation:
                  columnMode === 'bulanan' ? 'landscape' : 'portrait',
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className={inputCls}
            >
              {MAPEL_SD_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Pilih Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={inputCls}
            >
              <option value="Semua">Semua Kelas ({students.length} Siswa)</option>
              {KELAS_LIST.map((k) => {
                const cnt = students.filter((s) =>
                  matchStudentClass(s.kelas, k)
                ).length;
                return (
                  <option key={k} value={k}>
                    Kelas {k} ({cnt} Siswa)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className={labelCls}>Guru Pengampu Mapel</label>
            <select
              value={guruMapelId || selectedGuru?.id || ''}
              onChange={(e) => setGuruMapelId(e.target.value)}
              className={inputCls}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Format Kolom &amp; Periode</label>
            <div className="flex items-center gap-2">
              <select
                value={columnMode}
                onChange={(e) => {
                  setColumnMode(e.target.value as 'pertemuan' | 'bulanan');
                  setSelectedCol(1);
                }}
                className={inputCls}
              >
                <option value="pertemuan">Pertemuan (P1–P16)</option>
                <option value="bulanan">Bulanan (Tgl 1–31)</option>
              </select>
              {columnMode === 'bulanan' && (
                <input
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-700">
              Isi Cepat:
            </span>
            <select
              value={Math.min(selectedCol, columnCount)}
              onChange={(e) => setSelectedCol(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 tabular-nums"
            >
              {columnsArray.map((c) => (
                <option key={c} value={c}>
                  {columnMode === 'pertemuan'
                    ? `Pertemuan ${c}`
                    : `Tanggal ${c}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleMarkAllColumn('H')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Hadir Semua
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={blankPrint}
                onChange={(e) => setBlankPrint(e.target.checked)}
                className="rounded border-slate-300 text-[#1E3A5F]"
              />
              Cetak Blangko Kosong
            </label>
            <button
              type="button"
              onClick={handleClearCurrent}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:text-rose-600"
            >
              <Eraser className="w-3.5 h-3.5" />
              Kosongkan Data
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'input' && (
        <div className="no-print bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Belum ada data siswa untuk Kelas {selectedClass}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="py-2 px-2.5 text-center sticky left-0 z-10 bg-slate-50 border-r border-slate-200 w-9">
                      No
                    </th>
                    <th className="py-2 px-3 sticky left-9 z-10 bg-slate-50 border-r border-slate-200 min-w-[200px]">
                      Nama Siswa
                    </th>
                    {columnsArray.map((c) => (
                      <th
                        key={c}
                        className="py-2 px-1 text-center min-w-[32px] border-r border-slate-200 tabular-nums"
                      >
                        {columnMode === 'pertemuan' ? `P${c}` : c}
                      </th>
                    ))}
                    <th className="py-2 px-1.5 text-center bg-emerald-50/70 text-emerald-800 border-r border-slate-200">
                      H
                    </th>
                    <th className="py-2 px-1.5 text-center bg-amber-50/70 text-amber-800 border-r border-slate-200">
                      S
                    </th>
                    <th className="py-2 px-1.5 text-center bg-sky-50/70 text-sky-800 border-r border-slate-200">
                      I
                    </th>
                    <th className="py-2 px-1.5 text-center bg-rose-50/70 text-rose-800">
                      A
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredStudents.map((st, idx) => {
                    const sum = getStudentSummary(st.id);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-2.5 text-center text-slate-500 sticky left-0 z-10 bg-white border-r border-slate-200 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 sticky left-9 z-10 bg-white border-r border-slate-200 min-w-[230px]">
                          <div className="font-medium text-slate-900 truncate max-w-[220px]">
                            {st.nama}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            NIS {st.nis || '-'} · NISN {st.nisn || '-'} · Kls {st.kelas}
                          </div>
                        </td>
                        {columnsArray.map((c) => {
                          const mark = getMark(st.id, c);
                          return (
                            <td
                              key={c}
                              className="p-0 border-r border-slate-200 text-center"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setMark(
                                    st.id,
                                    c,
                                    nextAttendanceStatus(mark, false)
                                  )
                                }
                                className={`w-full h-9 text-[11px] font-mono transition-colors hover:ring-1 hover:ring-inset hover:ring-[#1E3A5F] ${statusCellClass(
                                  mark
                                )}`}
                              >
                                {mark || '·'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-emerald-700 border-r border-slate-200 tabular-nums">
                          {sum.h}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-amber-700 border-r border-slate-200 tabular-nums">
                          {sum.s}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-sky-700 border-r border-slate-200 tabular-nums">
                          {sum.i}
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-semibold text-rose-700 tabular-nums">
                          {sum.a}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Sheet */}
      <div
        className={`${
          viewMode === 'preview' ? 'block' : 'hidden print:block'
        } print-only-container overflow-x-auto pb-8`}
      >
        <div
          id="absen-mapel-paper"
          className="paper-sheet mx-auto shadow-md border border-slate-200 print:shadow-none print:border-none"
          style={{
            width: columnMode === 'bulanan' ? '297mm' : '215mm',
            minHeight: columnMode === 'bulanan' ? '210mm' : '330mm',
            padding: '13mm 14mm',
          }}
        >
          <KopSurat school={school} />

          <div className="text-center mb-3">
            <p className="text-[12pt] font-bold uppercase underline">
              DAFTAR HADIR SISWA MATA PELAJARAN
            </p>
            <p className="text-[10.5pt] mt-0.5">
              Tahun Pelajaran {school.tahunPelajaran} · Semester {school.semester}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[9.5pt] mb-2.5">
            <div>
              <p>
                <strong>Mata Pelajaran:</strong> {selectedMapel}
              </p>
              <p>
                <strong>Kelas:</strong>{' '}
                {selectedClass === 'Semua'
                  ? 'Semua Kelas (I – VI)'
                  : `Kelas ${selectedClass}`}
              </p>
            </div>
            <div className="text-right">
              <p>
                <strong>Guru Pengampu:</strong> {selectedGuru?.nama || '-'}
              </p>
              <p>
                <strong>Periode:</strong>{' '}
                {columnMode === 'bulanan'
                  ? formatYearMonthIndo(yearMonth)
                  : 'Pertemuan 1 s.d. 16'}
              </p>
            </div>
          </div>

          <table className="doc-table w-full border border-black text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100">
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 text-center w-7"
                >
                  No
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 text-left min-w-[75px]"
                >
                  NIS / NISN
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-1 text-left min-w-[155px]"
                >
                  Nama Siswa
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 text-center w-14"
                >
                  Kelas
                </th>
                <th
                  colSpan={columnCount}
                  className="border border-black px-1 py-0.5 text-center"
                >
                  {columnMode === 'pertemuan'
                    ? 'Pertemuan Ke-'
                    : `Tanggal (${formatYearMonthIndo(yearMonth)})`}
                </th>
                <th
                  colSpan={4}
                  className="border border-black px-1 py-0.5 text-center"
                >
                  Rekap
                </th>
              </tr>
              <tr className="bg-slate-100">
                {columnsArray.map((c) => (
                  <th
                    key={c}
                    className="border border-black px-0.5 py-0.5 text-center min-w-[18px] tabular-nums"
                  >
                    {columnMode === 'pertemuan' ? `P${c}` : c}
                  </th>
                ))}
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  H
                </th>
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  S
                </th>
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  I
                </th>
                <th className="border border-black px-1 py-0.5 text-center w-5">
                  A
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st, idx) => {
                const sum = getStudentSummary(st.id);
                return (
                  <tr key={st.id}>
                    <td className="border border-black px-1.5 py-1 text-center tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-[7.5pt] tabular-nums">
                      {st.nis || '-'} / {st.nisn || '-'}
                    </td>
                    <td className="border border-black px-2 py-1 font-medium">
                      {st.nama}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {st.kelas}
                    </td>
                    {columnsArray.map((c) => (
                      <td
                        key={c}
                        className="border border-black px-0.5 py-1 text-center tabular-nums"
                      >
                        {blankPrint ? '' : getMark(st.id, c)}
                      </td>
                    ))}
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.h}
                    </td>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.s}
                    </td>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.i}
                    </td>
                    <td className="border border-black px-1 py-1 text-center tabular-nums">
                      {blankPrint ? '' : sum.a}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-5 flex justify-between items-start text-[9.5pt]">
            <div className="w-[230px]">
              <p>Mengetahui,</p>
              <p>Kepala {school.namaSekolah}</p>
              <div className="h-14" />
              <p className="font-bold underline">{school.namaKepalaSekolah}</p>
              <p>NIP. {school.nipKepalaSekolah}</p>
            </div>

            <div className="w-[230px]">
              <p>
                {school.kabupatenKota}, {formatTanggalIndonesia(todayIsoDate())}
              </p>
              <p>Guru Mata Pelajaran</p>
              <div className="h-14" />
              <p className="font-bold underline">
                {selectedGuru?.nama || '........................................'}
              </p>
              <p>NIP. {selectedGuru?.nip || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
