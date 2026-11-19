import * as XLSX from 'xlsx';
import { Student } from '../types/admin';

export interface ParsedDapodikStudentWorkbook {
  sheetNames: string[];
  recommendedSheet: string;
  workbook: XLSX.WorkBook;
}

export interface ParsedDapodikStudentSheetResult {
  sheetName: string;
  headerRowIndex: number;
  detectedColumns: string[];
  students: Student[];
  skippedRows: number;
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

function parseExcelDate(val: unknown, fallback = '2015-01-01'): string {
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

  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  return fallback;
}

function mapStudentGender(raw: string): 'Laki-laki' | 'Perempuan' {
  const g = raw.toLowerCase().trim();
  if (g === 'p' || g.includes('perempuan') || g.includes('wanita')) {
    return 'Perempuan';
  }
  return 'Laki-laki';
}

function normalizeKelasLabel(rawRombel: string): string {
  const clean = rawRombel.trim();
  if (!clean) return 'I (Satu)';
  // Keep original rombel label if already clear like "Kelas 5A" or "V (Lima)", strip leading "Kelas "
  return clean.replace(/^kelas\s+/i, '').trim() || clean;
}

export async function readDapodikStudentExcelFile(
  file: File
): Promise<ParsedDapodikStudentWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  const recommendedSheet =
    sheetNames.find((name) => {
      const n = name.toLowerCase();
      return (
        n === 'pd' ||
        n.includes('peserta didik') ||
        n.includes('siswa') ||
        n.includes('daftar pd')
      );
    }) || sheetNames[0];

  return {
    sheetNames,
    recommendedSheet,
    workbook,
  };
}

