import {
  ArchivedDocument,
  DocTemplateMeta,
  DocumentFormData,
  DocumentType,
  SchoolDirectoryEntry,
  SchoolProfile,
  SklSubjectRow,
  Student,
  Teacher,
  TeachingAssignmentRow,
} from '../types/admin';
import { generateNomorSurat, getDocClassificationCode, todayIsoDate } from '../utils/formatters';

export const DOC_TEMPLATES: DocTemplateMeta[] = [
  {
    type: 'sk_pengangkatan_guru',
    label: 'SK Pengangkatan Guru',
    shortLabel: 'SK Pengangkatan',
    category: 'SK Kepegawaian',
    classificationCode: '421.2/SK',
    description: 'Keputusan pengangkatan Guru Honorer / GTT / GTY atau Guru Kelas & Mapel SD.',
    defaultPerihal: 'Pengangkatan Guru Tidak Tetap / Guru Kelas',
  },
  {
    type: 'sk_pembagian_tugas',
    label: 'SK Pembagian Tugas Mengajar',
    shortLabel: 'SK Pembagian Tugas',
    category: 'SK Kepegawaian',
    classificationCode: '421.2/SK-PTM',
    description: 'SK Pembagian Tugas Guru dalam KBM, Wali Kelas, Ekstrakurikuler, dan Lampiran JTM.',
    defaultPerihal: 'Pembagian Tugas Guru dalam Kegiatan Belajar Mengajar',
  },
  {
    type: 'surat_mutasi',
    label: 'Surat Keterangan Mutasi Siswa',
    shortLabel: 'Surat Mutasi',
    category: 'Mutasi & Kesiswaan',
    classificationCode: '421.2',
    description: 'Surat resmi keterangan mutasi keluar siswa beserta status pelepasan Dapodik.',
    defaultPerihal: 'Surat Keterangan Mutasi Siswa',
  },
  {
    type: 'surat_siap_terima',
    label: 'Surat Siap Terima Siswa',
    shortLabel: 'Siap Terima Siswa',
    category: 'Mutasi & Kesiswaan',
    classificationCode: '421.2',
    description: 'Surat pernyataan sekolah bersedia menerima siswa pindahan sesuai kuota rombel.',
    defaultPerihal: 'Surat Keterangan Bersedia Menerima Siswa Pindahan',
  },
  {
    type: 'surat_pindah_sekolah',
    label: 'Surat Keterangan Pindah Sekolah',
    shortLabel: 'Surat Pindah Sekolah',
    category: 'Mutasi & Kesiswaan',
    classificationCode: '421.2',
    description: 'Surat pengantar pindah sekolah lengkap dengan kolom mengetahui Pengawas/Dinas.',
    defaultPerihal: 'Surat Keterangan Pindah Sekolah',
  },
  {
    type: 'surat_siswa_aktif',
    label: 'Surat Keterangan Siswa Aktif',
    shortLabel: 'Siswa Aktif',
    category: 'Mutasi & Kesiswaan',
    classificationCode: '421.2',
    description: 'Keterangan aktif sekolah untuk pencairan PIP/KIP, BPJS, tunjangan, atau lomba.',
    defaultPerihal: 'Surat Keterangan Aktif Bersekolah',
  },
  {
    type: 'surat_kelakuan_baik',
    label: 'Surat Keterangan Kelakuan Baik',
    shortLabel: 'Kelakuan Baik',
    category: 'Mutasi & Kesiswaan',
    classificationCode: '421.2',
    description: 'Surat keterangan berkelakuan baik untuk syarat PPDB SMP atau administrasi lain.',
    defaultPerihal: 'Surat Keterangan Berkelakuan Baik',
  },
  {
    type: 'surat_tugas',
    label: 'Surat Tugas Guru & Tendik',
    shortLabel: 'Surat Tugas',
    category: 'Operasional & Dinas',
    classificationCode: '094',
    description: 'Penugasan KKG, diklat, pendampingan lomba siswa, pengawas ujian, atau dinas luar.',
    defaultPerihal: 'Surat Perintah Tugas Dinas',
  },
  {
    type: 'surat_undangan',
    label: 'Surat Undangan Rapat / Wali Murid',
    shortLabel: 'Surat Undangan',
    category: 'Operasional & Dinas',
    classificationCode: '005',
    description: 'Undangan rapat wali murid, komite sekolah, pembagian rapor, atau sosialisasi ANBK.',
    defaultPerihal: 'Undangan Rapat Wali Murid',
  },
  {
    type: 'surat_keterangan_lulus',
    label: 'Surat Keterangan Lulus (SKL) SD',
    shortLabel: 'SKL Kelas VI',
    category: 'Mutasi & Kesiswaan',
    classificationCode: '421.2',
    description: 'Surat Keterangan Lulus sementara kelas VI beserta daftar nilai mata pelajaran SD.',
    defaultPerihal: 'Surat Keterangan Lulus Sekolah Dasar',
  },
  {
    type: 'surat_panggilan_ortu',
    label: 'Surat Panggilan / Pembinaan Orang Tua',
    shortLabel: 'Panggilan Ortu',
    category: 'Operasional & Dinas',
    classificationCode: '421.2',
    description: 'Pemberitahuan dan undangan konsultasi orang tua terkait kehadiran atau pembinaan siswa.',
    defaultPerihal: 'Pemberitahuan dan Undangan Konsultasi Orang Tua/Wali',
  },
];

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  pemerintahDaerah: 'PEMERINTAH KABUPATEN SLEMAN',
  dinasPendidikan: 'DINAS PENDIDIKAN',
  namaSekolah: 'SD NEGERI HARAPAN BANGSA 01',
  npsn: '20401234',
  nss: '101040201001',
  statusSekolah: 'Negeri',
  akreditasi: 'A (Unggul)',
  alamat: 'Jl. Pendidikan No. 45, Condongcatur',
  kelurahan: 'Condongcatur',
  kecamatan: 'Depok',
  kabupatenKota: 'Sleman',
  provinsi: 'D.I. Yogyakarta',
  kodePos: '55283',
  telepon: '(0274) 884512',
  email: 'sdnharapanbangsa01@dikpora.go.id',
  website: 'www.sdnharapanbangsa01.sch.id',
  kodeSuratSekolah: 'SDN-HB01',
  tahunPelajaran: '2026/2027',
  semester: 'Ganjil',
  namaKepalaSekolah: 'Hj. Sri Wahyuni, S.Pd., M.Pd.',
  nipKepalaSekolah: '19720514 199803 2 006',
  pangkatKepalaSekolah: 'Pembina Tk. I, IV/b',
  namaYayasan: 'Yayasan Pendidikan Harapan Bangsa',
  namaKetuaYayasan: 'Drs. H. Ahmad Fauzan',
  logoMode: 'tut_wuri',
};

