export type DocumentType =
  | 'sk_pengangkatan_guru'
  | 'sk_pembagian_tugas'
  | 'surat_mutasi'
  | 'surat_siap_terima'
  | 'surat_pindah_sekolah'
  | 'surat_siswa_aktif'
  | 'surat_kelakuan_baik'
  | 'surat_tugas'
  | 'surat_undangan'
  | 'surat_keterangan_lulus'
  | 'surat_panggilan_ortu';

export type DocumentCategory =
  | 'SK Kepegawaian'
  | 'Mutasi & Kesiswaan'
  | 'Operasional & Dinas';

export type PaperSize = 'F4' | 'A4';

export interface SchoolProfile {
  pemerintahDaerah: string;
  dinasPendidikan: string;
  namaSekolah: string;
  npsn: string;
  nss: string;
  statusSekolah: 'Negeri' | 'Swasta';
  akreditasi: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  kodeSuratSekolah: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  pangkatKepalaSekolah: string;
  namaYayasan: string;
  namaKetuaYayasan: string;
  logoMode: 'tut_wuri' | 'garuda' | 'custom';
  customLogoDataUrl?: string;
  logoPendidikanDataUrl?: string;
  logoDaerahDataUrl?: string;
}

export interface SchoolDirectoryEntry {
  namaSekolah: string;
  npsn: string;
  kodeSurat: string;
  desa: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  pemerintahDaerah: string;
  dinasPendidikan: string;
}

export interface Teacher {
  id: string;
  nama: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  nip: string;
  nuptk: string;
  nik?: string;
  nrg?: string;
  npwp?: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  agama?: string;
  statusPerkawinan?: string;
  namaIbuKandung?: string;
  pendidikanTerakhir: string;
  jenjangPendidikan?: string;
  jurusanProdi?: string;
  sertifikasiPendidik?: string;
  pangkatGolongan: string;
  statusKepegawaian: 'PNS' | 'PPPK' | 'GTT / Honorer' | 'GTY' | 'Tendik';
  jenisPtk?: string;
  jabatan: string;
  mengajarMapel?: string;
  tugasTambahan?: string;
  jamTatapMuka?: number;
  jamTugasTambahan?: number;
  skPengangkatan?: string;
  tmtMulai: string;
  lembagaPengangkat?: string;
  sumberGaji?: string;
  nomorSuratTugas?: string;
  tanggalSuratTugas?: string;
  noHp?: string;
  email?: string;
  alamat: string;
  desaKelurahan?: string;
  kecamatan?: string;
  kodePos?: string;
}

export interface Student {
  id: string;
  nama: string;
  nis: string;
  nisn: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  agama: string;
  kelas: string;
  namaAyah: string;
  namaIbu: string;
  pekerjaanOrtu: string;
  alamatOrtu: string;
  // Extended Dapodik Peserta Didik fields
  noKk?: string;
  noAktaLahir?: string;
  anakKe?: string;
  jumlahSaudara?: string;
  rombel?: string;
  sekolahAsal?: string;
  jenisTinggal?: string;
  alatTransportasi?: string;
  noHp?: string;
  email?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  desaKelurahan?: string;
  kecamatan?: string;
  kodePos?: string;
  penerimaKps?: string;
  noKps?: string;
  penerimaKip?: string;
  noKip?: string;
  nikAyah?: string;
  tahunLahirAyah?: string;
  pendidikanAyah?: string;
  pekerjaanAyah?: string;
  penghasilanAyah?: string;
  nikIbu?: string;
  tahunLahirIbu?: string;
  pendidikanIbu?: string;
  pekerjaanIbu?: string;
  penghasilanIbu?: string;
  namaWali?: string;
  nikWali?: string;
  pendidikanWali?: string;
  pekerjaanWali?: string;
  penghasilanWali?: string;
}

export interface TeachingAssignmentRow {
  id: string;
  namaGuru: string;
  nip: string;
  pangkatGol: string;
  status: string;
  jabatanGuru: string;
  kelasAmpu: string;
  jamTatapMuka: number;
  tugasTambahan: string;
}

export interface TaskOfficerRow {
  id: string;
  nama: string;
  nip: string;
  pangkatGol: string;
  jabatan: string;
}

export interface SklSubjectRow {
  id: string;
  mataPelajaran: string;
  nilai: number;
}