export function parseDapodikStudentSheet(
  workbook: XLSX.WorkBook,
  sheetName: string
): ParsedDapodikStudentSheetResult {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      sheetName,
      headerRowIndex: 0,
      detectedColumns: [],
      students: [],
      skippedRows: 0,
    };
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
  });

  // Auto-detect main column header row within top 20 rows
  let headerRowIndex = 0;
  let bestScore = -1;

  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const normalized = row.map(normalizeHeader);
    let score = 0;
    if (
      normalized.some(
        (c) =>
          c === 'nama' ||
          c.includes('nama siswa') ||
          c.includes('nama peserta didik') ||
          c.includes('nama lengkap')
      )
    ) {
      score += 4;
    }
    if (normalized.some((c) => c === 'nisn' || c.includes('nisn'))) score += 4;
    if (normalized.some((c) => c === 'nipd' || c === 'nis')) score += 3;
    if (normalized.some((c) => c === 'jk' || c.includes('jenis kelamin'))) score += 2;
    if (normalized.some((c) => c.includes('tempat lahir'))) score += 2;
    if (normalized.some((c) => c.includes('tanggal lahir'))) score += 2;
    if (normalized.some((c) => c.includes('rombel'))) score += 3;
    if (normalized.some((c) => c.includes('no. registrasi akta') || c.includes('no. kk'))) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  const rawHeaders = (rows[headerRowIndex] || []).map(normalizeHeader);

  // Build parent-group map from the row immediately above headerRowIndex
  // (Dapodik exports stack "Data Ayah", "Data Ibu", "Data Wali" above "Nama", "Tahun Lahir", "Jenjang Pendidikan", "Pekerjaan", "Penghasilan", "NIK")
  const parentGroups: string[] = Array(rawHeaders.length).fill('');
  if (headerRowIndex > 0) {
    const parentRow = rows[headerRowIndex - 1] || [];
    let activeGroup = '';
    for (let c = 0; c < rawHeaders.length; c++) {
      const cell = normalizeHeader(parentRow[c]);
      if (cell.includes('data ayah') || cell === 'ayah') {
        activeGroup = 'ayah';
      } else if (cell.includes('data ibu') || cell === 'ibu') {
        activeGroup = 'ibu';
      } else if (cell.includes('data wali') || cell === 'wali') {
        activeGroup = 'wali';
      } else if (
        cell &&
        !cell.includes('ayah') &&
        !cell.includes('ibu') &&
        !cell.includes('wali')
      ) {
        activeGroup = '';
      }

      // Reset activeGroup once we leave the standard 6 parent sub-columns if a non-parent header starts
      const sub = rawHeaders[c];
      if (
        activeGroup &&
        sub &&
        ![
          'nama',
          'tahun lahir',
          'jenjang pendidikan',
          'pendidikan',
          'pekerjaan',
          'penghasilan',
          'nik',
        ].some((k) => sub.includes(k))
      ) {
        activeGroup = '';
      }

      parentGroups[c] = activeGroup;
    }
  }

  const combinedHeaders = rawHeaders.map((h, idx) => {
    const grp = parentGroups[idx];
    return grp && h ? `${grp} ${h}` : h;
  });

  const detectedColumns = combinedHeaders.filter(Boolean);

  const findCol = (
    candidates: string[],
    excludeGroup?: boolean
  ): number => {
    for (const cand of candidates) {
      const idx = combinedHeaders.findIndex((h, i) => {
        if (excludeGroup && parentGroups[i]) return false;
        return h === cand;
      });
      if (idx !== -1) return idx;
    }
    for (const cand of candidates) {
      const idx = combinedHeaders.findIndex((h, i) => {
        if (excludeGroup && parentGroups[i]) return false;
        return h.includes(cand);
      });
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Student identity columns
  const colNama = findCol(
    ['nama', 'nama siswa', 'nama peserta didik', 'nama lengkap'],
    true
  );
  const colNipd = findCol(['nipd', 'nis', 'no induk'], true);
  const colNisn = findCol(['nisn'], true);
  const colNik = findCol(['nik', 'no ktp'], true);
  const colNoKk = findCol(['no. kk', 'no kk', 'nomor kk', 'kk'], true);
  const colNoAkta = findCol(
    ['no. registrasi akta lahir', 'no registrasi akta lahir', 'akta lahir', 'no akta'],
    true
  );
  const colJk = findCol(['jk', 'l/p', 'jenis kelamin'], true);
  const colTempatLahir = findCol(['tempat lahir', 'tmp lahir'], true);
  const colTanggalLahir = findCol(['tanggal lahir', 'tgl lahir'], true);
  const colAgama = findCol(['agama'], true);
  const colAnakKe = findCol(['anak ke-berapa', 'anak ke berapa', 'anak ke'], true);
  const colJmlSaudara = findCol(
    ['jml. saudara kandung', 'jumlah saudara kandung', 'jumlah saudara'],
    true
  );
  const colRombel = findCol(
    ['rombel saat ini', 'rombel', 'kelas', 'tingkat'],
    true
  );
  const colSekolahAsal = findCol(['sekolah asal', 'asal sekolah'], true);
  const colJenisTinggal = findCol(['jenis tinggal'], true);
  const colTransportasi = findCol(['alat transportasi', 'transportasi'], true);
  const colHp = findCol(['hp', 'no hp', 'no. hp', 'telepon'], true);
  const colEmail = findCol(['e-mail', 'email', 'surel'], true);
  const colAlamat = findCol(['alamat', 'alamat jalan', 'alamat tinggal'], true);
  const colRt = findCol(['rt'], true);
  const colRw = findCol(['rw'], true);
  const colDusun = findCol(['dusun', 'nama dusun'], true);
  const colKelurahan = findCol(['kelurahan', 'desa/kelurahan', 'desa'], true);
  const colKecamatan = findCol(['kecamatan'], true);
  const colKodePos = findCol(['kode pos'], true);
  const colPenerimaKps = findCol(['penerima kps'], true);
  const colNoKps = findCol(['no. kps', 'no kps', 'nomor kps'], true);
  const colPenerimaKip = findCol(['penerima kip'], true);
  const colNoKip = findCol(['nomor kip', 'no. kip', 'no kip'], true);

  // Ayah columns (grouped or flat)
  const colNamaAyah = findCol(['ayah nama', 'nama ayah', 'ayah']);
  const colTahunAyah = findCol(['ayah tahun lahir', 'tahun lahir ayah']);
  const colPendAyah = findCol([
    'ayah jenjang pendidikan',
    'ayah pendidikan',
    'pendidikan ayah',
  ]);
  const colKerjaAyah = findCol(['ayah pekerjaan', 'pekerjaan ayah']);
  const colGajiAyah = findCol(['ayah penghasilan', 'penghasilan ayah']);
  const colNikAyah = findCol(['ayah nik', 'nik ayah']);

  // Ibu columns (grouped or flat)
  const colNamaIbu = findCol(['ibu nama', 'nama ibu', 'nama ibu kandung']);
  const colTahunIbu = findCol(['ibu tahun lahir', 'tahun lahir ibu']);
  const colPendIbu = findCol([
    'ibu jenjang pendidikan',
    'ibu pendidikan',
    'pendidikan ibu',
  ]);
  const colKerjaIbu = findCol(['ibu pekerjaan', 'pekerjaan ibu']);
  const colGajiIbu = findCol(['ibu penghasilan', 'penghasilan ibu']);
  const colNikIbu = findCol(['ibu nik', 'nik ibu']);

  // Wali columns (grouped or flat)
  const colNamaWali = findCol(['wali nama', 'nama wali']);
  const colPendWali = findCol([
    'wali jenjang pendidikan',
    'wali pendidikan',
    'pendidikan wali',
  ]);
  const colKerjaWali = findCol(['wali pekerjaan', 'pekerjaan wali']);
  const colGajiWali = findCol(['wali penghasilan', 'penghasilan wali']);
  const colNikWali = findCol(['wali nik', 'nik wali']);

  const students: Student[] = [];
  let skippedRows = 0;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const nama = colNama !== -1 ? cleanStr(row[colNama]) : '';
    if (!nama) continue;

    const lower = nama.toLowerCase();
    if (
      lower === 'nama' ||
      lower.startsWith('jumlah') ||
      lower.startsWith('total') ||
      lower.startsWith('sumber:')
    ) {
      skippedRows++;
      continue;
    }

    const alamat = colAlamat !== -1 ? cleanStr(row[colAlamat]) : '';
    const rt = colRt !== -1 ? cleanStr(row[colRt]) : '';
    const rw = colRw !== -1 ? cleanStr(row[colRw]) : '';
    const dusun = colDusun !== -1 ? cleanStr(row[colDusun]) : '';
    const desa = colKelurahan !== -1 ? cleanStr(row[colKelurahan]) : '';
    const kec = colKecamatan !== -1 ? cleanStr(row[colKecamatan]) : '';
    const kodePos = colKodePos !== -1 ? cleanStr(row[colKodePos]) : '';

    const addressParts = [
      alamat,
      rt || rw ? `RT ${rt || '00'}/RW ${rw || '00'}` : '',
      dusun,
      desa,
      kec ? `Kec. ${kec}` : '',
    ].filter(Boolean);

    const rawRombel = colRombel !== -1 ? cleanStr(row[colRombel], 'I') : 'I';
    const namaAyah = colNamaAyah !== -1 ? cleanStr(row[colNamaAyah], '-') : '-';
    const namaIbu = colNamaIbu !== -1 ? cleanStr(row[colNamaIbu], '-') : '-';
    const kerjaAyah =
      colKerjaAyah !== -1 ? cleanStr(row[colKerjaAyah], '') : '';
    const kerjaIbu = colKerjaIbu !== -1 ? cleanStr(row[colKerjaIbu], '') : '';
    const kerjaWali =
      colKerjaWali !== -1 ? cleanStr(row[colKerjaWali], '') : '';

    students.push({
      id: `sis-imp-${Date.now()}-${r}`,
      nama,
      nis: colNipd !== -1 ? cleanStr(row[colNipd], '-') : '-',
      nisn: colNisn !== -1 ? cleanStr(row[colNisn], '-') : '-',
      nik: colNik !== -1 ? cleanStr(row[colNik], '-') : '-',
      tempatLahir:
        colTempatLahir !== -1 ? cleanStr(row[colTempatLahir], '-') : '-',
      tanggalLahir:
        colTanggalLahir !== -1
          ? parseExcelDate(row[colTanggalLahir], '2015-01-01')
          : '2015-01-01',
      jenisKelamin: colJk !== -1 ? mapStudentGender(cleanStr(row[colJk], 'L')) : 'Laki-laki',
      agama: colAgama !== -1 ? cleanStr(row[colAgama], 'Islam') : 'Islam',
      kelas: normalizeKelasLabel(rawRombel),
      rombel: rawRombel || undefined,
      namaAyah,
      namaIbu,
      pekerjaanOrtu: kerjaAyah || kerjaIbu || kerjaWali || '-',
      alamatOrtu: addressParts.join(', ') || '-',
      noKk: colNoKk !== -1 ? cleanStr(row[colNoKk], '') || undefined : undefined,
      noAktaLahir:
        colNoAkta !== -1 ? cleanStr(row[colNoAkta], '') || undefined : undefined,
      anakKe:
        colAnakKe !== -1 ? cleanStr(row[colAnakKe], '') || undefined : undefined,
      jumlahSaudara:
        colJmlSaudara !== -1
          ? cleanStr(row[colJmlSaudara], '') || undefined
          : undefined,
      sekolahAsal:
        colSekolahAsal !== -1
          ? cleanStr(row[colSekolahAsal], '') || undefined
          : undefined,
      jenisTinggal:
        colJenisTinggal !== -1
          ? cleanStr(row[colJenisTinggal], '') || undefined
          : undefined,
      alatTransportasi:
        colTransportasi !== -1
          ? cleanStr(row[colTransportasi], '') || undefined
          : undefined,
      noHp: colHp !== -1 ? cleanStr(row[colHp], '') || undefined : undefined,
      email: colEmail !== -1 ? cleanStr(row[colEmail], '') || undefined : undefined,
      rt: rt || undefined,
      rw: rw || undefined,
      dusun: dusun || undefined,
      desaKelurahan: desa || undefined,
      kecamatan: kec || undefined,
      kodePos: kodePos || undefined,
      penerimaKps:
        colPenerimaKps !== -1
          ? cleanStr(row[colPenerimaKps], '') || undefined
          : undefined,
      noKps:
        colNoKps !== -1 ? cleanStr(row[colNoKps], '') || undefined : undefined,
      penerimaKip:
        colPenerimaKip !== -1
          ? cleanStr(row[colPenerimaKip], '') || undefined
          : undefined,
      noKip:
        colNoKip !== -1 ? cleanStr(row[colNoKip], '') || undefined : undefined,
      nikAyah:
        colNikAyah !== -1
          ? cleanStr(row[colNikAyah], '') || undefined
          : undefined,
      tahunLahirAyah:
        colTahunAyah !== -1
          ? cleanStr(row[colTahunAyah], '') || undefined
          : undefined,
      pendidikanAyah:
        colPendAyah !== -1
          ? cleanStr(row[colPendAyah], '') || undefined
          : undefined,
      pekerjaanAyah: kerjaAyah || undefined,
      penghasilanAyah:
        colGajiAyah !== -1
          ? cleanStr(row[colGajiAyah], '') || undefined
          : undefined,
      nikIbu:
        colNikIbu !== -1 ? cleanStr(row[colNikIbu], '') || undefined : undefined,
      tahunLahirIbu:
        colTahunIbu !== -1
          ? cleanStr(row[colTahunIbu], '') || undefined
          : undefined,
      pendidikanIbu:
        colPendIbu !== -1
          ? cleanStr(row[colPendIbu], '') || undefined
          : undefined,
      pekerjaanIbu: kerjaIbu || undefined,
      penghasilanIbu:
        colGajiIbu !== -1
          ? cleanStr(row[colGajiIbu], '') || undefined
          : undefined,
      namaWali:
        colNamaWali !== -1
          ? cleanStr(row[colNamaWali], '') || undefined
          : undefined,
      nikWali:
        colNikWali !== -1
          ? cleanStr(row[colNikWali], '') || undefined
          : undefined,
      pendidikanWali:
        colPendWali !== -1
          ? cleanStr(row[colPendWali], '') || undefined
          : undefined,
      pekerjaanWali: kerjaWali || undefined,
      penghasilanWali:
        colGajiWali !== -1
          ? cleanStr(row[colGajiWali], '') || undefined
          : undefined,
    });
  }

  return {
    sheetName,
    headerRowIndex,
    detectedColumns,
    students,
    skippedRows,
  };
}