const MUBA_BASE = {
  kecamatan: 'Lalan',
  kabupatenKota: 'Musi Banyuasin',
  provinsi: 'Sumatera Selatan',
  pemerintahDaerah: 'PEMERINTAH KABUPATEN MUSI BANYUASIN',
  dinasPendidikan: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
};

export const SD_SCHOOL_DIRECTORY: SchoolDirectoryEntry[] = [
  { namaSekolah: 'SD N MULYA JAYA', npsn: '10605347', kodeSurat: 'SDN-5347', desa: 'Mulya Jaya', ...MUBA_BASE },
  { namaSekolah: 'SDN 1 GALIH SARI', npsn: '10605090', kodeSurat: 'SDN-5090', desa: 'Galih Sari', ...MUBA_BASE },
  { namaSekolah: 'SDN 1 KARANG MAKMUR', npsn: '10605094', kodeSurat: 'SDN-5094', desa: 'Karang Makmur', ...MUBA_BASE },
  { namaSekolah: 'SDN 1 PERUMPUNG RAYA', npsn: '10605117', kodeSurat: 'SDN-5117', desa: 'Perumpung Raya', ...MUBA_BASE },
  { namaSekolah: 'SDN 2 GALIH SARI', npsn: '10605163', kodeSurat: 'SDN-5163', desa: 'Galih Sari', ...MUBA_BASE },
  { namaSekolah: 'SDN 2 KARANG MAKMUR', npsn: '10605167', kodeSurat: 'SDN-5167', desa: 'Karang Makmur', ...MUBA_BASE },
  { namaSekolah: 'SDN 2 PERUMPUNG RAYA', npsn: '10605187', kodeSurat: 'SDN-5187', desa: 'Perumpung Raya', ...MUBA_BASE },
  { namaSekolah: 'SDN AGUNG JAYA', npsn: '10605266', kodeSurat: 'SDN-5266', desa: 'Agung Jaya', ...MUBA_BASE },
  { namaSekolah: 'SDN BANDAR AGUNG', npsn: '10605271', kodeSurat: 'SDN-5271', desa: 'Bandar Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN BUMI AGUNG', npsn: '10605289', kodeSurat: 'SDN-5289', desa: 'Bumi Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN JAYA AGUNG', npsn: '10605296', kodeSurat: 'SDN-5296', desa: 'Jaya Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN KARANG AGUNG', npsn: '10605305', kodeSurat: 'SDN-5305', desa: 'Karang Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN KARANG MUKTI', npsn: '10605307', kodeSurat: 'SDN-5307', desa: 'Karang Mukti', ...MUBA_BASE },
  { namaSekolah: 'SDN KARANG REJO', npsn: '10605308', kodeSurat: 'SDN-5308', desa: 'Karang Rejo', ...MUBA_BASE },
  { namaSekolah: 'SDN KARANG SARI', npsn: '10605311', kodeSurat: 'SDN-5311', desa: 'Karang Sari', ...MUBA_BASE },
  { namaSekolah: 'SDN KARANG TIRTA', npsn: '10605312', kodeSurat: 'SDN-5312', desa: 'Karang Tirta', ...MUBA_BASE },
  { namaSekolah: 'SDN KARYA MUKTI', npsn: '10605314', kodeSurat: 'SDN-5314', desa: 'Karya Mukti', ...MUBA_BASE },
  { namaSekolah: 'SDN MADYA MULYA', npsn: '10605326', kodeSurat: 'SDN-5326', desa: 'Madya Mulya', ...MUBA_BASE },
  { namaSekolah: 'SDN MANDALA SARI', npsn: '10605328', kodeSurat: 'SDN-5328', desa: 'Mandala Sari', ...MUBA_BASE },
  { namaSekolah: 'SDN MEKAR JAYA', npsn: '10648833', kodeSurat: 'SDN-8833', desa: 'Mekar Jaya', ...MUBA_BASE },
  { namaSekolah: 'SDN MEKAR SARI', npsn: '10605335', kodeSurat: 'SDN-5335', desa: 'Mekar Sari', ...MUBA_BASE },
  { namaSekolah: 'SDN MULYA AGUNG', npsn: '10605346', kodeSurat: 'SDN-5346', desa: 'Mulya Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN PURWA AGUNG', npsn: '10605365', kodeSurat: 'SDN-5365', desa: 'Purwa Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN RINGIN AGUNG', npsn: '10605370', kodeSurat: 'SDN-5370', desa: 'Ringin Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN SARI AGUNG', npsn: '10605374', kodeSurat: 'SDN-5374', desa: 'Sari Agung', ...MUBA_BASE },
  { namaSekolah: 'SDN SRI GADING', npsn: '10605386', kodeSurat: 'SDN-5386', desa: 'Sri Gading', ...MUBA_BASE },
  { namaSekolah: 'SDN SRI KARANG REJO', npsn: '10605388', kodeSurat: 'SDN-5388', desa: 'Sri Karang Rejo', ...MUBA_BASE },
  { namaSekolah: 'SDN SUKA MAKMUR', npsn: '10605398', kodeSurat: 'SDN-5398', desa: 'Suka Makmur', ...MUBA_BASE },
  { namaSekolah: 'SDN SUKAJADI', npsn: '10605394', kodeSurat: 'SDN-5394', desa: 'Sukajadi', ...MUBA_BASE },
  { namaSekolah: 'SDN TRI MULYA AGUNG', npsn: '10605438', kodeSurat: 'SDN-5438', desa: 'Tri Mulya Agung', ...MUBA_BASE },
];

