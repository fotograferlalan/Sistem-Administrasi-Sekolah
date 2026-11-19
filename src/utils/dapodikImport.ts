import * as XLSX from 'xlsx';
import { Teacher } from '../types/admin';

export interface ParsedDapodikWorkbook {
  sheetNames: string[];
  recommendedSheet: string;
  workbook: XLSX.WorkBook;
}

export interface ParsedDapodikSheetResult {
  sheetName: string;
  headerRowIndex: number;
  detectedColumns: string[];
  teachers: Teacher[];
  skippedRows: number;
}

export function isKepalaSekolah(t: Teacher): boolean {
  const fields = [t.jabatan, t.jenisPtk, t.tugasTambahan]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return (
    fields.includes('kepala sekolah') ||
    fields.includes('kepala satuan pendidikan')
  );
}

export function sortTeachersKepalaFirst(list: Teacher[]): Teacher[] {
  const kepala: Teacher[] = [];
  const others: Teacher[] = [];
  for (const item of list) {
    if (isKepalaSekolah(item)) {
      kepala.push(item);
    } else {
      others.push(item);
    }
  }
  return [...kepala, ...others];
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanStr(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).replace(/\s+/g, ' ').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return fallback;
  }
  return s;
}

function parseExcelDate(val: unknown, fallback = '1990-01-01'): string {
  if (val === null || val === undefined || val === '') return fallback;

  if (typeof val === 'number' && val > 1000 && val < 90000) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const y = String(parsed.y).padStart(4, '0');
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }

  const raw = String(val).trim();
  if (!raw || raw === '-') return fallback;

  // YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  return fallback;
}

function mapStatusKepegawaian(
  rawStatus: string,
  jenisPtk: string
): Teacher['statusKepegawaian'] {
  const s = rawStatus.toLowerCase();
  const j = jenisPtk.toLowerCase();

  if (s.includes('pppk') || s.includes('p3k')) return 'PPPK';
  if (s.includes('pns') || s.includes('cpns') || s.includes('asn')) return 'PNS';
  if (s.includes('gty') || s.includes('pty') || s.includes('yayasan')) {
    return 'GTY';
  }
  if (
    s.includes('tenaga honor') ||
    j.includes('administrasi') ||
    j.includes('pustakawan') ||
    j.includes('penjaga') ||
    j.includes('operator') ||
    j.includes('tata usaha') ||
    j.includes('kebersihan') ||
    j.includes('keamanan')
  ) {
    return 'Tendik';
  }
  return 'GTT / Honorer';
}

function mapGender(raw: string): 'L' | 'P' {
  const g = raw.toLowerCase().trim();
  if (g.startsWith('p') || g.includes('wanita') || g.includes('perempuan')) {
    return 'P';
  }
  return 'L';
}

export async function readDapodikExcelFile(
  file: File
): Promise<ParsedDapodikWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  // Prefer sheet named PTK / GTK / Guru if uploading multi-sheet Profil Sekolah Dapodik
  const recommendedSheet =
    sheetNames.find((name) => {
      const n = name.toLowerCase();
      return n === 'ptk' || n.includes('ptk') || n.includes('gtk') || n.includes('guru');
    }) || sheetNames[0];

  return {
    sheetNames,
    recommendedSheet,
    workbook,
  };
}

