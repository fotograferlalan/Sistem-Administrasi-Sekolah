import React, { useEffect, useState } from 'react';
import {
  Archive,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutGrid,
  Menu,
  School,
  Settings,
  Users,
  X,
} from 'lucide-react';
import {
  ArchivedDocument,
  DocumentFormData,
  DocumentType,
  PaperSize,
  SchoolProfile,
  Student,
  Teacher,
} from './types/admin';
import {
  applySchoolDirectoryEntry,
  buildTeachingAssignmentsFromTeachers,
  createInitialArchives,
  createInitialFormData,
  DEFAULT_SCHOOL_PROFILE,
  DEFAULT_STUDENTS,
  DEFAULT_TEACHERS,
  DOC_TEMPLATES,
  SD_SCHOOL_DIRECTORY,
} from './data/defaultData';
import { DashboardOverview } from './components/DashboardOverview';
import { LetterEditor } from './components/LetterEditor';
import { AgendaArchive } from './components/AgendaArchive';
import { SchoolSettingsView } from './components/MasterDataViews';
import { StudentsView } from './components/StudentsView';
import { TeachersView } from './components/TeachersView';
import {
  AbsenPegawaiPengawasView,
  AbsenSiswaKelasView,
  AbsenSiswaMapelView,
} from './components/AttendanceViews';

type ActiveTab =
  | 'dashboard'
  | 'editor'
  | 'agenda'
  | 'teachers'
  | 'students'
  | 'absen_pegawai'
  | 'absen_siswa_kelas'
  | 'absen_siswa_mapel'
  | 'settings';