export function applySchoolDirectoryEntry(
  current: SchoolProfile,
  entry: SchoolDirectoryEntry
): SchoolProfile {
  const fourDigits = entry.npsn.trim().slice(-4);
  return {
    ...current,
    pemerintahDaerah: entry.pemerintahDaerah,
    dinasPendidikan: entry.dinasPendidikan,
    namaSekolah: entry.namaSekolah,
    npsn: entry.npsn,
    statusSekolah: 'Negeri',
    kodeSuratSekolah: fourDigits ? `SDN-${fourDigits}` : entry.kodeSurat,
    kelurahan: entry.desa,
    alamat: `Desa ${entry.desa}, Kec. ${entry.kecamatan}`,
    kecamatan: entry.kecamatan,
    kabupatenKota: entry.kabupatenKota,
    provinsi: entry.provinsi,
  };
}

export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'ptk-1',
    nama: 'Hj. Sri Wahyuni, S.Pd., M.Pd.',
    nip: '19720514 199803 2 006',
    nuptk: '4846750652300012',
    nik: '3404075405720001',
    nrg: '091248461002',
    tempatLahir: 'Sleman',
    tanggalLahir: '1972-05-14',
    jenisKelamin: 'P',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'S2 Manajemen Pendidikan',
    jenjangPendidikan: 'S2',
    jurusanProdi: 'Manajemen Pendidikan',
    sertifikasiPendidik: 'Guru Kelas SD (2009)',
    pangkatGolongan: 'Pembina Tk. I / IV-b',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Kepala Sekolah',
    jabatan: 'Kepala Sekolah',
    mengajarMapel: 'Manajerial & Supervisi',
    tugasTambahan: 'Kepala Satuan Pendidikan & Penanggung Jawab BOSP',
    jamTatapMuka: 24,
    jamTugasTambahan: 18,
    skPengangkatan: '821.2/045/BKD/2022',
    tmtMulai: '2022-01-03',
    lembagaPengangkat: 'Bupati Sleman',
    sumberGaji: 'APBD',
    noHp: '081227104512',
    email: 'sri.wahyuni@admin.sd.belajar.id',
    alamat: 'Perum Pondok Permai Blok B-4, Condongcatur, Depok, Sleman',
    desaKelurahan: 'Condongcatur',
    kecamatan: 'Depok',
    kodePos: '55283',
  },
  {
    id: 'ptk-2',
    nama: 'Budi Santoso, S.Pd.SD',
    nip: '19810322 200902 1 003',
    nuptk: '1654759660200014',
    nik: '3402082203810002',
    nrg: '120271654008',
    tempatLahir: 'Bantul',
    tanggalLahir: '1981-03-22',
    jenisKelamin: 'L',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'S1 PGSD',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Guru Sekolah Dasar',
    sertifikasiPendidik: 'Guru Kelas SD (2013)',
    pangkatGolongan: 'Penata Tk. I / III-d',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Kelas',
    jabatan: 'Guru Kelas VI',
    mengajarMapel: 'Guru Kelas VI (Tematik/Kurikulum Merdeka)',
    tugasTambahan: 'Wali Kelas VI & Koordinator P5 / Kokurikuler',
    jamTatapMuka: 28,
    jamTugasTambahan: 2,
    skPengangkatan: '813.3/112/BKD/2009',
    tmtMulai: '2009-02-01',
    lembagaPengangkat: 'Pemerintah Kabupaten Sleman',
    sumberGaji: 'APBD',
    noHp: '081328901122',
    email: 'budi.santoso81@guru.sd.belajar.id',
    alamat: 'Jl. Kaliurang Km 7,5, Ngaglik, Sleman',
    desaKelurahan: 'Sariharjo',
    kecamatan: 'Ngaglik',
    kodePos: '55581',
  },
  {
    id: 'ptk-3',
    nama: 'Siti Aminah, S.Pd.',
    nip: '19860811 201406 2 002',
    nuptk: '5143764665300023',
    nik: '3471045108860001',
    nrg: '160275143011',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1986-08-11',
    jenisKelamin: 'P',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'S1 PGSD',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Guru Sekolah Dasar',
    sertifikasiPendidik: 'Guru Kelas SD (2017)',
    pangkatGolongan: 'Penata / III-c',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Kelas',
    jabatan: 'Guru Kelas V',
    mengajarMapel: 'Guru Kelas V',
    tugasTambahan: 'Wali Kelas V & Kepala Perpustakaan',
    jamTatapMuka: 28,
    jamTugasTambahan: 12,
    skPengangkatan: '813.3/088/BKD/2014',
    tmtMulai: '2014-06-01',
    lembagaPengangkat: 'Pemerintah Kabupaten Sleman',
    sumberGaji: 'APBD',
    noHp: '085643120987',
    email: 'siti.aminah86@guru.sd.belajar.id',
    alamat: 'Jl. Magelang Km 6, Mlati, Sleman',
    desaKelurahan: 'Sinduadi',
    kecamatan: 'Mlati',
    kodePos: '55284',
  },
  {
    id: 'ptk-4',
    nama: 'Rizky Pratama, S.Pd.',
    nip: '19921104 202221 1 008',
    nuptk: '7436770671130042',
    nik: '3310050411920003',
    nrg: '-',
    tempatLahir: 'Klaten',
    tanggalLahir: '1992-11-04',
    jenisKelamin: 'L',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'S1 PJOK',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Jasmani Kesehatan dan Rekreasi',
    sertifikasiPendidik: 'PPG Daljab PJOK (2024)',
    pangkatGolongan: 'Ahli Pertama / IX',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Mapel',
    jabatan: 'Guru PJOK (Kelas I–VI)',
    mengajarMapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
    tugasTambahan: 'Pembina Ekstrakurikuler Olahraga & O2SN',
    jamTatapMuka: 24,
    jamTugasTambahan: 2,
    skPengangkatan: '810/029/PPPK/2022',
    tmtMulai: '2022-03-01',
    lembagaPengangkat: 'Bupati Sleman',
    sumberGaji: 'APBD',
    noHp: '082136789012',
    email: 'rizky.pratama92@guru.sd.belajar.id',
    alamat: 'Tirtomartani, Kalasan, Sleman',
    desaKelurahan: 'Tirtomartani',
    kecamatan: 'Kalasan',
    kodePos: '55571',
  },
  {
    id: 'ptk-5',
    nama: 'Nadia Kusuma Wardani, S.Pd.',
    nip: '-',
    nuptk: '3945773674230019',
    nik: '3404075306970001',
    nrg: '-',
    tempatLahir: 'Sleman',
    tanggalLahir: '1997-06-13',
    jenisKelamin: 'P',
    agama: 'Islam',
    statusPerkawinan: 'Belum Kawin',
    pendidikanTerakhir: 'S1 PGSD',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Guru Sekolah Dasar',
    sertifikasiPendidik: 'Belum Sertifikasi',
    pangkatGolongan: '-',
    statusKepegawaian: 'GTT / Honorer',
    jenisPtk: 'Guru Kelas',
    jabatan: 'Guru Kelas II',
    mengajarMapel: 'Guru Kelas II',
    tugasTambahan: 'Wali Kelas II & Pembina Pramuka Siaga',
    jamTatapMuka: 24,
    jamTugasTambahan: 2,
    skPengangkatan: '421.2/SK/002/SDN-HB01/VII/2026',
    tmtMulai: '2023-07-17',
    lembagaPengangkat: 'Kepala Sekolah',
    sumberGaji: 'Dana BOSP',
    noHp: '085729841234',
    email: 'nadia.wardani97@guru.sd.belajar.id',
    alamat: 'Jl. Anggajaya II No. 18, Condongcatur, Depok, Sleman',
    desaKelurahan: 'Condongcatur',
    kecamatan: 'Depok',
    kodePos: '55283',
  },
  {
    id: 'ptk-6',
    nama: 'Ahmad Hidayat, S.Pd.I',
    nip: '19890419 201903 1 004',
    nuptk: '2751767668130021',
    nik: '3401051904890002',
    nrg: '210272751005',
    tempatLahir: 'Kulon Progo',
    tanggalLahir: '1989-04-19',
    jenisKelamin: 'L',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'S1 Pendidikan Agama Islam',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Agama Islam',
    sertifikasiPendidik: 'PAI SD (2021)',
    pangkatGolongan: 'Penata Muda Tk. I / III-b',
    statusKepegawaian: 'PNS',
    jenisPtk: 'Guru Mapel',
    jabatan: 'Guru Pendidikan Agama Islam',
    mengajarMapel: 'Pendidikan Agama Islam dan Budi Pekerti',
    tugasTambahan: 'Pembina Kegiatan Keagamaan & Rohis SD',
    jamTatapMuka: 24,
    jamTugasTambahan: 2,
    skPengangkatan: '813.3/054/BKD/2019',
    tmtMulai: '2019-03-01',
    lembagaPengangkat: 'Pemerintah Kabupaten Sleman',
    sumberGaji: 'APBD',
    noHp: '081904215566',
    email: 'ahmad.hidayat89@guru.sd.belajar.id',
    alamat: 'Ambarketawang, Gamping, Sleman',
    desaKelurahan: 'Ambarketawang',
    kecamatan: 'Gamping',
    kodePos: '55294',
  },
  {
    id: 'ptk-7',
    nama: 'Dewi Lestari, S.Pd.',
    nip: '19900228 202321 2 015',
    nuptk: '8560768669230033',
    nik: '3308096802900001',
    nrg: '-',
    tempatLahir: 'Magelang',
    tanggalLahir: '1990-02-28',
    jenisKelamin: 'P',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'S1 PGSD',
    jenjangPendidikan: 'S1',
    jurusanProdi: 'Pendidikan Guru Sekolah Dasar',
    sertifikasiPendidik: 'Belum Sertifikasi',
    pangkatGolongan: 'Ahli Pertama / IX',
    statusKepegawaian: 'PPPK',
    jenisPtk: 'Guru Kelas',
    jabatan: 'Guru Kelas I',
    mengajarMapel: 'Guru Kelas I',
    tugasTambahan: 'Wali Kelas I & Pembina UKS',
    jamTatapMuka: 24,
    jamTugasTambahan: 2,
    skPengangkatan: '810/142/PPPK/2023',
    tmtMulai: '2023-08-01',
    lembagaPengangkat: 'Bupati Sleman',
    sumberGaji: 'APBD',
    noHp: '085228761230',
    email: 'dewi.lestari90@guru.sd.belajar.id',
    alamat: 'Sukoharjo, Ngaglik, Sleman',
    desaKelurahan: 'Sukoharjo',
    kecamatan: 'Ngaglik',
    kodePos: '55581',
  },
  {
    id: 'ptk-8',
    nama: 'Eko Maryanto, A.Md.',
    nip: '-',
    nuptk: '-',
    nik: '3404071009950004',
    nrg: '-',
    tempatLahir: 'Sleman',
    tanggalLahir: '1995-09-10',
    jenisKelamin: 'L',
    agama: 'Islam',
    statusPerkawinan: 'Kawin',
    pendidikanTerakhir: 'D3 Administrasi Perkantoran',
    jenjangPendidikan: 'D3',
    jurusanProdi: 'Administrasi Perkantoran',
    sertifikasiPendidik: '-',
    pangkatGolongan: '-',
    statusKepegawaian: 'Tendik',
    jenisPtk: 'Tenaga Administrasi Sekolah',
    jabatan: 'Tenaga Administrasi Sekolah / Operator Dapodik',
    mengajarMapel: '-',
    tugasTambahan: 'Operator Dapodik, ANBK & Pengelola Persuratan',
    jamTatapMuka: 0,
    jamTugasTambahan: 0,
    skPengangkatan: '421.2/SK/009/SDN-HB01/VII/2021',
    tmtMulai: '2021-07-01',
    lembagaPengangkat: 'Kepala Sekolah',
    sumberGaji: 'Dana BOSP',
    noHp: '089671234500',
    email: 'ekomaryanto95@admin.sd.belajar.id',
    alamat: 'Condongcatur, Depok, Sleman',
    desaKelurahan: 'Condongcatur',
    kecamatan: 'Depok',
    kodePos: '55283',
  },
];