export function exportStudentsToDapodikExcel(
  students: Student[],
  schoolName: string
): void {
  const titleRows = [
    ['DAFTAR PESERTA DIDIK (PD)'],
    [`Sekolah : ${schoolName}`],
    [`Tanggal Ekspor : ${new Date().toLocaleDateString('id-ID')}`],
    [],
    [
      'No',
      'Nama',
      'NIPD',
      'JK',
      'NISN',
      'Tempat Lahir',
      'Tanggal Lahir',
      'NIK',
      'No. KK',
      'No. Registrasi Akta Lahir',
      'Agama',
      'Alamat',
      'RT',
      'RW',
      'Dusun',
      'Desa/Kelurahan',
      'Kecamatan',
      'Kode Pos',
      'Jenis Tinggal',
      'Alat Transportasi',
      'HP',
      'E-Mail',
      'Rombel Saat Ini',
      'Penerima KPS',
      'No. KPS',
      'Penerima KIP',
      'Nomor KIP',
      'Nama Ayah',
      'NIK Ayah',
      'Pendidikan Ayah',
      'Pekerjaan Ayah',
      'Penghasilan Ayah',
      'Nama Ibu',
      'NIK Ibu',
      'Pendidikan Ibu',
      'Pekerjaan Ibu',
      'Penghasilan Ibu',
      'Nama Wali',
      'Pekerjaan Wali',
    ],
  ];

  const dataRows = students.map((s, i) => [
    i + 1,
    s.nama,
    s.nis || '-',
    s.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
    s.nisn || '-',
    s.tempatLahir || '-',
    s.tanggalLahir || '-',
    s.nik || '-',
    s.noKk || '-',
    s.noAktaLahir || '-',
    s.agama || 'Islam',
    s.alamatOrtu || '-',
    s.rt || '-',
    s.rw || '-',
    s.dusun || '-',
    s.desaKelurahan || '-',
    s.kecamatan || '-',
    s.kodePos || '-',
    s.jenisTinggal || '-',
    s.alatTransportasi || '-',
    s.noHp || '-',
    s.email || '-',
    s.rombel || s.kelas,
    s.penerimaKps || '-',
    s.noKps || '-',
    s.penerimaKip || '-',
    s.noKip || '-',
    s.namaAyah || '-',
    s.nikAyah || '-',
    s.pendidikanAyah || '-',
    s.pekerjaanAyah || s.pekerjaanOrtu || '-',
    s.penghasilanAyah || '-',
    s.namaIbu || '-',
    s.nikIbu || '-',
    s.pendidikanIbu || '-',
    s.pekerjaanIbu || '-',
    s.penghasilanIbu || '-',
    s.namaWali || '-',
    s.pekerjaanWali || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...titleRows, ...dataRows]);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 12 },
    { wch: 5 },
    { wch: 14 },
    { wch: 16 },
    { wch: 13 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 10 },
    { wch: 30 },
    { wch: 5 },
    { wch: 5 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Peserta Didik');
  const safeName = schoolName.replace(/[^a-zA-Z0-9]+/g, '_');
  XLSX.writeFile(wb, `Data_Siswa_Dapodik_${safeName}.xlsx`);
}