const STORAGE_KEYS = {
  school: 'tatausaha_sd_school_v1',
  teachers: 'tatausaha_sd_teachers_v1',
  students: 'tatausaha_sd_students_v1',
  archives: 'tatausaha_sd_archives_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [school, setSchool] = useState<SchoolProfile>(() =>
    loadFromStorage(STORAGE_KEYS.school, DEFAULT_SCHOOL_PROFILE)
  );
  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    loadFromStorage(STORAGE_KEYS.teachers, DEFAULT_TEACHERS)
  );
  const [students, setStudents] = useState<Student[]>(() =>
    loadFromStorage(STORAGE_KEYS.students, DEFAULT_STUDENTS)
  );
  const [archives, setArchives] = useState<ArchivedDocument[]>(() =>
    loadFromStorage(
      STORAGE_KEYS.archives,
      createInitialArchives(
        DEFAULT_SCHOOL_PROFILE,
        DEFAULT_TEACHERS,
        DEFAULT_STUDENTS
      )
    )
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active document editor state
  const [docType, setDocType] = useState<DocumentType>('sk_pengangkatan_guru');
  const [paperSize, setPaperSize] = useState<PaperSize>('F4');
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>(() =>
    createInitialFormData(
      'sk_pengangkatan_guru',
      school,
      archives.length + 1,
      teachers,
      students
    )
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.school, JSON.stringify(school));
    } catch {
      // ignore storage quota errors
    }
  }, [school]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.teachers, JSON.stringify(teachers));
    } catch {
      // ignore
    }
    if (!editingArchiveId && docType === 'sk_pembagian_tugas') {
      setFormData((prev) => ({
        ...prev,
        lampiranTugasRows: buildTeachingAssignmentsFromTeachers(teachers),
      }));
    }
  }, [teachers, editingArchiveId, docType]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.archives, JSON.stringify(archives));
    } catch {
      // ignore
    }
  }, [archives]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartDocument = (type: DocumentType) => {
    setDocType(type);
    setEditingArchiveId(null);
    setFormData(
      createInitialFormData(
        type,
        school,
        archives.length + 1,
        teachers,
        students
      )
    );
    setActiveTab('editor');
    setMobileMenuOpen(false);
  };

  const handleSwitchDocTypeInEditor = (nextType: DocumentType) => {
    setDocType(nextType);
    setEditingArchiveId(null);
    setFormData(
      createInitialFormData(
        nextType,
        school,
        archives.length + 1,
        teachers,
        students
      )
    );
  };

  const buildArchiveTitleAndSubject = (
    type: DocumentType,
    data: DocumentFormData
  ): { judul: string; subjekUtama: string } => {
    switch (type) {
      case 'sk_pengangkatan_guru':
        return {
          judul: `SK Pengangkatan ${data.statusPengangkatan} — ${data.guruNama}`,
          subjekUtama: data.guruNama,
        };
      case 'sk_pembagian_tugas': {
        const totalJtm = data.lampiranTugasRows.reduce(
          (s, r) => s + (Number(r.jamTatapMuka) || 0),
          0
        );
        return {
          judul: `SK Pembagian Tugas Mengajar Semester ${data.pembagianSemester} ${data.pembagianTahunPelajaran}`,
          subjekUtama: `${data.lampiranTugasRows.length} Pendidik · Total ${totalJtm} JTM`,
        };
      }
      case 'surat_mutasi':
        return {
          judul: `Surat Keterangan Mutasi Siswa — ${data.siswaNama}`,
          subjekUtama: `${data.siswaNama} → ${data.sekolahTujuan}`,
        };
      case 'surat_siap_terima':
        return {
          judul: `Surat Siap Terima Siswa — ${data.siswaNama}`,
          subjekUtama: `Dari ${data.sekolahAsal} (Kelas ${data.kelasDiterima})`,
        };
      case 'surat_pindah_sekolah':
        return {
          judul: `Surat Pindah Sekolah — ${data.siswaNama}`,
          subjekUtama: `${data.siswaNama} → ${data.sekolahTujuan}`,
        };
      case 'surat_siswa_aktif':
        return {
          judul: `Surat Keterangan Siswa Aktif — ${data.siswaNama}`,
          subjekUtama: `${data.siswaNama} (Kelas ${data.siswaKelas})`,
        };
      case 'surat_kelakuan_baik':
        return {
          judul: `Surat Kelakuan Baik — ${data.siswaNama}`,
          subjekUtama: `${data.siswaNama} (Kelas ${data.siswaKelas})`,
        };
      case 'surat_tugas':
        return {
          judul: `Surat Tugas — ${data.namaKegiatanTugas}`,
          subjekUtama: `${data.petugasRows.length} Petugas`,
        };
      case 'surat_undangan':
        return {
          judul: `Undangan — ${data.perihal}`,
          subjekUtama: data.kepadaYth,
        };
      case 'surat_keterangan_lulus':
        return {
          judul: `SKL Tahun ${data.sklTahunLulus} — ${data.siswaNama}`,
          subjekUtama: `${data.siswaNama} (${data.sklStatusKelulusan})`,
        };
      case 'surat_panggilan_ortu':
        return {
          judul: `Panggilan Orang Tua (${data.panggilanKe}) — ${data.siswaNama}`,
          subjekUtama: `Wali Murid: ${data.ortuNama}`,
        };
      default:
        return {
          judul: data.perihal || 'Dokumen Sekolah',
          subjekUtama: school.namaSekolah,
        };
    }
  };

  const handleSaveToArchive = () => {
    const meta = DOC_TEMPLATES.find((t) => t.type === docType)!;
    const { judul, subjekUtama } = buildArchiveTitleAndSubject(
      docType,
      formData
    );
    const nowIso = new Date().toISOString();

    if (editingArchiveId) {
      setArchives((prev) =>
        prev.map((item) =>
          item.id === editingArchiveId
            ? {
                ...item,
                docType,
                category: meta.category,
                nomorSurat: formData.nomorSurat,
                judul,
                subjekUtama,
                tanggalSurat: formData.tanggalSurat,
                updatedAt: nowIso,
                paperSize,
                data: formData,
              }
            : item
        )
      );
      setSaveFeedback('Tersimpan');
    } else {
      const newId = `arc-${Date.now()}`;
      const newItem: ArchivedDocument = {
        id: newId,
        docType,
        category: meta.category,
        nomorSurat: formData.nomorSurat,
        judul,
        subjekUtama,
        tanggalSurat: formData.tanggalSurat,
        createdAt: nowIso,
        updatedAt: nowIso,
        paperSize,
        data: formData,
      };
      setArchives((prev) => [newItem, ...prev]);
      setEditingArchiveId(newId);
      setSaveFeedback('Diarsipkan');
    }

    setTimeout(() => setSaveFeedback(null), 2200);
  };

  const handleOpenArchiveItem = (item: ArchivedDocument) => {
    setDocType(item.docType);
    setPaperSize(item.paperSize || 'F4');
    setFormData(item.data);
    setEditingArchiveId(item.id);
    setActiveTab('editor');
    setMobileMenuOpen(false);
  };

  const handleDuplicateArchiveItem = (item: ArchivedDocument) => {
    const duplicatedData: DocumentFormData = {
      ...item.data,
    };
    setDocType(item.docType);
    setPaperSize(item.paperSize || 'F4');
    setFormData(duplicatedData);
    setEditingArchiveId(null);
    setActiveTab('editor');
    showToast('Dokumen diduplikasi sebagai draf baru. Sesuaikan nomor surat bila perlu.');
  };

  const handleDeleteArchiveItem = (id: string) => {
    setArchives((prev) => prev.filter((item) => item.id !== id));
    if (editingArchiveId === id) {
      setEditingArchiveId(null);
    }
    showToast('Arsip surat telah dihapus dari Buku Agenda.');
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      school,
      teachers,
      students,
      archives,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cadangan_TataUsaha_${school.kodeSuratSekolah}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File cadangan data sekolah (.json) berhasil diunduh.');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.school) setSchool(parsed.school);
        if (Array.isArray(parsed.teachers)) setTeachers(parsed.teachers);
        if (Array.isArray(parsed.students)) setStudents(parsed.students);
        if (Array.isArray(parsed.archives)) setArchives(parsed.archives);
        showToast('Data sekolah & arsip surat berhasil dipulihkan.');
      } catch {
        showToast('Format file cadangan tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'dashboard', label: 'Beranda Layanan', icon: LayoutGrid },
    { id: 'editor', label: 'Buat SK & Surat', icon: FileText },
    {
      id: 'agenda',
      label: 'Buku Agenda Surat',
      icon: Archive,
      count: archives.length,
    },
    {
      id: 'teachers',
      label: 'Data Guru & PTK',
      icon: Users,
      count: teachers.length,
    },
    {
      id: 'students',
      label: 'Data Siswa',
      icon: GraduationCap,
      count: students.length,
    },
    {
      id: 'absen_pegawai',
      label: 'Absen Pegawai & Pengawas',
      icon: ClipboardCheck,
    },
    {
      id: 'absen_siswa_kelas',
      label: 'Absen Siswa Kelas',
      icon: CalendarCheck,
    },
    {
      id: 'absen_siswa_mapel',
      label: 'Absen Siswa Mapel',
      icon: BookOpenCheck,
    },
    { id: 'settings', label: 'Kop & Profil Sekolah', icon: Settings },
  ];

  const pageTitleMap: Record<ActiveTab, string> = {
    dashboard: 'Beranda Tata Usaha SD',
    editor: 'Editor SK & Surat Resmi',
    agenda: 'Buku Agenda Surat Keluar',
    teachers: 'Master Data Guru & PTK',
    students: 'Master Data Siswa',
    absen_pegawai: 'Absen Pegawai & Pengawas Sekolah',
    absen_siswa_kelas: 'Absen Siswa Kelas',
    absen_siswa_mapel: 'Absen Siswa Mata Pelajaran',
    settings: 'Pengaturan Sekolah & Kop Surat',
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 print:block print:bg-white">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <School className="w-5 h-5 text-[#1E3A5F] shrink-0" />
            <span className="font-display font-bold text-base text-slate-900 tracking-tight truncate">
              TataUsaha SD
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900"
            aria-label="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1E3A5F] text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isActive ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-0.5">
          <p className="font-semibold text-slate-800 truncate">
            {school.namaSekolah}
          </p>
          <p className="truncate">
            TP {school.tahunPelajaran} · Sem. {school.semester}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        {/* Top Bar */}
        <header className="no-print h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Buka navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline truncate">
                {school.namaSekolah}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">
                {pageTitleMap[activeTab]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {toastMessage && (
              <span className="hidden md:inline text-xs font-medium text-emerald-700">
                {toastMessage}
              </span>
            )}
            {activeTab !== 'editor' && (
              <button
                type="button"
                onClick={() => handleStartDocument(docType)}
                className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] transition-colors whitespace-nowrap"
              >
                Buat SK / Surat
              </button>
            )}
          </div>
        </header>

        {/* Active Viewport */}
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              school={school}
              archives={archives}
              teacherCount={teachers.length}
              studentCount={students.length}
              onStartDocument={handleStartDocument}
              onOpenArchiveItem={handleOpenArchiveItem}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectSchoolPreset={(npsn) => {
                const entry = SD_SCHOOL_DIRECTORY.find((s) => s.npsn === npsn);
                if (!entry) return;
                setSchool((prev) => applySchoolDirectoryEntry(prev, entry));
                showToast(`Sekolah aktif diganti ke ${entry.namaSekolah} (NPSN ${entry.npsn}).`);
              }}
            />
          )}

          {activeTab === 'editor' && (
            <LetterEditor
              docType={docType}
              onChangeDocType={handleSwitchDocTypeInEditor}
              formData={formData}
              onChangeFormData={setFormData}
              school={school}
              teachers={teachers}
              students={students}
              paperSize={paperSize}
              onChangePaperSize={setPaperSize}
              editingArchiveId={editingArchiveId}
              nextSequenceNumber={archives.length + 1}
              onSaveToArchive={handleSaveToArchive}
              onResetNewDraft={() => handleStartDocument(docType)}
              saveFeedback={saveFeedback}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaArchive
              archives={archives}
              onOpenItem={handleOpenArchiveItem}
              onDuplicateItem={handleDuplicateArchiveItem}
              onDeleteItem={handleDeleteArchiveItem}
              onCreateNew={handleStartDocument}
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersView
              teachers={teachers}
              school={school}
              onSaveTeachers={setTeachers}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              school={school}
              onSaveStudents={setStudents}
            />
          )}

          {activeTab === 'absen_pegawai' && (
            <AbsenPegawaiPengawasView school={school} teachers={teachers} />
          )}

          {activeTab === 'absen_siswa_kelas' && (
            <AbsenSiswaKelasView
              school={school}
              students={students}
              teachers={teachers}
            />
          )}

          {activeTab === 'absen_siswa_mapel' && (
            <AbsenSiswaMapelView
              school={school}
              students={students}
              teachers={teachers}
            />
          )}

          {activeTab === 'settings' && (
            <SchoolSettingsView
              school={school}
              onSaveSchool={(next) => {
                setSchool(next);
                showToast('Profil sekolah & kop surat diperbarui.');
              }}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}
        </main>
      </div>
    </div>
  );
}