export const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'sis-1',
    nama: 'Muhammad Alif Pratama',
    nis: '2401',
    nisn: '0154829103',
    nik: '3404071204150002',
    tempatLahir: 'Sleman',
    tanggalLahir: '2015-04-12',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    kelas: 'V (Lima)',
    namaAyah: 'Hendra Wijaya',
    namaIbu: 'Ratna Sari',
    pekerjaanOrtu: 'Pegawai Swasta',
    alamatOrtu: 'Jl. Perumnas No. 12, Condongcatur, Depok, Sleman',
  },
  {
    id: 'sis-2',
    nama: 'Aulia Zahra Ramadhani',
    nis: '2314',
    nisn: '0143928471',
    nik: '3404075508140001',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '2014-08-15',
    jenisKelamin: 'Perempuan',
    agama: 'Islam',
    kelas: 'VI (Enam)',
    namaAyah: 'Agus Setiawan',
    namaIbu: 'Nur Hidayati',
    pekerjaanOrtu: 'Wiraswasta',
    alamatOrtu: 'Jl. Nusa Indah No. 88, Depok, Sleman',
  },
  {
    id: 'sis-3',
    nama: 'Gabriel Putra Mahendra',
    nis: '2508',
    nisn: '0167382910',
    nik: '3404072101160004',
    tempatLahir: 'Semarang',
    tanggalLahir: '2016-01-21',
    jenisKelamin: 'Laki-laki',
    agama: 'Katolik',
    kelas: 'IV (Empat)',
    namaAyah: 'Yohanes Mahendra',
    namaIbu: 'Maria Kristanti',
    pekerjaanOrtu: 'Aparatur Sipil Negara',
    alamatOrtu: 'Perum Minomartani Blok D-11, Ngaglik, Sleman',
  },
  {
    id: 'sis-4',
    nama: 'Nayla Putri Azzahra',
    nis: '2602',
    nisn: '0179120455',
    nik: '3404074911170003',
    tempatLahir: 'Sleman',
    tanggalLahir: '2017-11-09',
    jenisKelamin: 'Perempuan',
    agama: 'Islam',
    kelas: 'III (Tiga)',
    namaAyah: 'Dedi Kurniawan',
    namaIbu: 'Fitriani',
    pekerjaanOrtu: 'Pedagang',
    alamatOrtu: 'Dusun Joho, Condongcatur, Depok, Sleman',
  },
  {
    id: 'sis-5',
    nama: 'Bagas Adi Nugroho',
    nis: '2319',
    nisn: '0148201944',
    nik: '3404071806140005',
    tempatLahir: 'Bantul',
    tanggalLahir: '2014-06-18',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    kelas: 'VI (Enam)',
    namaAyah: 'Suharto',
    namaIbu: 'Wulandari',
    pekerjaanOrtu: 'Karyawan BUMN',
    alamatOrtu: 'Jl. Ringroad Utara No. 27, Depok, Sleman',
  },
];