export function parseDapodikSheet(
  workbook: XLSX.WorkBook,
  sheetName: string
): ParsedDapodikSheetResult {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      sheetName,
      headerRowIndex: 0,
      detectedColumns: [],
      teachers: [],
      skippedRows: 0,
    };
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
  });

  // Auto-detect header row within top 20 rows
  let headerRowIndex = 0;
  let bestScore = -1;

  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const normalized = row.map(normalizeHeader);
    let score = 0;
    if (normalized.some((c) => c === 'nama' || c.includes('nama ptk') || c.includes('nama lengkap'))) {
      score += 4;
    }
    if (normalized.some((c) => c.includes('nuptk'))) score += 3;
    if (normalized.some((c) => c === 'nip' || c.includes('nip'))) score += 2;
    if (normalized.some((c) => c.includes('status kepegawaian'))) score += 3;
    if (normalized.some((c) => c.includes('jenis ptk'))) score += 3;
    if (normalized.some((c) => c === 'jk' || c.includes('jenis kelamin'))) score += 2;
    if (normalized.some((c) => c.includes('tempat lahir'))) score += 2;

    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  const rawHeaders = (rows[headerRowIndex] || []).map(normalizeHeader);
  const detectedColumns = rawHeaders.filter(Boolean);

  const findCol = (...candidates: string[]): number => {
    for (const cand of candidates) {
      const exactIdx = rawHeaders.findIndex((h) => h === cand);
      if (exactIdx !== -1) return exactIdx;
    }
    for (const cand of candidates) {
      const partialIdx = rawHeaders.findIndex((h) => h.includes(cand));
      if (partialIdx !== -1) return partialIdx;
    }
    return -1;
  };

  const colNama = findCol('nama', 'nama lengkap', 'nama ptk', 'nama guru');
  const colGelarDepan = findCol('gelar depan');
  const colGelarBelakang = findCol('gelar belakang');
  const colNip = findCol('nip');
  const colNuptk = findCol('nuptk');
  const colNik = findCol('nik', 'no ktp');
  const colNrg = findCol('nrg');
  const colNpwp = findCol('npwp');
  const colJk = findCol('jk', 'l/p', 'jenis kelamin');
  const colTempatLahir = findCol('tempat lahir', 'tmp lahir');
  const colTanggalLahir = findCol('tanggal lahir', 'tgl lahir');
  const colAgama = findCol('agama');
  const colStatusNikah = findCol('status perkawinan');
  const colIbu = findCol('nama ibu kandung', 'ibu kandung');
  const colStatusKep = findCol('status kepegawaian', 'status kepeg', 'status');
  const colJenisPtk = findCol('jenis ptk', 'jabatan ptk');
  const colPangkat = findCol('pangkat/golongan', 'pangkat golongan', 'pangkat/gol', 'golongan');
  const colJenjang = findCol('jenjang', 'pendidikan terakhir', 'pendidikan');
  const colProdi = findCol('jurusan/prodi', 'jurusan', 'prodi', 'program studi');
  const colSertifikasi = findCol('sertifikasi', 'bidang studi sertifikasi');
  const colTmtKerja = findCol('tmt pengangkatan', 'tmt kerja', 'tmt mulai', 'tmt');
  const colSkAngkat = findCol('sk pengangkatan', 'nomor sk');
  const colLembaga = findCol('lembaga pengangkat', 'lembaga');
  const colSumberGaji = findCol('sumber gaji', 'sumber dana');
  const colNoSuratTugas = findCol('nomor surat tugas');
  const colTglSuratTugas = findCol('tanggal surat tugas');
  const colTugasTambahan = findCol('tugas tambahan');
  const colMengajar = findCol('mengajar', 'mata pelajaran', 'mapel');
  const colJjm = findCol('total jjm', 'jjm', 'jtm', 'jam mengajar');
  const colJamTambahan = findCol('jam tugas tambahan');
  const colNoHp = findCol('no hp', 'hp', 'telepon', 'no. hp', 'telp');
  const colEmail = findCol('email', 'surel');
  const colAlamat = findCol('alamat jalan', 'alamat', 'alamat tinggal');
  const colRt = findCol('rt');
  const colRw = findCol('rw');
  const colDesa = findCol('desa/kelurahan', 'desa', 'kelurahan');
  const colKecamatan = findCol('kecamatan');
  const colKodePos = findCol('kode pos');

  const teachers: Teacher[] = [];
  let skippedRows = 0;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const baseName = colNama !== -1 ? cleanStr(row[colNama]) : '';
    if (!baseName) continue;

    // Skip subheader / summary rows commonly found at bottom of Dapodik exports
    const lowerName = baseName.toLowerCase();
    if (
      lowerName === 'nama' ||
      lowerName.startsWith('jumlah') ||
      lowerName.startsWith('total') ||
      lowerName.startsWith('sumber:')
    ) {
      skippedRows++;
      continue;
    }

    const gDepan = colGelarDepan !== -1 ? cleanStr(row[colGelarDepan]) : '';
    const gBelakang =
      colGelarBelakang !== -1 ? cleanStr(row[colGelarBelakang]) : '';

    let fullName = baseName;
    if (gDepan && !fullName.toLowerCase().startsWith(gDepan.toLowerCase())) {
      fullName = `${gDepan} ${fullName}`;
    }
    if (
      gBelakang &&
      !fullName.toLowerCase().includes(gBelakang.toLowerCase())
    ) {
      fullName = `${fullName}, ${gBelakang}`;
    }

    const rawStatus =
      colStatusKep !== -1 ? cleanStr(row[colStatusKep], 'GTT / Honorer') : 'GTT / Honorer';
    const rawJenisPtk =
      colJenisPtk !== -1 ? cleanStr(row[colJenisPtk], 'Guru Kelas') : 'Guru Kelas';
    const mappedStatus = mapStatusKepegawaian(rawStatus, rawJenisPtk);

    const jenjang = colJenjang !== -1 ? cleanStr(row[colJenjang]) : '';
    const prodi = colProdi !== -1 ? cleanStr(row[colProdi]) : '';
    const pendidikanTerakhir =
      jenjang && prodi
        ? `${jenjang} ${prodi}`
        : jenjang || prodi || 'S1 PGSD';

    const alamatJalan = colAlamat !== -1 ? cleanStr(row[colAlamat]) : '';
    const rt = colRt !== -1 ? cleanStr(row[colRt]) : '';
    const rw = colRw !== -1 ? cleanStr(row[colRw]) : '';
    const desa = colDesa !== -1 ? cleanStr(row[colDesa]) : '';
    const kec = colKecamatan !== -1 ? cleanStr(row[colKecamatan]) : '';

    const addressParts = [
      alamatJalan,
      rt || rw ? `RT ${rt || '00'}/RW ${rw || '00'}` : '',
      desa,
      kec ? `Kec. ${kec}` : '',
    ].filter(Boolean);

    const mengajar = colMengajar !== -1 ? cleanStr(row[colMengajar], '-') : '-';
    const tugasTambahan =
      colTugasTambahan !== -1 ? cleanStr(row[colTugasTambahan], '-') : '-';

    let jabatan = rawJenisPtk;
    if (
      rawJenisPtk.toLowerCase().includes('guru kelas') &&
      mengajar !== '-' &&
      !mengajar.toLowerCase().includes('guru kelas')
    ) {
      jabatan = `${rawJenisPtk} (${mengajar})`;
    }

    const jjmVal =
      colJjm !== -1 ? Number(String(row[colJjm]).replace(/[^\d.]/g, '')) || 0 : 24;
    const jamTambahanVal =
      colJamTambahan !== -1
        ? Number(String(row[colJamTambahan]).replace(/[^\d.]/g, '')) || 0
        : 0;

    teachers.push({
      id: `ptk-imp-${Date.now()}-${r}`,
      nama: fullName,
      gelarDepan: gDepan || undefined,
      gelarBelakang: gBelakang || undefined,
      nip: colNip !== -1 ? cleanStr(row[colNip], '-') : '-',
      nuptk: colNuptk !== -1 ? cleanStr(row[colNuptk], '-') : '-',
      nik: colNik !== -1 ? cleanStr(row[colNik], '-') : '-',
      nrg: colNrg !== -1 ? cleanStr(row[colNrg], '-') : '-',
      npwp: colNpwp !== -1 ? cleanStr(row[colNpwp], '-') : '-',
      tempatLahir:
        colTempatLahir !== -1 ? cleanStr(row[colTempatLahir], '-') : '-',
      tanggalLahir:
        colTanggalLahir !== -1
          ? parseExcelDate(row[colTanggalLahir], '1990-01-01')
          : '1990-01-01',
      jenisKelamin: colJk !== -1 ? mapGender(cleanStr(row[colJk], 'L')) : 'L',
      agama: colAgama !== -1 ? cleanStr(row[colAgama], 'Islam') : 'Islam',
      statusPerkawinan:
        colStatusNikah !== -1 ? cleanStr(row[colStatusNikah], '-') : '-',
      namaIbuKandung: colIbu !== -1 ? cleanStr(row[colIbu], '-') : '-',
      pendidikanTerakhir,
      jenjangPendidikan: jenjang || undefined,
      jurusanProdi: prodi || undefined,
      sertifikasiPendidik:
        colSertifikasi !== -1 ? cleanStr(row[colSertifikasi], '-') : '-',
      pangkatGolongan: colPangkat !== -1 ? cleanStr(row[colPangkat], '-') : '-',
      statusKepegawaian: mappedStatus,
      jenisPtk: rawJenisPtk,
      jabatan,
      mengajarMapel: mengajar,
      tugasTambahan,
      jamTatapMuka: jjmVal,
      jamTugasTambahan: jamTambahanVal,
      skPengangkatan: colSkAngkat !== -1 ? cleanStr(row[colSkAngkat], '-') : '-',
      tmtMulai:
        colTmtKerja !== -1
          ? parseExcelDate(row[colTmtKerja], '2024-07-01')
          : '2024-07-01',
      lembagaPengangkat:
        colLembaga !== -1 ? cleanStr(row[colLembaga], '-') : '-',
      sumberGaji: colSumberGaji !== -1 ? cleanStr(row[colSumberGaji], '-') : '-',
      nomorSuratTugas:
        colNoSuratTugas !== -1 ? cleanStr(row[colNoSuratTugas], '-') : '-',
      tanggalSuratTugas:
        colTglSuratTugas !== -1
          ? parseExcelDate(row[colTglSuratTugas], '')
          : '',
      noHp: colNoHp !== -1 ? cleanStr(row[colNoHp], '-') : '-',
      email: colEmail !== -1 ? cleanStr(row[colEmail], '-') : '-',
      alamat: addressParts.join(', ') || '-',
      desaKelurahan: desa || undefined,
      kecamatan: kec || undefined,
      kodePos: colKodePos !== -1 ? cleanStr(row[colKodePos], '') : undefined,
    });
  }

  const sortedTeachers = sortTeachersKepalaFirst(teachers);

  return {
    sheetName,
    headerRowIndex,
    detectedColumns,
    teachers: sortedTeachers,
    skippedRows,
  };
}

