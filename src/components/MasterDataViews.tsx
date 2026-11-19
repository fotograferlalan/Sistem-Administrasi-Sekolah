import React, { useRef, useState } from 'react';
import { Check, Download, Plus, Trash2, Upload } from 'lucide-react';
import { SchoolProfile, Student, Teacher } from '../types/admin';
import {
  applySchoolDirectoryEntry,
  SD_SCHOOL_DIRECTORY,
} from '../data/defaultData';
import { formatTanggalIndonesia } from '../utils/formatters';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15';
const labelCls = 'block text-xs font-medium text-slate-700 mb-1';

/* =========================================================
   1. MASTER DATA GURU & TENDIK (PTK)
========================================================= */
interface TeachersViewProps {
  teachers: Teacher[];
  onSaveTeachers: (next: Teacher[]) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  onSaveTeachers,
}) => {
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openNew = () => {
    setEditing({
      id: `ptk-${Date.now()}`,
      nama: '',
      nip: '-',
      nuptk: '-',
      tempatLahir: '',
      tanggalLahir: '1990-01-01',
      jenisKelamin: 'P',
      pendidikanTerakhir: 'S1 PGSD',
      pangkatGolongan: '-',
      statusKepegawaian: 'GTT / Honorer',
      jabatan: 'Guru Kelas',
      tmtMulai: '2024-07-01',
      alamat: '',
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.nama.trim()) return;
    const exists = teachers.some((t) => t.id === editing.id);
    if (exists) {
      onSaveTeachers(teachers.map((t) => (t.id === editing.id ? editing : t)));
    } else {
      onSaveTeachers([...teachers, editing]);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Data Guru &amp; Tenaga Kependidikan (PTK)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Digunakan untuk pengisian otomatis SK Pengangkatan Guru, SK Pembagian Tugas Mengajar, dan Surat Tugas.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Guru / PTK
        </button>
      </div>

      {isFormOpen && editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              {teachers.some((t) => t.id === editing.id)
                ? 'Edit Data Guru / PTK'
                : 'Tambah Guru / PTK Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Nama Lengkap &amp; Gelar</label>
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
              <label className={labelCls}>NIP (isi "-" jika non-ASN)</label>
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
              <label className={labelCls}>Jabatan / Tugas Utama</label>
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
              <label className={labelCls}>Pendidikan Terakhir</label>
              <input
                type="text"
                value={editing.pendidikanTerakhir}
                onChange={(e) =>
                  setEditing({ ...editing, pendidikanTerakhir: e.target.value })
                }
                className={inputCls}
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
            <div>
              <label className={labelCls}>TMT Mulai Tugas</label>
              <input
                type="date"
                value={editing.tmtMulai}
                onChange={(e) =>
                  setEditing({ ...editing, tmtMulai: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              Simpan Data PTK
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama &amp; Pendidikan</th>
                <th className="py-3 px-4">NIP / NUPTK</th>
                <th className="py-3 px-4">Status &amp; Golongan</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {teachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 text-center text-xs text-slate-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-900">{t.nama}</div>
                    <div className="text-xs text-slate-500">
                      {t.pendidikanTerakhir} · Lahir {t.tempatLahir}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                    <div>NIP: {t.nip}</div>
                    <div className="text-slate-500">NUPTK: {t.nuptk}</div>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-700">
                    <div className="font-medium">{t.statusKepegawaian}</div>
                    <div className="text-slate-500">{t.pangkatGolongan}</div>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-700">
                    {t.jabatan}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({ ...t });
                          setIsFormOpen(true);
                        }}
                        className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveTeachers(teachers.filter((x) => x.id !== t.id))
                        }
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
      </div>
    </div>
  );
};

/* =========================================================
   2. MASTER DATA SISWA (PESERTA DIDIK)
========================================================= */
interface StudentsViewProps {
  students: Student[];
  onSaveStudents: (next: Student[]) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onSaveStudents,
}) => {
  const [editing, setEditing] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openNew = () => {
    setEditing({
      id: `sis-${Date.now()}`,
      nama: '',
      nis: '',
      nisn: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '2016-05-10',
      jenisKelamin: 'Laki-laki',
      agama: 'Islam',
      kelas: 'IV (Empat)',
      namaAyah: '',
      namaIbu: '',
      pekerjaanOrtu: 'Wiraswasta',
      alamatOrtu: '',
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.nama.trim()) return;
    const exists = students.some((s) => s.id === editing.id);
    if (exists) {
      onSaveStudents(students.map((s) => (s.id === editing.id ? editing : s)));
    } else {
      onSaveStudents([...students, editing]);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Data Peserta Didik (Siswa SD)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Sumber pengisian cepat untuk Surat Mutasi, Surat Pindah Sekolah, Siswa Aktif, Kelakuan Baik, dan SKL.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </button>
      </div>

      {isFormOpen && editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              {students.some((s) => s.id === editing.id)
                ? 'Edit Data Siswa'
                : 'Tambah Data Siswa Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Nama Lengkap Siswa</label>
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
              <label className={labelCls}>NIS</label>
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
              <label className={labelCls}>Kelas</label>
              <input
                type="text"
                value={editing.kelas}
                onChange={(e) =>
                  setEditing({ ...editing, kelas: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jenis Kelamin</label>
              <select
                value={editing.jenisKelamin}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan',
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
              <label className={labelCls}>Nama Orang Tua / Wali</label>
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
              <label className={labelCls}>Pekerjaan Orang Tua</label>
              <input
                type="text"
                value={editing.pekerjaanOrtu}
                onChange={(e) =>
                  setEditing({ ...editing, pekerjaanOrtu: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Alamat Orang Tua</label>
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

          <div className="flex justify-end gap-2 pt-2">
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">TTL</th>
                <th className="py-3 px-4">Orang Tua / Wali</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 text-center text-xs text-slate-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-900">{s.nama}</div>
                    <div className="text-xs text-slate-500">
                      {s.jenisKelamin} · {s.agama}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                    <div>NIS: {s.nis}</div>
                    <div className="text-slate-500">NISN: {s.nisn}</div>
                  </td>
                  <td className="py-2.5 px-4 text-xs font-medium text-slate-800">
                    Kelas {s.kelas}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    {s.tempatLahir}, {formatTanggalIndonesia(s.tanggalLahir)}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    <div className="font-medium text-slate-800">
                      {s.namaAyah}
                    </div>
                    <div className="truncate max-w-[220px]">{s.alamatOrtu}</div>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({ ...s });
                          setIsFormOpen(true);
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   3. PENGATURAN SEKOLAH, KOP SURAT & CADANGAN DATA
========================================================= */
interface SchoolSettingsViewProps {
  school: SchoolProfile;
  onSaveSchool: (next: SchoolProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  school,
  onSaveSchool,
  onExportBackup,
  onImportBackup,
}) => {
  const [draft, setDraft] = useState<SchoolProfile>(school);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [manualSchoolName, setManualSchoolName] = useState(false);
  const [manualNpsn, setManualNpsn] = useState(false);
  const pendidikanInputRef = useRef<HTMLInputElement>(null);
  const daerahInputRef = useRef<HTMLInputElement>(null);

  const handleSelectByNpsn = (npsn: string) => {
    if (npsn === '__manual__') {
      setManualNpsn(true);
      return;
    }
    const entry = SD_SCHOOL_DIRECTORY.find((item) => item.npsn === npsn);
    if (entry) {
      setManualSchoolName(false);
      setManualNpsn(false);
      setDraft((prev) => applySchoolDirectoryEntry(prev, entry));
    } else {
      const clean = npsn.trim();
      setDraft((prev) => ({
        ...prev,
        npsn: clean,
        kodeSuratSekolah: clean.length >= 4 ? `SDN-${clean.slice(-4)}` : prev.kodeSuratSekolah,
      }));
    }
  };

  const handleSelectBySchoolName = (nama: string) => {
    if (nama === '__manual__') {
      setManualSchoolName(true);
      return;
    }
    const entry = SD_SCHOOL_DIRECTORY.find((item) => item.namaSekolah === nama);
    if (entry) {
      setManualSchoolName(false);
      setManualNpsn(false);
      setDraft((prev) => applySchoolDirectoryEntry(prev, entry));
    } else {
      setDraft((prev) => ({ ...prev, namaSekolah: nama }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchool(draft);
    setSavedNotice('Pengaturan sekolah berhasil disimpan');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleUploadForMenu = (
    target: 'tut_wuri' | 'garuda',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'tut_wuri') {
          setDraft((prev) => ({
            ...prev,
            logoMode: 'tut_wuri',
            logoPendidikanDataUrl: reader.result as string,
          }));
        } else {
          setDraft((prev) => ({
            ...prev,
            logoMode: 'garuda',
            logoDaerahDataUrl: reader.result as string,
          }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Pengaturan Identitas Sekolah &amp; Kop Surat
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Semua perubahan akan langsung diterapkan pada Kop Surat dan penandatanganan seluruh SK maupun surat dinas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Cadangkan Data (.json)
          </button>
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Pulihkan Data
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportBackup(f);
              }}
            />
          </label>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Pemerintah Daerah / Instansi Induk</label>
            <input
              type="text"
              value={draft.pemerintahDaerah}
              onChange={(e) =>
                setDraft({ ...draft, pemerintahDaerah: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nama Dinas Pendidikan</label>
            <input
              type="text"
              value={draft.dinasPendidikan}
              onChange={(e) =>
                setDraft({ ...draft, dinasPendidikan: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Nama Sekolah (Kop Surat)
              </label>
              {manualSchoolName && (
                <button
                  type="button"
                  onClick={() => setManualSchoolName(false)}
                  className="text-[11px] font-medium text-[#1E3A5F] hover:underline"
                >
                  Pilih dari Daftar Sekolah
                </button>
              )}
            </div>
            {manualSchoolName ? (
              <input
                type="text"
                value={draft.namaSekolah}
                onChange={(e) =>
                  setDraft({ ...draft, namaSekolah: e.target.value })
                }
                className={inputCls}
              />
            ) : (
              <select
                aria-label="Nama Sekolah (Kop Surat)"
                value={draft.namaSekolah}
                onChange={(e) => handleSelectBySchoolName(e.target.value)}
                className={inputCls}
              >
                {!SD_SCHOOL_DIRECTORY.some(
                  (s) => s.namaSekolah === draft.namaSekolah
                ) && (
                  <option value={draft.namaSekolah}>
                    {draft.namaSekolah || 'Pilih Nama Sekolah...'}
                  </option>
                )}
                {SD_SCHOOL_DIRECTORY.map((entry) => (
                  <option key={entry.npsn} value={entry.namaSekolah}>
                    {entry.namaSekolah}
                  </option>
                ))}
                <option value="__manual__">+ Ketik Manual...</option>
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status Sekolah</label>
              <select
                value={draft.statusSekolah}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    statusSekolah: e.target.value as 'Negeri' | 'Swasta',
                  })
                }
                className={inputCls}
              >
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Kode Surat Sekolah</label>
              <input
                type="text"
                value={draft.kodeSuratSekolah}
                onChange={(e) =>
                  setDraft({ ...draft, kodeSuratSekolah: e.target.value })
                }
                placeholder="SDN-5347"
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  NPSN
                </label>
                {manualNpsn && (
                  <button
                    type="button"
                    onClick={() => setManualNpsn(false)}
                    className="text-[11px] font-medium text-[#1E3A5F] hover:underline"
                  >
                    Daftar
                  </button>
                )}
              </div>
              {manualNpsn ? (
                <input
                  type="text"
                  value={draft.npsn}
                  onChange={(e) => {
                    const val = e.target.value;
                    const trimmed = val.trim();
                    setDraft({
                      ...draft,
                      npsn: val,
                      kodeSuratSekolah:
                        trimmed.length >= 4
                          ? `SDN-${trimmed.slice(-4)}`
                          : draft.kodeSuratSekolah,
                    });
                  }}
                  className={`${inputCls} font-mono text-xs`}
                />
              ) : (
                <select
                  aria-label="NPSN"
                  value={draft.npsn}
                  onChange={(e) => handleSelectByNpsn(e.target.value)}
                  className={`${inputCls} font-mono text-xs tabular-nums`}
                >
                  {!SD_SCHOOL_DIRECTORY.some((s) => s.npsn === draft.npsn) && (
                    <option value={draft.npsn}>
                      {draft.npsn || 'Pilih NPSN...'}
                    </option>
                  )}
                  {SD_SCHOOL_DIRECTORY.map((entry) => (
                    <option key={entry.npsn} value={entry.npsn}>
                      {entry.npsn}
                    </option>
                  ))}
                  <option value="__manual__">+ Ketik Manual...</option>
                </select>
              )}
            </div>
            <div>
              <label className={labelCls}>Akreditasi</label>
              <input
                type="text"
                value={draft.akreditasi}
                onChange={(e) =>
                  setDraft({ ...draft, akreditasi: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kode Pos</label>
              <input
                type="text"
                value={draft.kodePos}
                onChange={(e) =>
                  setDraft({ ...draft, kodePos: e.target.value })
                }
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Alamat Jalan Sekolah</label>
            <input
              type="text"
              value={draft.alamat}
              onChange={(e) => setDraft({ ...draft, alamat: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kecamatan</label>
              <input
                type="text"
                value={draft.kecamatan}
                onChange={(e) =>
                  setDraft({ ...draft, kecamatan: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kabupaten / Kota</label>
              <input
                type="text"
                value={draft.kabupatenKota}
                onChange={(e) =>
                  setDraft({ ...draft, kabupatenKota: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Telepon</label>
              <input
                type="text"
                value={draft.telepon}
                onChange={(e) =>
                  setDraft({ ...draft, telepon: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email Resmi Sekolah</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nama Kepala Sekolah &amp; Gelar</label>
            <input
              type="text"
              value={draft.namaKepalaSekolah}
              onChange={(e) =>
                setDraft({ ...draft, namaKepalaSekolah: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>NIP Kepala Sekolah</label>
            <input
              type="text"
              value={draft.nipKepalaSekolah}
              onChange={(e) =>
                setDraft({ ...draft, nipKepalaSekolah: e.target.value })
              }
              className={`${inputCls} font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelCls}>Tahun Pelajaran Aktif</label>
            <input
              type="text"
              value={draft.tahunPelajaran}
              onChange={(e) =>
                setDraft({ ...draft, tahunPelajaran: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Semester Aktif</label>
            <select
              value={draft.semester}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  semester: e.target.value as 'Ganjil' | 'Genap',
                })
              }
              className={inputCls}
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          {draft.statusSekolah === 'Swasta' && (
            <>
              <div>
                <label className={labelCls}>Nama Yayasan (Sekolah Swasta)</label>
                <input
                  type="text"
                  value={draft.namaYayasan}
                  onChange={(e) =>
                    setDraft({ ...draft, namaYayasan: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nama Ketua Yayasan</label>
                <input
                  type="text"
                  value={draft.namaKetuaYayasan}
                  onChange={(e) =>
                    setDraft({ ...draft, namaKetuaYayasan: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </>
          )}
        </div>

        {/* Logo Kop Surat Selector */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div>
            <label className={labelCls}>Lambang / Logo Kop Surat</label>
            <p className="text-xs text-slate-500">
              Kedua lambang tampil otomatis pada semua Kop Surat sekolah (Lambang Daerah di sisi kiri dan Logo Pendidikan Dasar di sisi kanan). Unggah gambar PNG/JPG pada masing-masing menu bila ingin mengganti lambang bawaan.
            </p>
          </div>

          <input
            ref={pendidikanInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleUploadForMenu('tut_wuri', e)}
          />
          <input
            ref={daerahInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleUploadForMenu('garuda', e)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Menu 1: Lambang Daerah / Segel Resmi (Kiri) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 p-1">
                  {draft.logoDaerahDataUrl ? (
                    <img
                      src={draft.logoDaerahDataUrl}
                      alt="Lambang Daerah / Segel Resmi"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 80 80"
                      className="w-9 h-9 text-slate-900"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Lambang Daerah / Segel Resmi"
                    >
                      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="1" />
                      <path
                        d="M40 16L45.5 29.5L60 30.8L49 40.4L52.3 54.5L40 47L27.7 54.5L31 40.4L20 30.8L34.5 29.5L40 16Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path d="M24 62H56" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Lambang Daerah / Segel Resmi
                  </p>
                  <p className="text-xs text-slate-500">
                    Posisi Kiri Kop Surat
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => daerahInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {draft.logoDaerahDataUrl ? 'Ganti Logo' : 'Unggah Logo'}
                </button>
                {draft.logoDaerahDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, logoDaerahDataUrl: undefined })
                    }
                    className="text-[11px] text-slate-500 hover:text-rose-600"
                  >
                    Pakai Bawaan
                  </button>
                )}
              </div>
            </div>

            {/* Menu 2: Logo Pendidikan Dasar (Kanan) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 p-1">
                  {draft.logoPendidikanDataUrl ? (
                    <img
                      src={draft.logoPendidikanDataUrl}
                      alt="Logo Pendidikan Dasar"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 80 80"
                      className="w-9 h-9 text-slate-900"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Logo Pendidikan Dasar"
                    >
                      <path
                        d="M40 7L69 21V44C69 58 55.5 68.5 40 74C24.5 68.5 11 58 11 44V21L40 7Z"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      />
                      <path
                        d="M40 13L63 24.5V43C63 54 51.5 62.5 40 67.5C28.5 62.5 17 54 17 43V24.5L40 13Z"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <path
                        d="M40 19C42.5 23 44 26 44 29C44 31.5 42.2 33.5 40 33.5C37.8 33.5 36 31.5 36 29C36 26 37.5 23 40 19Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M25 36C25 31 31 28 40 28C49 28 55 31 55 36C55 43 47 47 40 53C33 47 25 43 25 36Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path d="M40 33V53" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M24 55H56" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Logo Pendidikan Dasar
                  </p>
                  <p className="text-xs text-slate-500">
                    Posisi Kanan Kop Surat
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => pendidikanInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {draft.logoPendidikanDataUrl ? 'Ganti Logo' : 'Unggah Logo'}
                </button>
                {draft.logoPendidikanDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, logoPendidikanDataUrl: undefined })
                    }
                    className="text-[11px] text-slate-500 hover:text-rose-600"
                  >
                    Pakai Bawaan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <Check className="w-4 h-4" />
              {savedNotice}
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49]"
          >
            Simpan Pengaturan Kop Surat
          </button>
        </div>
      </form>
    </div>
  );
};