export const DEFAULT_TEACHING_ASSIGNMENTS: TeachingAssignmentRow[] = [
  {
    id: 'ta-1',
    namaGuru: 'Hj. Sri Wahyuni, S.Pd., M.Pd.',
    nip: '19720514 199803 2 006',
    pangkatGol: 'Pembina Tk. I / IV-b',
    status: 'PNS',
    jabatanGuru: 'Kepala Sekolah',
    kelasAmpu: 'I – VI (Supervisi)',
    jamTatapMuka: 24,
    tugasTambahan: 'Manajerial Sekolah & Penanggung Jawab BOS',
  },
  {
    id: 'ta-2',
    namaGuru: 'Budi Santoso, S.Pd.SD',
    nip: '19810322 200902 1 003',
    pangkatGol: 'Penata Tk. I / III-d',
    status: 'PNS',
    jabatanGuru: 'Guru Kelas VI',
    kelasAmpu: 'VI (Enam)',
    jamTatapMuka: 28,
    tugasTambahan: 'Wali Kelas VI & Koordinator P5 / Kokurikuler',
  },
  {
    id: 'ta-3',
    namaGuru: 'Siti Aminah, S.Pd.',
    nip: '19860811 201406 2 002',
    pangkatGol: 'Penata / III-c',
    status: 'PNS',
    jabatanGuru: 'Guru Kelas V',
    kelasAmpu: 'V (Lima)',
    jamTatapMuka: 28,
    tugasTambahan: 'Wali Kelas V & Kepala Perpustakaan',
  },
  {
    id: 'ta-4',
    namaGuru: 'Dewi Lestari, S.Pd.',
    nip: '19900228 202321 2 015',
    pangkatGol: 'Ahli Pertama / IX',
    status: 'PPPK',
    jabatanGuru: 'Guru Kelas I',
    kelasAmpu: 'I (Satu)',
    jamTatapMuka: 24,
    tugasTambahan: 'Wali Kelas I & Pembina UKS',
  },
  {
    id: 'ta-5',
    namaGuru: 'Nadia Kusuma Wardani, S.Pd.',
    nip: '-',
    pangkatGol: '-',
    status: 'GTT',
    jabatanGuru: 'Guru Kelas II',
    kelasAmpu: 'II (Dua)',
    jamTatapMuka: 24,
    tugasTambahan: 'Wali Kelas II & Pembina Pramuka Siaga',
  },
  {
    id: 'ta-6',
    namaGuru: 'Ahmad Hidayat, S.Pd.I',
    nip: '19890419 201903 1 004',
    pangkatGol: 'Penata Muda Tk. I / III-b',
    status: 'PNS',
    jabatanGuru: 'Guru Mapel PAI & BP',
    kelasAmpu: 'I – VI',
    jamTatapMuka: 24,
    tugasTambahan: 'Pembina Kegiatan Keagamaan & Rohis SD',
  },
  {
    id: 'ta-7',
    namaGuru: 'Rizky Pratama, S.Pd.',
    nip: '19921104 202221 1 008',
    pangkatGol: 'Ahli Pertama / IX',
    status: 'PPPK',
    jabatanGuru: 'Guru Mapel PJOK',
    kelasAmpu: 'I – VI',
    jamTatapMuka: 24,
    tugasTambahan: 'Pembina Ekstrakurikuler Olahraga & O2SN',
  },
];