export function exportTeachersToDapodikExcel(
  teachers: Teacher[],
  schoolName: string
): void {
  const orderedTeachers = teachers;
  const titleRows = [
    [`DAFTAR PENDIDIK DAN TENAGA KEPENDIDIKAN (PTK)`],
    [`Sekolah : ${schoolName}`],
    [`Tanggal Ekspor : ${new Date().toLocaleDateString('id-ID')}`],
    [],
    [
      'No',
      'Nama',
      'NUPTK',
      'JK',
      'Tempat Lahir',
      'Tanggal Lahir',
      'NIP',
      'NIK',
      'Status Kepegawaian',
      'Jenis PTK',
      'Pangkat/Golongan',
      'Jenjang',
      'Jurusan/Prodi',
      'Sertifikasi',
      'TMT Pengangkatan',
      'SK Pengangkatan',
      'Lembaga Pengangkat',
      'Sumber Gaji',
      'Mengajar',
      'JJM',
      'Tugas Tambahan',
      'Jam Tugas Tambahan',
      'No HP',
      'Email',
      'Alamat Jalan',
      'Desa/Kelurahan',
      'Kecamatan',
    ],
  ];

  const dataRows = orderedTeachers.map((t, i) => [
    i + 1,
    t.nama,
    t.nuptk || '-',
    t.jenisKelamin,
    t.tempatLahir || '-',
    t.tanggalLahir || '-',
    t.nip || '-',
    t.nik || '-',
    t.statusKepegawaian,
    t.jenisPtk || t.jabatan,
    t.pangkatGolongan || '-',
    t.jenjangPendidikan || '-',
    t.jurusanProdi || t.pendidikanTerakhir,
    t.sertifikasiPendidik || '-',
    t.tmtMulai || '-',
    t.skPengangkatan || '-',
    t.lembagaPengangkat || '-',
    t.sumberGaji || '-',
    t.mengajarMapel || '-',
    t.jamTatapMuka ?? 0,
    t.tugasTambahan || '-',
    t.jamTugasTambahan ?? 0,
    t.noHp || '-',
    t.email || '-',
    t.alamat || '-',
    t.desaKelurahan || '-',
    t.kecamatan || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...titleRows, ...dataRows]);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 5 },
    { wch: 16 },
    { wch: 13 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 10 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 26 },
    { wch: 22 },
    { wch: 14 },
    { wch: 24 },
    { wch: 6 },
    { wch: 28 },
    { wch: 8 },
    { wch: 15 },
    { wch: 26 },
    { wch: 32 },
    { wch: 16 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PTK');
  const safeName = schoolName.replace(/[^a-zA-Z0-9]+/g, '_');
  XLSX.writeFile(wb, `Data_PTK_${safeName}.xlsx`);
}
