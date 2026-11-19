import React, { useState } from 'react';
import {
  Check,
  Download,
  FilePlus2,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  DocumentFormData,
  DocumentType,
  PaperSize,
  SchoolProfile,
  Student,
  Teacher,
} from '../types/admin';
import {
  buildTeachingAssignmentsFromTeachers,
  DOC_TEMPLATES,
  SD_SCHOOL_DIRECTORY,
} from '../data/defaultData';
import {
  exportPaperToWord,
  formatTanggalIndonesia,
  generateNomorSurat,
  getDocClassificationCode,
  printPaperElement,
} from '../utils/formatters';
import { LetterPreview } from './LetterPreview';

interface LetterEditorProps {
  docType: DocumentType;
  onChangeDocType: (type: DocumentType) => void;
  formData: DocumentFormData;
  onChangeFormData: (next: DocumentFormData) => void;
  school: SchoolProfile;
  teachers: Teacher[];
  students: Student[];
  paperSize: PaperSize;
  onChangePaperSize: (size: PaperSize) => void;
  editingArchiveId: string | null;
  nextSequenceNumber: number;
  onSaveToArchive: () => void;
  onResetNewDraft: () => void;
  saveFeedback: string | null;
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 transition-colors';
const labelCls = 'block text-xs font-medium text-slate-700 mb-1';
const sectionTitleCls =
  'text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 mb-3';

export const LetterEditor: React.FC<LetterEditorProps> = ({
  docType,
  onChangeDocType,
  formData,
  onChangeFormData,
  school,
  teachers,
  students,
  paperSize,
  onChangePaperSize,
  editingArchiveId,
  nextSequenceNumber,
  onSaveToArchive,
  onResetNewDraft,
  saveFeedback,
}) => {
  const [previewZoom, setPreviewZoom] = useState<number>(0.76);
  const [mobilePane, setMobilePane] = useState<'form' | 'preview'>('form');

  const meta = DOC_TEMPLATES.find((d) => d.type === docType)!;

  const updateField = <K extends keyof DocumentFormData>(
    key: K,
    value: DocumentFormData[K]
  ) => {
    onChangeFormData({ ...formData, [key]: value });
  };

  const handleAutoNumber = () => {
    const code = getDocClassificationCode(docType);
    const nomor = generateNomorSurat(
      code,
      nextSequenceNumber,
      school.kodeSuratSekolah,
      formData.tanggalSurat
    );
    updateField('nomorSurat', nomor);
  };

  const handlePickTeacher = (teacherId: string) => {
    const t = teachers.find((x) => x.id === teacherId);
    if (!t) return;
    const nikOrNuptk =
      t.nik && t.nik !== '-'
        ? t.nuptk && t.nuptk !== '-'
          ? `${t.nik} / ${t.nuptk}`
          : t.nik
        : t.nuptk && t.nuptk !== '-'
          ? t.nuptk
          : t.nip;
    onChangeFormData({
      ...formData,
      guruIdDipilih: t.id,
      guruNama: t.nama,
      guruTempatTanggalLahir: `${t.tempatLahir}, ${formatTanggalIndonesia(t.tanggalLahir)}`,
      guruNikNuptk: nikOrNuptk,
      guruPendidikan: t.pendidikanTerakhir,
      guruAlamat: t.alamat,
      jabatanDiangkat: t.jabatan,
      statusPengangkatan: t.statusKepegawaian,
      tmtPengangkatan: t.tmtMulai,
      sumberDana: t.sumberGaji && t.sumberGaji !== '-' ? t.sumberGaji : formData.sumberDana,
    });
  };

  const handlePickStudent = (studentId: string) => {
    const s = students.find((x) => x.id === studentId);
    if (!s) return;
    onChangeFormData({
      ...formData,
      siswaIdDipilih: s.id,
      siswaNama: s.nama,
      siswaNis: s.nis,
      siswaNisn: s.nisn,
      siswaNik: s.nik,
      siswaTempatTanggalLahir: `${s.tempatLahir}, ${formatTanggalIndonesia(s.tanggalLahir)}`,
      siswaJenisKelamin: s.jenisKelamin,
      siswaAgama: s.agama,
      siswaKelas: s.kelas,
      ortuNama: s.namaAyah,
      ortuPekerjaan: s.pekerjaanOrtu,
      ortuAlamat: s.alamatOrtu,
    });
  };

  const handleSyncTeachersToPembagian = () => {
    updateField(
      'lampiranTugasRows',
      buildTeachingAssignmentsFromTeachers(teachers)
    );
  };

  const handlePrint = () => {
    printPaperElement('official-letter-paper', {
      title: `${meta.shortLabel} - ${formData.nomorSurat}`,
      paperSize,
      orientation: 'portrait',
    });
  };

  const handleExportWord = () => {
    const safeTitle = `${meta.shortLabel}_${formData.nomorSurat}`.replace(
      /[\\/]/g,
      '-'
    );
    exportPaperToWord('official-letter-paper', safeTitle);
  };

  const isStudentForm = [
    'surat_mutasi',
    'surat_siap_terima',
    'surat_pindah_sekolah',
    'surat_siswa_aktif',
    'surat_kelakuan_baik',
    'surat_keterangan_lulus',
    'surat_panggilan_ortu',
  ].includes(docType);

  return (
    <div className="flex flex-col h-full">
      {/* Workspace Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <label htmlFor="doc-type-switcher" className="sr-only">
              Pilih Jenis Surat atau SK
            </label>
            <select
              id="doc-type-switcher"
              value={docType}
              onChange={(e) => onChangeDocType(e.target.value as DocumentType)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-[#1E3A5F] focus:outline-none"
            >
              {DOC_TEMPLATES.map((tpl) => (
                <option key={tpl.type} value={tpl.type}>
                  {tpl.label}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
            <span>{meta.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Kode {meta.classificationCode}
            </span>
            {editingArchiveId && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-medium">
                  Mengedit Arsip Tersimpan
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile pane toggle */}
          <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setMobilePane('form')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                mobilePane === 'form'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Formulir
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                mobilePane === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Pratinjau Kertas
            </button>
          </div>

          {editingArchiveId && (
            <button
              type="button"
              onClick={onResetNewDraft}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Buat Baru
            </button>
          )}

          <button
            type="button"
            onClick={onSaveToArchive}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            {saveFeedback ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-600" />
            )}
            {saveFeedback || (editingArchiveId ? 'Perbarui Arsip' : 'Simpan ke Arsip')}
          </button>

          <button
            type="button"
            onClick={handleExportWord}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Unduh Word (.doc)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 print:block">
        {/* LEFT PANE: Structured Form Editor */}
        <div
          className={`no-print lg:col-span-5 xl:col-span-5 bg-white border-r border-slate-200 overflow-y-auto p-5 space-y-6 ${
            mobilePane === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Section 1: Nomor & Penandatanganan */}
          <section>
            <h3 className={sectionTitleCls}>Identitas Nomor &amp; Penetapan</h3>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Nomor Surat / SK</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.nomorSurat}
                    onChange={(e) => updateField('nomorSurat', e.target.value)}
                    className={`${inputCls} font-mono text-xs tabular-nums`}
                  />
                  <button
                    type="button"
                    onClick={handleAutoNumber}
                    title="Buat Nomor Surat Otomatis"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Otomatis
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tanggal Surat</label>
                  <input
                    type="date"
                    value={formData.tanggalSurat}
                    onChange={(e) => updateField('tanggalSurat', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tempat Ditetapkan</label>
                  <input
                    type="text"
                    value={formData.tempatSurat}
                    onChange={(e) => updateField('tempatSurat', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {(docType === 'surat_undangan' || docType === 'surat_panggilan_ortu') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Perihal Surat</label>
                    <input
                      type="text"
                      value={formData.perihal}
                      onChange={(e) => updateField('perihal', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Lampiran</label>
                    <input
                      type="text"
                      value={formData.lampiran}
                      onChange={(e) => updateField('lampiran', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Specific Document Content */}
          {docType === 'sk_pengangkatan_guru' && (
            <>
              <section>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Data Guru yang Diangkat
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <select
                      aria-label="Pilih dari data guru"
                      value={formData.guruIdDipilih || ''}
                      onChange={(e) => handlePickTeacher(e.target.value)}
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 text-slate-800"
                    >
                      <option value="">Isi dari Master Guru...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama} ({t.statusKepegawaian})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Pejabat Penerbit SK</label>
                      <select
                        value={formData.skPenerbit}
                        onChange={(e) => {
                          const val = e.target.value as 'Kepala Sekolah' | 'Ketua Yayasan';
                          onChangeFormData({
                            ...formData,
                            skPenerbit: val,
                            penandatanganJabatan: val,
                            penandatanganNama:
                              val === 'Ketua Yayasan'
                                ? school.namaKetuaYayasan
                                : school.namaKepalaSekolah,
                            penandatanganNip:
                              val === 'Ketua Yayasan' ? '-' : school.nipKepalaSekolah,
                          });
                        }}
                        className={inputCls}
                      >
                        <option value="Kepala Sekolah">Kepala Sekolah</option>
                        <option value="Ketua Yayasan">Ketua Yayasan (Swasta)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Status Pengangkatan</label>
                      <input
                        type="text"
                        value={formData.statusPengangkatan}
                        onChange={(e) =>
                          updateField('statusPengangkatan', e.target.value)
                        }
                        placeholder="GTT / GTY / Guru Honorer"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Judul / Tentang SK</label>
                    <input
                      type="text"
                      value={formData.skTentang}
                      onChange={(e) => updateField('skTentang', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Nama Lengkap &amp; Gelar Guru</label>
                    <input
                      type="text"
                      value={formData.guruNama}
                      onChange={(e) => updateField('guruNama', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Tempat, Tanggal Lahir</label>
                      <input
                        type="text"
                        value={formData.guruTempatTanggalLahir}
                        onChange={(e) =>
                          updateField('guruTempatTanggalLahir', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>NIK / NUPTK</label>
                      <input
                        type="text"
                        value={formData.guruNikNuptk}
                        onChange={(e) =>
                          updateField('guruNikNuptk', e.target.value)
                        }
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Pendidikan Terakhir</label>
                      <input
                        type="text"
                        value={formData.guruPendidikan}
                        onChange={(e) =>
                          updateField('guruPendidikan', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Jabatan / Tugas Mengajar</label>
                      <input
                        type="text"
                        value={formData.jabatanDiangkat}
                        onChange={(e) =>
                          updateField('jabatanDiangkat', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Alamat Tempat Tinggal</label>
                    <input
                      type="text"
                      value={formData.guruAlamat}
                      onChange={(e) => updateField('guruAlamat', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>TMT Pengangkatan</label>
                      <input
                        type="date"
                        value={formData.tmtPengangkatan}
                        onChange={(e) =>
                          updateField('tmtPengangkatan', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Berlaku Sampai</label>
                      <input
                        type="text"
                        value={formData.berlakuSampai}
                        onChange={(e) =>
                          updateField('berlakuSampai', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Besaran Honorarium</label>
                      <input
                        type="text"
                        value={formData.honorarium}
                        onChange={(e) =>
                          updateField('honorarium', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Sumber Dana</label>
                      <input
                        type="text"
                        value={formData.sumberDana}
                        onChange={(e) =>
                          updateField('sumberDana', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className={sectionTitleCls}>Konsiderans &amp; Tembusan</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Menimbang</label>
                    <textarea
                      rows={3}
                      value={formData.menimbangPoin}
                      onChange={(e) =>
                        updateField('menimbangPoin', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Mengingat (Dasar Hukum)</label>
                    <textarea
                      rows={4}
                      value={formData.mengingatPoin}
                      onChange={(e) =>
                        updateField('mengingatPoin', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tembusan</label>
                    <textarea
                      rows={3}
                      value={formData.tembusan}
                      onChange={(e) => updateField('tembusan', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {docType === 'sk_pembagian_tugas' && (
            <>
              <section>
                <h3 className={sectionTitleCls}>
                  Periode Semester &amp; Tahun Pelajaran
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Semester</label>
                    <select
                      value={formData.pembagianSemester}
                      onChange={(e) =>
                        updateField(
                          'pembagianSemester',
                          e.target.value as 'Ganjil' | 'Genap'
                        )
                      }
                      className={inputCls}
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tahun Pelajaran</label>
                    <input
                      type="text"
                      value={formData.pembagianTahunPelajaran}
                      onChange={(e) =>
                        updateField('pembagianTahunPelajaran', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Berlaku Sejak</label>
                    <input
                      type="date"
                      value={formData.tanggalBerlakuTugas}
                      onChange={(e) =>
                        updateField('tanggalBerlakuTugas', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Lampiran Daftar Pembagian Tugas ({formData.lampiranTugasRows.length} / {teachers.length} PTK)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncTeachersToPembagian}
                      className="text-xs font-medium text-[#1E3A5F] hover:underline"
                    >
                      Sinkronkan Semua PTK ({teachers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('lampiranTugasRows', [
                          ...formData.lampiranTugasRows,
                          {
                            id: `ta-${Date.now()}`,
                            namaGuru: 'Guru Baru, S.Pd.',
                            nip: '-',
                            pangkatGol: '-',
                            status: 'GTT',
                            jabatanGuru: 'Guru Kelas III',
                            kelasAmpu: 'III (Tiga)',
                            jamTatapMuka: 24,
                            tugasTambahan: 'Wali Kelas III',
                          },
                        ])
                      }
                      className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                    >
                      + Tambah Baris
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.lampiranTugasRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-600 tabular-nums">
                          Baris #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'lampiranTugasRows',
                              formData.lampiranTugasRows.filter(
                                (r) => r.id !== row.id
                              )
                            )
                          }
                          className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={row.namaGuru}
                          placeholder="Nama Guru"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = { ...row, namaGuru: e.target.value };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={row.nip}
                          placeholder="NIP"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = { ...row, nip: e.target.value };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={row.pangkatGol}
                          placeholder="Pangkat / Gol"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = { ...row, pangkatGol: e.target.value };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={row.status}
                          placeholder="Status (PNS/PPPK/GTT)"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = { ...row, status: e.target.value };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={inputCls}
                        />
                        <input
                          type="number"
                          min={0}
                          value={row.jamTatapMuka}
                          placeholder="JTM"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = {
                              ...row,
                              jamTatapMuka: Number(e.target.value) || 0,
                            };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={`${inputCls} font-mono tabular-nums`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={row.jabatanGuru}
                          placeholder="Jabatan (mis. Guru Kelas V)"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = { ...row, jabatanGuru: e.target.value };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={row.kelasAmpu}
                          placeholder="Kelas Ampu"
                          onChange={(e) => {
                            const next = [...formData.lampiranTugasRows];
                            next[idx] = { ...row, kelasAmpu: e.target.value };
                            updateField('lampiranTugasRows', next);
                          }}
                          className={inputCls}
                        />
                      </div>
                      <input
                        type="text"
                        value={row.tugasTambahan}
                        placeholder="Tugas Tambahan (Wali Kelas, Pembina, Kepala Perpus, dll)"
                        onChange={(e) => {
                          const next = [...formData.lampiranTugasRows];
                          next[idx] = { ...row, tugasTambahan: e.target.value };
                          updateField('lampiranTugasRows', next);
                        }}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className={sectionTitleCls}>Konsiderans &amp; Tembusan</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Menimbang</label>
                    <textarea
                      rows={3}
                      value={formData.menimbangPoin}
                      onChange={(e) =>
                        updateField('menimbangPoin', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Mengingat</label>
                    <textarea
                      rows={4}
                      value={formData.mengingatPoin}
                      onChange={(e) =>
                        updateField('mengingatPoin', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tembusan</label>
                    <textarea
                      rows={3}
                      value={formData.tembusan}
                      onChange={(e) => updateField('tembusan', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Student biodata block for all student-related letters */}
          {isStudentForm && (
            <section>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Identitas Peserta Didik
                </h3>
                {docType !== 'surat_siap_terima' && (
                  <select
                    aria-label="Pilih dari data siswa"
                    value={formData.siswaIdDipilih || ''}
                    onChange={(e) => handlePickStudent(e.target.value)}
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 text-slate-800"
                  >
                    <option value="">Isi dari Data Siswa...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} — Kelas {s.kelas}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    value={formData.siswaNama}
                    onChange={(e) => updateField('siswaNama', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>NIS</label>
                    <input
                      type="text"
                      value={formData.siswaNis}
                      onChange={(e) => updateField('siswaNis', e.target.value)}
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>NISN</label>
                    <input
                      type="text"
                      value={formData.siswaNisn}
                      onChange={(e) => updateField('siswaNisn', e.target.value)}
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Kelas</label>
                    <input
                      type="text"
                      value={formData.siswaKelas}
                      onChange={(e) =>
                        updateField('siswaKelas', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tempat, Tanggal Lahir</label>
                    <input
                      type="text"
                      value={formData.siswaTempatTanggalLahir}
                      onChange={(e) =>
                        updateField('siswaTempatTanggalLahir', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Jenis Kelamin</label>
                    <select
                      value={formData.siswaJenisKelamin}
                      onChange={(e) =>
                        updateField(
                          'siswaJenisKelamin',
                          e.target.value as 'Laki-laki' | 'Perempuan'
                        )
                      }
                      className={inputCls}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nama Orang Tua / Wali</label>
                    <input
                      type="text"
                      value={formData.ortuNama}
                      onChange={(e) => updateField('ortuNama', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Pekerjaan Orang Tua</label>
                    <input
                      type="text"
                      value={formData.ortuPekerjaan}
                      onChange={(e) =>
                        updateField('ortuPekerjaan', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Alamat Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formData.ortuAlamat}
                    onChange={(e) => updateField('ortuAlamat', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Mutasi & Pindah Sekolah specifics */}
          {(docType === 'surat_mutasi' || docType === 'surat_pindah_sekolah') && (
            <section>
              <h3 className={sectionTitleCls}>Rincian Mutasi / Kepindahan</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Sekolah Tujuan
                    </label>
                    <select
                      aria-label="Pilih sekolah tujuan dari daftar 30 sekolah"
                      value=""
                      onChange={(e) => {
                        const found = SD_SCHOOL_DIRECTORY.find(
                          (item) => item.npsn === e.target.value
                        );
                        if (!found) return;
                        onChangeFormData({
                          ...formData,
                          sekolahTujuan: `${found.namaSekolah} (NPSN ${found.npsn})`,
                          alamatSekolahTujuan: `Desa ${found.desa}, Kec. ${found.kecamatan}, Kab. ${found.kabupatenKota}`,
                        });
                      }}
                      className="text-xs border border-slate-300 rounded px-2 py-0.5 bg-slate-50 text-slate-800 max-w-[220px]"
                    >
                      <option value="">Pilih dari Daftar Sekolah...</option>
                      {SD_SCHOOL_DIRECTORY.map((item) => (
                        <option key={item.npsn} value={item.npsn}>
                          {item.namaSekolah} ({item.npsn})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={formData.sekolahTujuan}
                    onChange={(e) =>
                      updateField('sekolahTujuan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Alamat Sekolah Tujuan</label>
                  <input
                    type="text"
                    value={formData.alamatSekolahTujuan}
                    onChange={(e) =>
                      updateField('alamatSekolahTujuan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tanggal Efektif Pindah</label>
                    <input
                      type="date"
                      value={formData.tanggalEfektifPindah}
                      onChange={(e) =>
                        updateField('tanggalEfektifPindah', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Alasan Pindah</label>
                    <input
                      type="text"
                      value={formData.alasanPindah}
                      onChange={(e) =>
                        updateField('alasanPindah', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Catatan Kelakuan</label>
                  <input
                    type="text"
                    value={formData.catatanKelakuan}
                    onChange={(e) =>
                      updateField('catatanKelakuan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                {docType === 'surat_mutasi' && (
                  <div>
                    <label className={labelCls}>Status Dapodik</label>
                    <input
                      type="text"
                      value={formData.statusDapodik}
                      onChange={(e) =>
                        updateField('statusDapodik', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                )}
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sertakanKolomPengawas}
                      onChange={(e) =>
                        updateField('sertakanKolomPengawas', e.target.checked)
                      }
                      className="rounded border-slate-300 text-[#1E3A5F]"
                    />
                    Sertakan kolom pengesahan Pengawas Sekolah / Dinas
                  </label>
                  {formData.sertakanKolomPengawas && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        value={formData.namaPengawasDinas}
                        placeholder="Nama Pengawas"
                        onChange={(e) =>
                          updateField('namaPengawasDinas', e.target.value)
                        }
                        className={inputCls}
                      />
                      <input
                        type="text"
                        value={formData.nipPengawasDinas}
                        placeholder="NIP Pengawas"
                        onChange={(e) =>
                          updateField('nipPengawasDinas', e.target.value)
                        }
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Surat Siap Terima Siswa specifics */}
          {docType === 'surat_siap_terima' && (
            <section>
              <h3 className={sectionTitleCls}>
                Keterangan Sekolah Asal &amp; Kuota Kelas
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Sekolah Asal Calon Siswa
                    </label>
                    <select
                      aria-label="Pilih sekolah asal dari daftar 30 sekolah"
                      value=""
                      onChange={(e) => {
                        const found = SD_SCHOOL_DIRECTORY.find(
                          (item) => item.npsn === e.target.value
                        );
                        if (!found) return;
                        onChangeFormData({
                          ...formData,
                          sekolahAsal: `${found.namaSekolah} (NPSN ${found.npsn})`,
                          alamatSekolahAsal: `Desa ${found.desa}, Kec. ${found.kecamatan}, Kab. ${found.kabupatenKota}`,
                        });
                      }}
                      className="text-xs border border-slate-300 rounded px-2 py-0.5 bg-slate-50 text-slate-800 max-w-[220px]"
                    >
                      <option value="">Pilih dari Daftar Sekolah...</option>
                      {SD_SCHOOL_DIRECTORY.map((item) => (
                        <option key={item.npsn} value={item.npsn}>
                          {item.namaSekolah} ({item.npsn})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={formData.sekolahAsal}
                    onChange={(e) => updateField('sekolahAsal', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Alamat Sekolah Asal</label>
                  <input
                    type="text"
                    value={formData.alamatSekolahAsal}
                    onChange={(e) =>
                      updateField('alamatSekolahAsal', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Diterima di Kelas</label>
                    <input
                      type="text"
                      value={formData.kelasDiterima}
                      onChange={(e) =>
                        updateField('kelasDiterima', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Sisa Kuota Kursi Tersedia</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.sisaKuotaKelas}
                      onChange={(e) =>
                        updateField(
                          'sisaKuotaKelas',
                          Number(e.target.value) || 1
                        )
                      }
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Persyaratan Berkas Daftar Ulang</label>
                  <textarea
                    rows={4}
                    value={formData.syaratBerkas}
                    onChange={(e) => updateField('syaratBerkas', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Siswa Aktif & Kelakuan Baik specifics */}
          {(docType === 'surat_siswa_aktif' ||
            docType === 'surat_kelakuan_baik') && (
            <section>
              <h3 className={sectionTitleCls}>Keperluan &amp; Keterangan</h3>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Keperluan Surat</label>
                  <input
                    type="text"
                    value={formData.keperluanSurat}
                    onChange={(e) =>
                      updateField('keperluanSurat', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                {docType === 'surat_siswa_aktif' && (
                  <div>
                    <label className={labelCls}>
                      Nomor KIP / PIP (opsional, isi "-" jika tidak ada)
                    </label>
                    <input
                      type="text"
                      value={formData.nomorKipPip || ''}
                      onChange={(e) =>
                        updateField('nomorKipPip', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Uraian Keterangan</label>
                  <textarea
                    rows={3}
                    value={formData.keteranganTambahan}
                    onChange={(e) =>
                      updateField('keteranganTambahan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Surat Tugas specifics */}
          {docType === 'surat_tugas' && (
            <>
              <section>
                <h3 className={sectionTitleCls}>Dasar &amp; Kegiatan Tugas</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Dasar Penugasan / Undangan</label>
                    <textarea
                      rows={2}
                      value={formData.dasarPenugasan}
                      onChange={(e) =>
                        updateField('dasarPenugasan', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Kegiatan / Tujuan Tugas</label>
                    <input
                      type="text"
                      value={formData.namaKegiatanTugas}
                      onChange={(e) =>
                        updateField('namaKegiatanTugas', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Hari &amp; Tanggal</label>
                      <input
                        type="text"
                        value={formData.hariTanggalTugas}
                        onChange={(e) =>
                          updateField('hariTanggalTugas', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Waktu Pelaksanaan</label>
                      <input
                        type="text"
                        value={formData.waktuTugas}
                        onChange={(e) =>
                          updateField('waktuTugas', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Tempat Pelaksanaan</label>
                    <input
                      type="text"
                      value={formData.tempatTugas}
                      onChange={(e) =>
                        updateField('tempatTugas', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Kalimat Penutup Tugas</label>
                    <textarea
                      rows={2}
                      value={formData.keteranganTugas}
                      onChange={(e) =>
                        updateField('keteranganTugas', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Daftar Petugas ({formData.petugasRows.length})
                  </h3>
                  <select
                    aria-label="Tambah petugas dari data PTK"
                    value=""
                    onChange={(e) => {
                      const t = teachers.find((x) => x.id === e.target.value);
                      if (!t) return;
                      updateField('petugasRows', [
                        ...formData.petugasRows,
                        {
                          id: `pet-${Date.now()}`,
                          nama: t.nama,
                          nip: t.nip !== '-' ? t.nip : t.nuptk,
                          pangkatGol: t.pangkatGolongan,
                          jabatan: t.jabatan,
                        },
                      ]);
                    }}
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 text-slate-800"
                  >
                    <option value="">+ Tambah dari Data PTK...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  {formData.petugasRows.map((p, idx) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Petugas #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'petugasRows',
                              formData.petugasRows.filter((x) => x.id !== p.id)
                            )
                          }
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.nama}
                          placeholder="Nama"
                          onChange={(e) => {
                            const next = [...formData.petugasRows];
                            next[idx] = { ...p, nama: e.target.value };
                            updateField('petugasRows', next);
                          }}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={p.nip}
                          placeholder="NIP / NUPTK"
                          onChange={(e) => {
                            const next = [...formData.petugasRows];
                            next[idx] = { ...p, nip: e.target.value };
                            updateField('petugasRows', next);
                          }}
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.pangkatGol}
                          placeholder="Pangkat / Gol"
                          onChange={(e) => {
                            const next = [...formData.petugasRows];
                            next[idx] = { ...p, pangkatGol: e.target.value };
                            updateField('petugasRows', next);
                          }}
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={p.jabatan}
                          placeholder="Jabatan"
                          onChange={(e) => {
                            const next = [...formData.petugasRows];
                            next[idx] = { ...p, jabatan: e.target.value };
                            updateField('petugasRows', next);
                          }}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Surat Undangan specifics */}
          {docType === 'surat_undangan' && (
            <section>
              <h3 className={sectionTitleCls}>Detail Undangan</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className={labelCls}>Kepada Yth.</label>
                    <input
                      type="text"
                      value={formData.kepadaYth}
                      onChange={(e) => updateField('kepadaYth', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Sifat</label>
                    <select
                      value={formData.sifatUndangan}
                      onChange={(e) =>
                        updateField(
                          'sifatUndangan',
                          e.target.value as 'Penting' | 'Biasa' | 'Segera'
                        )
                      }
                      className={inputCls}
                    >
                      <option value="Penting">Penting</option>
                      <option value="Segera">Segera</option>
                      <option value="Biasa">Biasa</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Paragraf Pembuka</label>
                  <textarea
                    rows={2}
                    value={formData.isiPembukaUndangan}
                    onChange={(e) =>
                      updateField('isiPembukaUndangan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hari / Tanggal</label>
                    <input
                      type="text"
                      value={formData.hariTanggalUndangan}
                      onChange={(e) =>
                        updateField('hariTanggalUndangan', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Waktu</label>
                    <input
                      type="text"
                      value={formData.waktuUndangan}
                      onChange={(e) =>
                        updateField('waktuUndangan', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tempat Acara</label>
                  <input
                    type="text"
                    value={formData.tempatUndangan}
                    onChange={(e) =>
                      updateField('tempatUndangan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Susunan Acara</label>
                  <textarea
                    rows={3}
                    value={formData.acaraUndangan}
                    onChange={(e) =>
                      updateField('acaraUndangan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          )}

          {/* SKL SD specifics */}
          {docType === 'surat_keterangan_lulus' && (
            <section>
              <h3 className={sectionTitleCls}>Data Kelulusan &amp; Daftar Nilai</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Tahun Lulus</label>
                    <input
                      type="text"
                      value={formData.sklTahunLulus}
                      onChange={(e) =>
                        updateField('sklTahunLulus', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select
                      value={formData.sklStatusKelulusan}
                      onChange={(e) =>
                        updateField(
                          'sklStatusKelulusan',
                          e.target.value as 'LULUS' | 'TIDAK LULUS'
                        )
                      }
                      className={inputCls}
                    >
                      <option value="LULUS">LULUS</option>
                      <option value="TIDAK LULUS">TIDAK LULUS</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>No. Ijazah Sementara</label>
                    <input
                      type="text"
                      value={formData.sklNomorIjazahSementara}
                      onChange={(e) =>
                        updateField('sklNomorIjazahSementara', e.target.value)
                      }
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {formData.sklNilaiRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-2 px-3 py-1.5"
                    >
                      <span className="text-xs text-slate-400 w-5 tabular-nums">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={row.mataPelajaran}
                        onChange={(e) => {
                          const next = [...formData.sklNilaiRows];
                          next[idx] = { ...row, mataPelajaran: e.target.value };
                          updateField('sklNilaiRows', next);
                        }}
                        className="flex-1 text-xs text-slate-800 bg-transparent focus:outline-none"
                      />
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={100}
                        value={row.nilai}
                        onChange={(e) => {
                          const next = [...formData.sklNilaiRows];
                          next[idx] = {
                            ...row,
                            nilai: Number(e.target.value) || 0,
                          };
                          updateField('sklNilaiRows', next);
                        }}
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-right font-mono tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Panggilan Orang Tua specifics */}
          {docType === 'surat_panggilan_ortu' && (
            <section>
              <h3 className={sectionTitleCls}>Detail Panggilan &amp; Jadwal</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Panggilan Ke-</label>
                    <input
                      type="text"
                      value={formData.panggilanKe}
                      onChange={(e) =>
                        updateField('panggilanKe', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Jumlah Alpha (Hari)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.jumlahKetidakhadiranAlpha}
                      onChange={(e) =>
                        updateField(
                          'jumlahKetidakhadiranAlpha',
                          Number(e.target.value) || 0
                        )
                      }
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Catatan Pembinaan</label>
                  <textarea
                    rows={2}
                    value={formData.catatanPembinaan}
                    onChange={(e) =>
                      updateField('catatanPembinaan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hari / Tanggal Hadir</label>
                    <input
                      type="text"
                      value={formData.hariTanggalUndangan}
                      onChange={(e) =>
                        updateField('hariTanggalUndangan', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Waktu Hadir</label>
                    <input
                      type="text"
                      value={formData.waktuUndangan}
                      onChange={(e) =>
                        updateField('waktuUndangan', e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Menghadap Kepada</label>
                  <input
                    type="text"
                    value={formData.menghadapKepada}
                    onChange={(e) =>
                      updateField('menghadapKepada', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Penandatangan */}
          <section>
            <h3 className={sectionTitleCls}>Pejabat Penandatangan</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={formData.penandatanganJabatan}
                    onChange={(e) =>
                      updateField('penandatanganJabatan', e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>NIP Penandatangan</label>
                  <input
                    type="text"
                    value={formData.penandatanganNip}
                    onChange={(e) =>
                      updateField('penandatanganNip', e.target.value)
                    }
                    className={`${inputCls} font-mono text-xs`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Nama Lengkap Penandatangan</label>
                <input
                  type="text"
                  value={formData.penandatanganNama}
                  onChange={(e) =>
                    updateField('penandatanganNama', e.target.value)
                  }
                  className={inputCls}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tampilkanStempel}
                  onChange={(e) =>
                    updateField('tampilkanStempel', e.target.checked)
                  }
                  className="rounded border-slate-300 text-[#1E3A5F]"
                />
                Tampilkan panduan posisi stempel pada pratinjau layar
              </label>
            </div>
          </section>
        </div>

        {/* RIGHT PANE: Live Paper Preview */}
        <div
          className={`lg:col-span-7 xl:col-span-7 bg-slate-100/90 overflow-auto flex flex-col ${
            mobilePane === 'form' ? 'hidden lg:flex' : 'flex'
          } print-only-container print:block print:overflow-visible`}
        >
          {/* Paper Control Strip */}
          <div className="no-print sticky top-0 z-10 bg-slate-100/95 backdrop-blur border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => onChangePaperSize('F4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  paperSize === 'F4'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kertas F4 (215 × 330 mm)
              </button>
              <button
                type="button"
                onClick={() => onChangePaperSize('A4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  paperSize === 'A4'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kertas A4 (210 × 297 mm)
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Skala:</span>
              {[0.65, 0.76, 0.9, 1].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setPreviewZoom(z)}
                  className={`px-2 py-1 rounded text-xs font-mono tabular-nums ${
                    previewZoom === z
                      ? 'bg-[#1E3A5F] text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Paper Canvas */}
          <div className="p-6 flex-1 overflow-auto flex justify-center items-start print:p-0">
            <div
              style={{
                transform: `scale(${previewZoom})`,
                transformOrigin: 'top center',
              }}
              className="print:!transform-none transition-transform duration-150"
            >
              <LetterPreview
                docType={docType}
                school={school}
                data={formData}
                paperSize={paperSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