export function buildTeachingAssignmentsFromTeachers(
  teachers: Teacher[]
): TeachingAssignmentRow[] {
  return teachers.map((t, index) => {
    const isTendik = t.statusKepegawaian === 'Tendik';
    const rawJabatan = t.jabatan || t.jenisPtk || (isTendik ? 'Tenaga Administrasi Sekolah' : 'Guru Kelas');
    let kelasAmpu = '-';
    if (!isTendik) {
      if (rawJabatan.includes('Kelas')) {
        kelasAmpu = rawJabatan.replace(/^Guru Kelas\s*/i, '').trim() || 'I – VI';
      } else if (rawJabatan.toLowerCase().includes('kepala sekolah')) {
        kelasAmpu = 'I – VI (Supervisi)';
      } else if (t.mengajarMapel && t.mengajarMapel !== '-') {
        kelasAmpu = t.mengajarMapel;
      } else {
        kelasAmpu = 'I – VI';
      }
    } else {
      kelasAmpu = 'Administrasi';
    }

    return {
      id: `ta-${t.id}-${index}`,
      namaGuru: t.nama,
      nip: t.nip || '-',
      pangkatGol: t.pangkatGolongan || '-',
      status: t.statusKepegawaian === 'GTT / Honorer' ? 'GTT' : t.statusKepegawaian,
      jabatanGuru: rawJabatan,
      kelasAmpu,
      jamTatapMuka: t.jamTatapMuka ?? (isTendik ? 0 : 24),
      tugasTambahan:
        t.tugasTambahan && t.tugasTambahan !== '-'
          ? t.tugasTambahan
          : rawJabatan.toLowerCase().includes('kepala sekolah')
            ? 'Manajerial & Penanggung Jawab BOSP'
            : '-',
    };
  });
}