export interface DocumentFormData {
  // Common header & metadata
  nomorSurat: string;
  lampiran: string;
  perihal: string;
  tanggalSurat: string;
  tempatSurat: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  penandatanganNip: string;
  tampilkanStempel: boolean;

  // SK Pengangkatan Guru
  skTentang: string;
  skPenerbit: 'Kepala Sekolah' | 'Ketua Yayasan';
  guruIdDipilih?: string;
  guruNama: string;
  guruTempatTanggalLahir: string;
  guruNikNuptk: string;
  guruPendidikan: string;
  guruAlamat: string;
  jabatanDiangkat: string;
  unitKerja: string;
  statusPengangkatan: string;
  tmtPengangkatan: string;
  berlakuSampai: string;
  honorarium: string;
  sumberDana: string;
  menimbangPoin: string;
  mengingatPoin: string;
  tembusan: string;

  // SK Pembagian Tugas Mengajar
  pembagianSemester: 'Ganjil' | 'Genap';
  pembagianTahunPelajaran: string;
  tanggalBerlakuTugas: string;
  lampiranTugasRows: TeachingAssignmentRow[];

  // Student identity (Mutasi, Siap Terima, Pindah, Aktif, Kelakuan Baik, SKL, Panggilan)
  siswaIdDipilih?: string;
  siswaNama: string;
  siswaNis: string;
  siswaNisn: string;
  siswaNik: string;
  siswaTempatTanggalLahir: string;
  siswaJenisKelamin: 'Laki-laki' | 'Perempuan';
  siswaAgama: string;
  siswaKelas: string;
  ortuNama: string;
  ortuPekerjaan: string;
  ortuAlamat: string;

  // Mutasi & Pindah Sekolah
  sekolahTujuan: string;
  alamatSekolahTujuan: string;
  alasanPindah: string;
  tanggalEfektifPindah: string;
  catatanKelakuan: string;
  statusDapodik: string;
  sertakanKolomPengawas: boolean;
  namaPengawasDinas: string;
  nipPengawasDinas: string;

  // Siap Terima Siswa
  sekolahAsal: string;
  alamatSekolahAsal: string;
  kelasDiterima: string;
  sisaKuotaKelas: number;
  syaratBerkas: string;

  // Siswa Aktif & Kelakuan Baik
  keperluanSurat: string;
  nomorKipPip?: string;
  keteranganTambahan: string;

  // Surat Tugas
  dasarPenugasan: string;
  petugasRows: TaskOfficerRow[];
  namaKegiatanTugas: string;
  hariTanggalTugas: string;
  waktuTugas: string;
  tempatTugas: string;
  keteranganTugas: string;

  // Surat Undangan
  kepadaYth: string;
  diTempatUndangan: string;
  sifatUndangan: 'Penting' | 'Biasa' | 'Segera';
  isiPembukaUndangan: string;
  hariTanggalUndangan: string;
  waktuUndangan: string;
  tempatUndangan: string;
  acaraUndangan: string;

  // SKL SD
  sklTahunLulus: string;
  sklNomorIjazahSementara: string;
  sklStatusKelulusan: 'LULUS' | 'TIDAK LULUS';
  sklNilaiRows: SklSubjectRow[];

  // Panggilan Orang Tua
  panggilanKe: string;
  jumlahKetidakhadiranAlpha: number;
  catatanPembinaan: string;
  menghadapKepada: string;
}

export interface ArchivedDocument {
  id: string;
  docType: DocumentType;
  category: DocumentCategory;
  nomorSurat: string;
  judul: string;
  subjekUtama: string;
  tanggalSurat: string;
  createdAt: string;
  updatedAt: string;
  paperSize: PaperSize;
  data: DocumentFormData;
}

export interface DocTemplateMeta {
  type: DocumentType;
  label: string;
  shortLabel: string;
  category: DocumentCategory;
  classificationCode: string;
  description: string;
  defaultPerihal: string;
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'DL' | '';

export interface SupervisorVisitRow {
  id: string;
  tanggal: string;
  namaPengawas: string;
  nip: string;
  pangkatGolongan: string;
  wilayahBinaan: string;
  jamDatang: string;
  jamPulang: string;
  materiPembinaan: string;
  tindakLanjut: string;
}