export const DEFAULT_SKL_SUBJECTS: SklSubjectRow[] = [
  { id: 'skl-1', mataPelajaran: 'Pendidikan Agama dan Budi Pekerti', nilai: 89.5 },
  { id: 'skl-2', mataPelajaran: 'Pendidikan Pancasila', nilai: 88.0 },
  { id: 'skl-3', mataPelajaran: 'Bahasa Indonesia', nilai: 87.5 },
  { id: 'skl-4', mataPelajaran: 'Matematika', nilai: 85.0 },
  { id: 'skl-5', mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', nilai: 88.5 },
  { id: 'skl-6', mataPelajaran: 'Seni Budaya dan Prakarya (SBdP)', nilai: 90.0 },
  { id: 'skl-7', mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', nilai: 89.0 },
  { id: 'skl-8', mataPelajaran: 'Bahasa Jawa (Muatan Lokal)', nilai: 86.5 },
  { id: 'skl-9', mataPelajaran: 'Bahasa Inggris', nilai: 87.0 },
];

export function createInitialFormData(
  docType: DocumentType,
  school: SchoolProfile,
  sequenceNumber: number,
  teachers: Teacher[],
  students: Student[]
): DocumentFormData {
  const today = todayIsoDate();
  const code = getDocClassificationCode(docType);
  const nomorSurat = generateNomorSurat(code, sequenceNumber, school.kodeSuratSekolah, today);
  const templateMeta = DOC_TEMPLATES.find((t) => t.type === docType);

  const sampleTeacher = teachers.find((t) => t.statusKepegawaian === 'GTT / Honorer') || teachers[1] || teachers[0];
  const sampleStudent = students[0];

  const base: DocumentFormData = {
    nomorSurat,
    lampiran: docType === 'sk_pembagian_tugas' ? '1 (satu) berkas' : '-',
    perihal: templateMeta?.defaultPerihal || 'Surat Dinas Sekolah',
    tanggalSurat: today,
    tempatSurat: school.kabupatenKota,
    penandatanganJabatan: 'Kepala Sekolah',
    penandatanganNama: school.namaKepalaSekolah,
    penandatanganNip: school.nipKepalaSekolah,
    tampilkanStempel: true,

    skTentang:
      docType === 'sk_pengangkatan_guru'
        ? 'PENGANGKATAN GURU TIDAK TETAP (GTT) / GURU KELAS'
        : `PEMBAGIAN TUGAS GURU DALAM KEGIATAN PROSES BELAJAR MENGAJAR SEMESTER ${school.semester.toUpperCase()} TAHUN PELAJARAN ${school.tahunPelajaran}`,
    skPenerbit: school.statusSekolah === 'Swasta' ? 'Ketua Yayasan' : 'Kepala Sekolah',
    guruIdDipilih: sampleTeacher?.id,
    guruNama: sampleTeacher?.nama || 'Nadia Kusuma Wardani, S.Pd.',
    guruTempatTanggalLahir: sampleTeacher
      ? `${sampleTeacher.tempatLahir}, ${sampleTeacher.tanggalLahir}`
      : 'Sleman, 13 Juni 1997',
    guruNikNuptk: sampleTeacher?.nuptk && sampleTeacher.nuptk !== '-' ? sampleTeacher.nuptk : '3404075306970001',
    guruPendidikan: sampleTeacher?.pendidikanTerakhir || 'S1 PGSD',
    guruAlamat: sampleTeacher?.alamat || 'Condongcatur, Depok, Sleman',
    jabatanDiangkat: 'Guru Kelas II (Dua)',
    unitKerja: school.namaSekolah,
    statusPengangkatan: 'Guru Tidak Tetap (GTT)',
    tmtPengangkatan: today,
    berlakuSampai: '30 Juni 2027',
    honorarium: 'Rp 1.500.000,- / bulan',
    sumberDana: 'Dana Bantuan Operasional Satuan Pendidikan (BOSP) sesuai ketentuan berlaku',
    menimbangPoin:
      'a. bahwa untuk kelancaran pelaksanaan kegiatan belajar mengajar pada ' +
      school.namaSekolah +
      ' Tahun Pelajaran ' +
      school.tahunPelajaran +
      ', dipandang perlu mengangkat Tenaga Pendidik;\nb. bahwa Saudara yang namanya tercantum dalam keputusan ini dipandang cakap, memenuhi syarat kualifikasi akademik S1/D-IV, dan bertanggung jawab untuk melaksanakan tugas dimaksud.',
    mengingatPoin:
      '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\n2. Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen;\n3. Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan atas PP Nomor 74 Tahun 2008 tentang Guru;\n4. Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi tentang Standar Pengelolaan Pendidikan Dasar;\n5. Rencana Kerja dan Anggaran Sekolah (RKAS) ' +
      school.namaSekolah +
      ' Tahun Pelajaran ' +
      school.tahunPelajaran +
      '.',
    tembusan:
      '1. Kepala Dinas Pendidikan ' +
      school.kabupatenKota +
      '\n2. Pengawas Sekolah Dasar Korwil Kecamatan ' +
      school.kecamatan +
      '\n3. Ketua Komite ' +
      school.namaSekolah +
      '\n4. Arsip',

    pembagianSemester: school.semester,
    pembagianTahunPelajaran: school.tahunPelajaran,
    tanggalBerlakuTugas: today,
    lampiranTugasRows:
      teachers.length > 0
        ? buildTeachingAssignmentsFromTeachers(teachers)
        : DEFAULT_TEACHING_ASSIGNMENTS.map((r) => ({ ...r })),

    siswaIdDipilih: sampleStudent?.id,
    siswaNama: sampleStudent?.nama || 'Muhammad Alif Pratama',
    siswaNis: sampleStudent?.nis || '2401',
    siswaNisn: sampleStudent?.nisn || '0154829103',
    siswaNik: sampleStudent?.nik || '3404071204150002',
    siswaTempatTanggalLahir: sampleStudent
      ? `${sampleStudent.tempatLahir}, 12 April 2015`
      : 'Sleman, 12 April 2015',
    siswaJenisKelamin: sampleStudent?.jenisKelamin || 'Laki-laki',
    siswaAgama: sampleStudent?.agama || 'Islam',
    siswaKelas: sampleStudent?.kelas || 'V (Lima)',
    ortuNama: sampleStudent?.namaAyah || 'Hendra Wijaya',
    ortuPekerjaan: sampleStudent?.pekerjaanOrtu || 'Pegawai Swasta',
    ortuAlamat: sampleStudent?.alamatOrtu || 'Jl. Perumnas No. 12, Condongcatur, Depok, Sleman',

    sekolahTujuan: 'SD Negeri Percobaan 02 Yogyakarta',
    alamatSekolahTujuan: 'Jl. Kenari No. 14, Umbulharjo, Kota Yogyakarta',
    alasanPindah: 'Mengikuti kepindahan domisili dan tugas kerja orang tua',
    tanggalEfektifPindah: today,
    catatanKelakuan: 'Berkelakuan baik dan tidak sedang dalam sanksi tata tertib sekolah',
    statusDapodik: 'Berkas mutasi dan pelepasan peserta didik pada sistem Dapodik telah diproses',
    sertakanKolomPengawas: docType === 'surat_pindah_sekolah',
    namaPengawasDinas: 'Drs. Bambang Supriyadi, M.Pd.',
    nipPengawasDinas: '19680912 199303 1 007',

    sekolahAsal: 'SD Negeri 1 Kalasan',
    alamatSekolahAsal: 'Jl. Solo Km 13, Kalasan, Sleman',
    kelasDiterima: 'IV (Empat)',
    sisaKuotaKelas: 3,
    syaratBerkas:
      '1. Surat Keterangan Pindah Sekolah dari sekolah asal yang disahkan Dinas Pendidikan setempat;\n2. Fotokopi Rapor asli semester terakhir;\n3. Fotokopi Akta Kelahiran dan Kartu Keluarga;\n4. Surat pencabutan data peserta didik pada Dapodik sekolah asal.',

    keperluanSurat:
      docType === 'surat_kelakuan_baik'
        ? 'Persyaratan Pendaftaran Peserta Didik Baru (PPDB) Jenjang SMP'
        : 'Persyaratan Administrasi Program Indonesia Pintar (PIP) / KIP Sekolah Dasar',
    nomorKipPip: '-',
    keteranganTambahan:
      docType === 'surat_kelakuan_baik'
        ? 'Selama menjadi peserta didik di sekolah kami, yang bersangkutan selalu menaati tata tertib sekolah, bersikap sopan, dan tidak pernah terlibat pelanggaran disiplin berat.'
        : 'Yang bersangkutan tercatat secara resmi sebagai peserta didik aktif pada Tahun Pelajaran ' +
          school.tahunPelajaran +
          ' dan terdata valid dalam Dapodik sekolah.',

    dasarPenugasan:
      'Surat Undangan Dinas Pendidikan Kabupaten Sleman Nomor: 421/1842/2026 tanggal 15 November 2026 tentang Workshop Implementasi Kurikulum dan Pembelajaran Mendalam SD.',
    petugasRows: [
      {
        id: 'pet-1',
        nama: teachers[1]?.nama || 'Budi Santoso, S.Pd.SD',
        nip: teachers[1]?.nip || '19810322 200902 1 003',
        pangkatGol: teachers[1]?.pangkatGolongan || 'Penata Tk. I / III-d',
        jabatan: teachers[1]?.jabatan || 'Guru Kelas VI',
      },
      {
        id: 'pet-2',
        nama: teachers[2]?.nama || 'Siti Aminah, S.Pd.',
        nip: teachers[2]?.nip || '19860811 201406 2 002',
        pangkatGol: teachers[2]?.pangkatGolongan || 'Penata / III-c',
        jabatan: teachers[2]?.jabatan || 'Guru Kelas V',
      },
    ],
    namaKegiatanTugas: 'Workshop Penyusunan Perangkat Pembelajaran & Asesmen Kurikulum SD',
    hariTanggalTugas: 'Senin – Selasa, 23 – 24 November 2026',
    waktuTugas: '08.00 WIB s.d. selesai',
    tempatTugas: 'Aula Dinas Pendidikan Kabupaten Sleman',
    keteranganTugas: 'Melaksanakan tugas dengan penuh tanggung jawab dan melaporkan hasilnya kepada Kepala Sekolah.',

    kepadaYth: 'Bapak/Ibu Orang Tua / Wali Murid Kelas I s.d. VI',
    diTempatUndangan: 'Tempat',
    sifatUndangan: 'Penting',
    isiPembukaUndangan:
      'Mengharap dengan hormat kehadiran Bapak/Ibu Orang Tua / Wali Murid ' +
      school.namaSekolah +
      ' pada pertemuan yang akan dilaksanakan pada:',
    hariTanggalUndangan: 'Sabtu, 28 November 2026',
    waktuUndangan: '08.30 WIB s.d. 11.00 WIB',
    tempatUndangan: 'Ruang Pertemuan / Aula ' + school.namaSekolah,
    acaraUndangan:
      '1. Sosialisasi Program Kegiatan Akhir Semester Ganjil ' +
      school.tahunPelajaran +
      '\n2. Persiapan Penilaian Sumatif Akhir Semester (PSAS)\n3. Informasi Kegiatan Kesiswaan dan Komite Sekolah',

    sklTahunLulus: '2025/2026',
    sklNomorIjazahSementara: 'DN-04/D-SD/K13/001248',
    sklStatusKelulusan: 'LULUS',
    sklNilaiRows: DEFAULT_SKL_SUBJECTS.map((s) => ({ ...s })),

    panggilanKe: 'Pertama (I)',
    jumlahKetidakhadiranAlpha: 5,
    catatanPembinaan:
      'Dalam rangka pembinaan kedisiplinan belajar serta mencari solusi bersama terkait kehadiran dan perkembangan belajar putra/putri Bapak/Ibu di kelas.',
    menghadapKepada: 'Kepala Sekolah & Wali Kelas ' + (sampleStudent?.kelas || 'V (Lima)'),
  };

  if (docType === 'sk_pembagian_tugas') {
    base.mengingatPoin =
      '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\n2. Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan atas PP Nomor 74 Tahun 2008 tentang Guru;\n3. Permendikbudristek Nomor 12 Tahun 2024 tentang Kurikulum pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;\n4. Keputusan Kepala Dinas Pendidikan tentang Kalender Pendidikan Tahun Pelajaran ' +
      school.tahunPelajaran +
      ';\n5. Hasil Rapat Dewan Guru ' +
      school.namaSekolah +
      ' tentang Pembagian Tugas Mengajar.';
    base.menimbangPoin =
      'a. bahwa dalam rangka memperlancar pelaksanaan proses belajar mengajar dan tugas tambahan guru di ' +
      school.namaSekolah +
      ' pada Semester ' +
      school.semester +
      ' Tahun Pelajaran ' +
      school.tahunPelajaran +
      ', perlu menetapkan pembagian tugas mengajar bagi seluruh pendidik;\nb. bahwa guru-guru yang tercantum dalam lampiran keputusan ini dinilai cakap dan memenuhi kualifikasi untuk mengemban tugas dimaksud.';
  }

  return base;
}

export function createInitialArchives(
  school: SchoolProfile,
  teachers: Teacher[],
  students: Student[]
): ArchivedDocument[] {
  const skPtmData = createInitialFormData('sk_pembagian_tugas', school, 1, teachers, students);
  skPtmData.nomorSurat = `421.2/SK-PTM/001/${school.kodeSuratSekolah}/VII/2026`;
  skPtmData.tanggalSurat = '2026-07-13';

  const skGuruData = createInitialFormData('sk_pengangkatan_guru', school, 2, teachers, students);
  skGuruData.nomorSurat = `421.2/SK/002/${school.kodeSuratSekolah}/VII/2026`;
  skGuruData.tanggalSurat = '2026-07-15';

  const mutasiData = createInitialFormData('surat_mutasi', school, 3, teachers, students);
  mutasiData.nomorSurat = `421.2/014/${school.kodeSuratSekolah}/X/2026`;
  mutasiData.tanggalSurat = '2026-10-12';

  const siapTerimaData = createInitialFormData('surat_siap_terima', school, 4, teachers, students);
  siapTerimaData.nomorSurat = `421.2/018/${school.kodeSuratSekolah}/XI/2026`;
  siapTerimaData.tanggalSurat = '2026-11-04';

  const totalSkPtmJtm = skPtmData.lampiranTugasRows.reduce(
    (sum, r) => sum + (Number(r.jamTatapMuka) || 0),
    0
  );

  return [
    {
      id: 'arc-1',
      docType: 'sk_pembagian_tugas',
      category: 'SK Kepegawaian',
      nomorSurat: skPtmData.nomorSurat,
      judul: 'SK Pembagian Tugas Mengajar Semester Ganjil 2026/2027',
      subjekUtama: `${skPtmData.lampiranTugasRows.length} PTK · Total ${totalSkPtmJtm} JTM`,
      tanggalSurat: skPtmData.tanggalSurat,
      createdAt: '2026-07-13T08:00:00.000Z',
      updatedAt: '2026-07-13T08:00:00.000Z',
      paperSize: 'F4',
      data: skPtmData,
    },
    {
      id: 'arc-2',
      docType: 'sk_pengangkatan_guru',
      category: 'SK Kepegawaian',
      nomorSurat: skGuruData.nomorSurat,
      judul: 'SK Pengangkatan GTT — Nadia Kusuma Wardani, S.Pd.',
      subjekUtama: 'Nadia Kusuma Wardani, S.Pd.',
      tanggalSurat: skGuruData.tanggalSurat,
      createdAt: '2026-07-15T09:15:00.000Z',
      updatedAt: '2026-07-15T09:15:00.000Z',
      paperSize: 'F4',
      data: skGuruData,
    },
    {
      id: 'arc-3',
      docType: 'surat_mutasi',
      category: 'Mutasi & Kesiswaan',
      nomorSurat: mutasiData.nomorSurat,
      judul: 'Surat Keterangan Mutasi Siswa — Muhammad Alif Pratama',
      subjekUtama: 'Muhammad Alif Pratama (Kelas V)',
      tanggalSurat: mutasiData.tanggalSurat,
      createdAt: '2026-10-12T10:30:00.000Z',
      updatedAt: '2026-10-12T10:30:00.000Z',
      paperSize: 'F4',
      data: mutasiData,
    },
    {
      id: 'arc-4',
      docType: 'surat_siap_terima',
      category: 'Mutasi & Kesiswaan',
      nomorSurat: siapTerimaData.nomorSurat,
      judul: 'Surat Siap Terima Siswa Pindahan — Kelas IV',
      subjekUtama: 'Dari SD Negeri 1 Kalasan',
      tanggalSurat: siapTerimaData.tanggalSurat,
      createdAt: '2026-11-04T11:20:00.000Z',
      updatedAt: '2026-11-04T11:20:00.000Z',
      paperSize: 'F4',
      data: siapTerimaData,
    },
  ];
}
