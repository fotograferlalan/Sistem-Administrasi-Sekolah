import React from 'react';
import {
  DocumentFormData,
  DocumentType,
  PaperSize,
  SchoolProfile,
} from '../types/admin';
import { formatTanggalIndonesia } from '../utils/formatters';

interface LetterPreviewProps {
  docType: DocumentType;
  school: SchoolProfile;
  data: DocumentFormData;
  paperSize: PaperSize;
  previewId?: string;
}

function DaerahEmblem({ school }: { school: SchoolProfile }) {
  if (school.logoDaerahDataUrl) {
    return (
      <img
        src={school.logoDaerahDataUrl}
        alt="Lambang Daerah / Segel Resmi"
        referrerPolicy="no-referrer"
        width={66}
        height={66}
        className="w-[66px] h-[66px] object-contain mx-auto"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      className="w-[64px] h-[64px] mx-auto text-black"
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
  );
}

function PendidikanEmblem({ school }: { school: SchoolProfile }) {
  if (school.logoPendidikanDataUrl) {
    return (
      <img
        src={school.logoPendidikanDataUrl}
        alt="Logo Pendidikan Dasar"
        referrerPolicy="no-referrer"
        width={66}
        height={66}
        className="w-[66px] h-[66px] object-contain mx-auto"
      />
    );
  }

  if (school.customLogoDataUrl) {
    return (
      <img
        src={school.customLogoDataUrl}
        alt="Logo Pendidikan Dasar"
        referrerPolicy="no-referrer"
        width={66}
        height={66}
        className="w-[66px] h-[66px] object-contain mx-auto"
      />
    );
  }

  // Tut Wuri Handayani institutional crest (monochrome for official letterheads)
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      className="w-[64px] h-[64px] mx-auto text-black"
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
      <path d="M28 59H52" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function KopSurat({ school }: { school: SchoolProfile }) {
  return (
    <div
      className="kop-border pb-2.5 mb-4"
      style={{ borderBottom: '3px double #000000' }}
    >
      <table className="w-full border-collapse">
        <tbody>
          <tr className="align-middle">
            <td className="w-[74px] text-center align-middle p-0">
              <DaerahEmblem school={school} />
            </td>
            <td className="text-center align-middle leading-tight px-2">
              <p className="text-[12pt] font-semibold uppercase tracking-wide">
                {school.statusSekolah === 'Swasta' && school.namaYayasan
                  ? school.namaYayasan
                  : school.pemerintahDaerah}
              </p>
              <p className="text-[11.5pt] font-semibold uppercase tracking-wide">
                {school.dinasPendidikan}
              </p>
              <p className="text-[15pt] font-bold uppercase tracking-wide mt-0.5">
                {school.namaSekolah}
              </p>
              <p className="text-[9.5pt] mt-0.5">
                {school.alamat}, Kec. {school.kecamatan}, {school.kabupatenKota}{' '}
                {school.kodePos}
              </p>
              <p className="text-[9pt]">
                Telp. {school.telepon} · Email: {school.email} · NPSN:{' '}
                {school.npsn}
              </p>
            </td>
            <td className="w-[74px] text-center align-middle p-0">
              <PendidikanEmblem school={school} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SignatureBlock({
  school,
  data,
  showPengawas = false,
}: {
  school: SchoolProfile;
  data: DocumentFormData;
  showPengawas?: boolean;
}) {
  const formattedDate = formatTanggalIndonesia(data.tanggalSurat);
  return (
    <div className="mt-7 flex justify-between items-start gap-6 text-[11pt]">
      {showPengawas ? (
        <div className="w-[46%]">
          <p>Mengetahui,</p>
          <p>Pengawas Sekolah / Dinas Pendidikan</p>
          <p>Kecamatan {school.kecamatan}</p>
          <div className="h-[62px]" />
          <p className="font-bold underline">{data.namaPengawasDinas}</p>
          <p>NIP. {data.nipPengawasDinas}</p>
        </div>
      ) : (
        <div className="w-[44%]">
          {data.tembusan &&
            (data.skTentang || '').length > 0 &&
            data.tembusan.trim() !== '-' && (
              <div className="text-[9.5pt] leading-snug mt-4">
                <p className="font-bold underline mb-1">Tembusan Yth.:</p>
                {data.tembusan.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            )}
        </div>
      )}

      <div className="w-[46%] ml-auto relative">
        <p>
          {data.tempatSurat || school.kabupatenKota}, {formattedDate}
        </p>
        <p>{data.penandatanganJabatan},</p>

        <div className="h-[64px] relative flex items-center">
          {data.tampilkanStempel && (
            <div
              className="w-[58px] h-[58px] rounded-full border border-dashed border-slate-400/70 flex items-center justify-center text-[7.5pt] text-slate-400 text-center leading-tight -ml-6 select-none print:hidden"
              title="Area Stempel Sekolah"
            >
              Stempel
              <br />
              Sekolah
            </div>
          )}
        </div>

        <p className="font-bold underline">{data.penandatanganNama}</p>
        {data.penandatanganNip && data.penandatanganNip !== '-' && (
          <p>NIP. {data.penandatanganNip}</p>
        )}
      </div>
    </div>
  );
}

function MultilineText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => (
        <p key={i} className="text-justify">
          {line}
        </p>
      ))}
    </div>
  );
}

function BiodataRows({
  rows,
}: {
  rows: Array<{ label: string; value: string; bold?: boolean }>;
}) {
  return (
    <table className="w-full text-[11pt] my-2.5">
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="align-top">
            <td className="w-[185px] py-[2px] pl-5">{row.label}</td>
            <td className="w-[14px] py-[2px] text-center">:</td>
            <td className={`py-[2px] ${row.bold ? 'font-bold' : ''}`}>
              {row.value || '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const LetterPreview: React.FC<LetterPreviewProps> = ({
  docType,
  school,
  data,
  paperSize,
  previewId = 'official-letter-paper',
}) => {
  const sheetDimensions =
    paperSize === 'F4'
      ? 'w-[215mm] min-h-[330mm]'
      : 'w-[210mm] min-h-[297mm]';

  const totalJtm = data.lampiranTugasRows.reduce(
    (sum, r) => sum + (Number(r.jamTatapMuka) || 0),
    0
  );

  const avgSkl =
    data.sklNilaiRows.length > 0
      ? (
          data.sklNilaiRows.reduce((sum, r) => sum + (Number(r.nilai) || 0), 0) /
          data.sklNilaiRows.length
        ).toFixed(2)
      : '0.00';

  return (
    <div
      id={previewId}
      className={`paper-sheet ${sheetDimensions} mx-auto bg-white shadow-sm border border-slate-200 px-[18mm] py-[14mm] text-[11pt]`}
    >
      {/* PAGE 1 */}
      <KopSurat school={school} />

      {/* 1. SK PENGANGKATAN GURU */}
      {docType === 'sk_pengangkatan_guru' && (
        <div>
          <div className="text-center font-bold leading-snug mb-4">
            <p className="uppercase">
              KEPUTUSAN{' '}
              {data.skPenerbit === 'Ketua Yayasan'
                ? `KETUA ${school.namaYayasan}`
                : `KEPALA ${school.namaSekolah}`}
            </p>
            <p className="font-normal">NOMOR : {data.nomorSurat}</p>
            <p className="mt-2.5">TENTANG</p>
            <p className="uppercase mt-0.5">{data.skTentang}</p>
            <p className="mt-3 uppercase">
              {data.skPenerbit === 'Ketua Yayasan'
                ? `KETUA ${school.namaYayasan},`
                : `KEPALA ${school.namaSekolah},`}
            </p>
          </div>

          <table className="w-full text-[10.5pt] leading-snug mb-3">
            <tbody>
              <tr className="align-top">
                <td className="w-[105px] font-bold py-1">Menimbang</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1">
                  <MultilineText text={data.menimbangPoin} />
                </td>
              </tr>
              <tr className="align-top">
                <td className="w-[105px] font-bold py-1">Mengingat</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1">
                  <MultilineText text={data.mengingatPoin} />
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-center font-bold tracking-wider my-3">
            M E M U T U S K A N
          </p>

          <table className="w-full text-[10.5pt] leading-snug">
            <tbody>
              <tr className="align-top">
                <td className="w-[105px] font-bold py-1">Menetapkan</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1 font-bold uppercase">
                  {data.skTentang}
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1.5">KESATU</td>
                <td className="py-1.5 text-center">:</td>
                <td className="py-1.5 text-justify">
                  Mengangkat saudara yang identitasnya tersebut di bawah ini:
                  <table className="w-full my-1.5 ml-2">
                    <tbody>
                      <tr>
                        <td className="w-[175px] py-[1px]">Nama Lengkap</td>
                        <td className="w-[12px]">:</td>
                        <td className="font-bold">{data.guruNama}</td>
                      </tr>
                      <tr>
                        <td className="py-[1px]">Tempat, Tanggal Lahir</td>
                        <td>:</td>
                        <td>{data.guruTempatTanggalLahir}</td>
                      </tr>
                      <tr>
                        <td className="py-[1px]">NIK / NUPTK</td>
                        <td>:</td>
                        <td>{data.guruNikNuptk}</td>
                      </tr>
                      <tr>
                        <td className="py-[1px]">Pendidikan Terakhir</td>
                        <td>:</td>
                        <td>{data.guruPendidikan}</td>
                      </tr>
                      <tr>
                        <td className="py-[1px]">Alamat</td>
                        <td>:</td>
                        <td>{data.guruAlamat}</td>
                      </tr>
                      <tr>
                        <td className="py-[1px]">Diangkat Sebagai</td>
                        <td>:</td>
                        <td className="font-bold">
                          {data.jabatanDiangkat} ({data.statusPengangkatan})
                        </td>
                      </tr>
                      <tr>
                        <td className="py-[1px]">Unit Kerja</td>
                        <td>:</td>
                        <td>{data.unitKerja || school.namaSekolah}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1">KEDUA</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  Pengangkatan ini terhitung mulai tanggal{' '}
                  <strong>{formatTanggalIndonesia(data.tmtPengangkatan)}</strong>{' '}
                  sampai dengan <strong>{data.berlakuSampai}</strong>, dan yang
                  bersangkutan wajib melaksanakan tugas pembelajaran, administrasi
                  kelas, serta tata tertib pendidik dengan penuh tanggung jawab.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1">KETIGA</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  Kepada yang bersangkutan diberikan honorarium sebesar{' '}
                  <strong>{data.honorarium}</strong> yang dibebankan pada{' '}
                  {data.sumberDana}.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1">KEEMPAT</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan
                  apabila di kemudian hari terdapat kekeliruan akan diadakan
                  perbaikan sebagaimana mestinya.
                </td>
              </tr>
            </tbody>
          </table>

          <SignatureBlock school={school} data={data} />
        </div>
      )}

      {/* 2. SK PEMBAGIAN TUGAS MENGAJAR */}
      {docType === 'sk_pembagian_tugas' && (
        <div>
          <div className="text-center font-bold leading-snug mb-4">
            <p className="uppercase">KEPUTUSAN KEPALA {school.namaSekolah}</p>
            <p className="font-normal">NOMOR : {data.nomorSurat}</p>
            <p className="mt-2.5">TENTANG</p>
            <p className="uppercase mt-0.5">
              PEMBAGIAN TUGAS GURU DALAM KEGIATAN PROSES BELAJAR MENGAJAR
              <br />
              SEMESTER {data.pembagianSemester.toUpperCase()} TAHUN PELAJARAN{' '}
              {data.pembagianTahunPelajaran}
            </p>
            <p className="mt-3 uppercase">KEPALA {school.namaSekolah},</p>
          </div>

          <table className="w-full text-[10.5pt] leading-snug mb-3">
            <tbody>
              <tr className="align-top">
                <td className="w-[105px] font-bold py-1">Menimbang</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1">
                  <MultilineText text={data.menimbangPoin} />
                </td>
              </tr>
              <tr className="align-top">
                <td className="w-[105px] font-bold py-1">Mengingat</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1">
                  <MultilineText text={data.mengingatPoin} />
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-center font-bold tracking-wider my-3">
            M E M U T U S K A N
          </p>

          <table className="w-full text-[10.5pt] leading-snug">
            <tbody>
              <tr className="align-top">
                <td className="w-[105px] font-bold py-1">Menetapkan</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1 font-bold uppercase">
                  KEPUTUSAN KEPALA {school.namaSekolah} TENTANG PEMBAGIAN TUGAS
                  GURU SEMESTER {data.pembagianSemester.toUpperCase()} TAHUN
                  PELAJARAN {data.pembagianTahunPelajaran}
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1.5">KESATU</td>
                <td className="py-1.5 text-center">:</td>
                <td className="py-1.5 text-justify">
                  Pembagian tugas guru dalam kegiatan proses belajar mengajar,
                  bimbingan, dan tugas tambahan Semester {data.pembagianSemester}{' '}
                  Tahun Pelajaran {data.pembagianTahunPelajaran} sebagaimana
                  tercantum dalam Lampiran I keputusan ini.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1">KEDUA</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  Masing-masing guru wajib menyusun perangkat pembelajaran,
                  melaksanakan proses pembelajaran sesuai beban jam tatap muka,
                  dan melaporkan pelaksanaannya secara berkala kepada Kepala
                  Sekolah.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1">KETIGA</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  Segala biaya yang timbul akibat pelaksanaan keputusan ini
                  dibebankan pada anggaran sekolah yang sesuai.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold py-1">KEEMPAT</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-justify">
                  Keputusan ini mulai berlaku sejak tanggal{' '}
                  <strong>
                    {formatTanggalIndonesia(data.tanggalBerlakuTugas)}
                  </strong>{' '}
                  dengan ketentuan apabila di kemudian hari terdapat kekeliruan
                  akan diadakan perbaikan sebagaimana mestinya.
                </td>
              </tr>
            </tbody>
          </table>

          <SignatureBlock school={school} data={data} />

          {/* PAGE 2: LAMPIRAN PEMBAGIAN TUGAS */}
          <div className="page-break-before pt-6 mt-10 border-t border-dashed border-slate-300 print:border-none print:mt-0 print:pt-0">
            <div className="text-[10pt] mb-4 flex justify-end">
              <table className="w-[56%]">
                <tbody>
                  <tr>
                    <td className="w-[75px] font-bold">Lampiran I</td>
                    <td className="w-[10px]">:</td>
                    <td>Keputusan Kepala {school.namaSekolah}</td>
                  </tr>
                  <tr>
                    <td>Nomor</td>
                    <td>:</td>
                    <td>{data.nomorSurat}</td>
                  </tr>
                  <tr>
                    <td>Tanggal</td>
                    <td>:</td>
                    <td>{formatTanggalIndonesia(data.tanggalSurat)}</td>
                  </tr>
                  <tr className="align-top">
                    <td>Tentang</td>
                    <td>:</td>
                    <td>
                      Pembagian Tugas Guru Semester {data.pembagianSemester} TP{' '}
                      {data.pembagianTahunPelajaran}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-center font-bold uppercase text-[11pt] mb-3">
              DAFTAR PEMBAGIAN TUGAS MENGAJAR &amp; TUGAS TAMBAHAN GURU
              <br />
              {school.namaSekolah} · TAHUN PELAJARAN{' '}
              {data.pembagianTahunPelajaran}
            </p>

            <table className="doc-table w-full text-[9.5pt] border border-black">
              <thead>
                <tr className="bg-slate-100 print:bg-transparent font-bold text-center">
                  <th className="border border-black px-1.5 py-1.5 w-[28px]">
                    No
                  </th>
                  <th className="border border-black px-2 py-1.5 text-left">
                    Nama Lengkap / NIP
                  </th>
                  <th className="border border-black px-1.5 py-1.5 w-[88px]">
                    Pangkat / Gol
                  </th>
                  <th className="border border-black px-1.5 py-1.5 w-[55px]">
                    Status
                  </th>
                  <th className="border border-black px-2 py-1.5 text-left">
                    Jabatan &amp; Kelas Ampu
                  </th>
                  <th className="border border-black px-1.5 py-1.5 w-[44px]">
                    JTM
                  </th>
                  <th className="border border-black px-2 py-1.5 text-left">
                    Tugas Tambahan
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.lampiranTugasRows.map((row, idx) => (
                  <tr key={row.id} className="align-top">
                    <td className="border border-black px-1.5 py-1 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2 py-1">
                      <div className="font-bold">{row.namaGuru}</div>
                      {row.nip && row.nip !== '-' && (
                        <div className="text-[8.5pt]">NIP. {row.nip}</div>
                      )}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {row.pangkatGol || '-'}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {row.status}
                    </td>
                    <td className="border border-black px-2 py-1">
                      <div>{row.jabatanGuru}</div>
                      {row.kelasAmpu && row.kelasAmpu !== '-' && (
                        <div className="text-[8.5pt]">
                          {row.status === 'Tendik' ||
                          row.kelasAmpu === 'Administrasi' ||
                          row.kelasAmpu.length > 18 ||
                          row.kelasAmpu.toLowerCase().startsWith('kelas')
                            ? row.kelasAmpu
                            : `Kelas ${row.kelasAmpu}`}
                        </div>
                      )}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center font-bold">
                      {row.jamTatapMuka}
                    </td>
                    <td className="border border-black px-2 py-1">
                      {row.tugasTambahan || '-'}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td
                    colSpan={5}
                    className="border border-black px-2 py-1.5 text-right"
                  >
                    Jumlah Total Jam Tatap Muka (JTM) / Minggu
                  </td>
                  <td className="border border-black px-1.5 py-1.5 text-center">
                    {totalJtm}
                  </td>
                  <td className="border border-black px-2 py-1.5" />
                </tr>
              </tbody>
            </table>

            <SignatureBlock
              school={school}
              data={{ ...data, tembusan: '' }}
            />
          </div>
        </div>
      )}

      {/* 3. SURAT MUTASI SISWA */}
      {docType === 'surat_mutasi' && (
        <div>
          <div className="text-center mb-5">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT KETERANGAN MUTASI SISWA
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala {school.namaSekolah},
            Kecamatan {school.kecamatan}, {school.kabupatenKota}, menerangkan
            dengan sesungguhnya bahwa peserta didik berikut:
          </p>

          <BiodataRows
            rows={[
              { label: 'Nama Lengkap', value: data.siswaNama, bold: true },
              {
                label: 'NIS / NISN',
                value: `${data.siswaNis} / ${data.siswaNisn}`,
              },
              { label: 'NIK', value: data.siswaNik },
              {
                label: 'Tempat, Tanggal Lahir',
                value: data.siswaTempatTanggalLahir,
              },
              { label: 'Jenis Kelamin', value: data.siswaJenisKelamin },
              { label: 'Agama', value: data.siswaAgama },
              { label: 'Kelas', value: data.siswaKelas },
              { label: 'Nama Orang Tua / Wali', value: data.ortuNama },
              { label: 'Pekerjaan Orang Tua', value: data.ortuPekerjaan },
              { label: 'Alamat', value: data.ortuAlamat },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            Berdasarkan permohonan orang tua/wali murid dan verifikasi
            administrasi sekolah, peserta didik tersebut telah mengajukan mutasi
            keluar mulai tanggal{' '}
            <strong>{formatTanggalIndonesia(data.tanggalEfektifPindah)}</strong>{' '}
            dengan rincian sebagai berikut:
          </p>

          <BiodataRows
            rows={[
              { label: 'Sekolah Tujuan', value: data.sekolahTujuan, bold: true },
              { label: 'Alamat Sekolah Tujuan', value: data.alamatSekolahTujuan },
              { label: 'Alasan Mutasi', value: data.alasanPindah },
              { label: 'Catatan Kelakuan', value: data.catatanKelakuan },
              { label: 'Status Data Dapodik', value: data.statusDapodik },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            Demikian Surat Keterangan Mutasi Siswa ini dibuat dengan sebenarnya
            untuk dapat dipergunakan sebagaimana mestinya.
          </p>

          <SignatureBlock
            school={school}
            data={{ ...data, tembusan: '' }}
            showPengawas={data.sertakanKolomPengawas}
          />
        </div>
      )}

      {/* 4. SURAT SIAP TERIMA SISWA */}
      {docType === 'surat_siap_terima' && (
        <div>
          <div className="text-center mb-5">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT KETERANGAN SIAP MENERIMA SISWA
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala {school.namaSekolah} (NPSN:{' '}
            {school.npsn}), Kecamatan {school.kecamatan}, {school.kabupatenKota},
            menerangkan bahwa sehubungan dengan permohonan mutasi masuk peserta
            didik:
          </p>

          <BiodataRows
            rows={[
              { label: 'Nama Calon Siswa', value: data.siswaNama, bold: true },
              { label: 'NISN', value: data.siswaNisn },
              {
                label: 'Tempat, Tanggal Lahir',
                value: data.siswaTempatTanggalLahir,
              },
              { label: 'Jenis Kelamin', value: data.siswaJenisKelamin },
              { label: 'Sekolah Asal', value: data.sekolahAsal, bold: true },
              { label: 'Alamat Sekolah Asal', value: data.alamatSekolahAsal },
              { label: 'Nama Orang Tua / Wali', value: data.ortuNama },
              { label: 'Alamat Orang Tua', value: data.ortuAlamat },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            Setelah memperhatikan daya tampung rombongan belajar pada Tahun
            Pelajaran {school.tahunPelajaran} di {school.namaSekolah} (sisa
            kuota kursi tersedia pada kelas {data.kelasDiterima} sebanyak{' '}
            <strong>{data.sisaKuotaKelas} peserta didik</strong>), maka sekolah
            kami menyatakan <strong>BERSEDIA / SIAP MENERIMA</strong> peserta
            didik tersebut pada <strong>Kelas {data.kelasDiterima}</strong>.
          </p>

          <div className="mt-3">
            <p className="font-bold mb-1">
              Adapun kelengkapan berkas yang wajib diserahkan saat daftar ulang:
            </p>
            <div className="pl-4 text-[10.5pt]">
              <MultilineText text={data.syaratBerkas} />
            </div>
          </div>

          <p className="text-justify leading-relaxed mt-4">
            Demikian surat keterangan ini dibuat untuk digunakan sebagai syarat
            pengurusan surat pindah dari sekolah asal dan mutasi Dapodik.
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}

      {/* 5. SURAT PINDAH SEKOLAH */}
      {docType === 'surat_pindah_sekolah' && (
        <div>
          <div className="text-center mb-5">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT KETERANGAN PINDAH SEKOLAH
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala {school.namaSekolah},
            Kecamatan {school.kecamatan}, {school.kabupatenKota}, menerangkan
            bahwa:
          </p>

          <BiodataRows
            rows={[
              { label: 'Nama Peserta Didik', value: data.siswaNama, bold: true },
              {
                label: 'NIS / NISN',
                value: `${data.siswaNis} / ${data.siswaNisn}`,
              },
              {
                label: 'Tempat, Tanggal Lahir',
                value: data.siswaTempatTanggalLahir,
              },
              { label: 'Jenis Kelamin', value: data.siswaJenisKelamin },
              { label: 'Kelas yang Ditinggalkan', value: data.siswaKelas },
              { label: 'Nama Orang Tua / Wali', value: data.ortuNama },
              { label: 'Pekerjaan Orang Tua', value: data.ortuPekerjaan },
              { label: 'Alamat Orang Tua', value: data.ortuAlamat },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            Sesuai permohonan orang tua/wali peserta didik yang bersangkutan,
            terhitung mulai tanggal{' '}
            <strong>{formatTanggalIndonesia(data.tanggalEfektifPindah)}</strong>{' '}
            peserta didik tersebut dinyatakan pindah sekolah ke:
          </p>

          <BiodataRows
            rows={[
              { label: 'Sekolah Tujuan', value: data.sekolahTujuan, bold: true },
              { label: 'Alamat Sekolah Tujuan', value: data.alamatSekolahTujuan },
              { label: 'Alasan Pindah', value: data.alasanPindah },
              { label: 'Kelakuan / Kedisiplinan', value: data.catatanKelakuan },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            Bersama surat ini kami sertakan Buku Laporan Hasil Belajar (Rapor)
            asli serta status pelepasan data peserta didik pada sistem Dapodik.
            Demikian surat keterangan pindah sekolah ini dibuat agar dapat
            dipergunakan sebagaimana mestinya.
          </p>

          <SignatureBlock
            school={school}
            data={{ ...data, tembusan: '' }}
            showPengawas={data.sertakanKolomPengawas}
          />
        </div>
      )}

      {/* 6. SURAT KETERANGAN SISWA AKTIF */}
      {docType === 'surat_siswa_aktif' && (
        <div>
          <div className="text-center mb-5">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT KETERANGAN SISWA AKTIF
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala {school.namaSekolah},
            Kecamatan {school.kecamatan}, {school.kabupatenKota}, menerangkan
            dengan sesungguhnya bahwa:
          </p>

          <BiodataRows
            rows={[
              { label: 'Nama Peserta Didik', value: data.siswaNama, bold: true },
              {
                label: 'NIS / NISN',
                value: `${data.siswaNis} / ${data.siswaNisn}`,
              },
              {
                label: 'Tempat, Tanggal Lahir',
                value: data.siswaTempatTanggalLahir,
              },
              { label: 'Jenis Kelamin', value: data.siswaJenisKelamin },
              { label: 'Kelas', value: data.siswaKelas },
              { label: 'Nama Orang Tua / Wali', value: data.ortuNama },
              { label: 'Alamat', value: data.ortuAlamat },
              ...(data.nomorKipPip && data.nomorKipPip !== '-'
                ? [{ label: 'Nomor KIP / PIP', value: data.nomorKipPip }]
                : []),
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            Adalah benar-benar peserta didik yang masih aktif belajar di{' '}
            <strong>{school.namaSekolah}</strong> pada Tahun Pelajaran{' '}
            {school.tahunPelajaran}. {data.keteranganTambahan}
          </p>

          <p className="text-justify leading-relaxed mt-3">
            Surat keterangan ini diterbitkan untuk keperluan:{' '}
            <strong>{data.keperluanSurat}</strong>.
          </p>

          <p className="text-justify leading-relaxed mt-3">
            Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat
            dipergunakan sebagaimana mestinya.
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}

      {/* 7. SURAT KELAKUAN BAIK */}
      {docType === 'surat_kelakuan_baik' && (
        <div>
          <div className="text-center mb-5">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT KETERANGAN BERKELAKUAN BAIK
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala {school.namaSekolah},
            Kecamatan {school.kecamatan}, {school.kabupatenKota}, menerangkan
            bahwa:
          </p>

          <BiodataRows
            rows={[
              { label: 'Nama Peserta Didik', value: data.siswaNama, bold: true },
              {
                label: 'NIS / NISN',
                value: `${data.siswaNis} / ${data.siswaNisn}`,
              },
              {
                label: 'Tempat, Tanggal Lahir',
                value: data.siswaTempatTanggalLahir,
              },
              { label: 'Jenis Kelamin', value: data.siswaJenisKelamin },
              { label: 'Kelas', value: data.siswaKelas },
              { label: 'Nama Orang Tua / Wali', value: data.ortuNama },
              { label: 'Alamat', value: data.ortuAlamat },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            {data.keteranganTambahan}
          </p>

          <p className="text-justify leading-relaxed mt-3">
            Surat keterangan berkelakuan baik ini diberikan kepada yang
            bersangkutan untuk keperluan:{' '}
            <strong>{data.keperluanSurat}</strong>.
          </p>

          <p className="text-justify leading-relaxed mt-3">
            Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat
            dipergunakan sebagaimana mestinya.
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}

      {/* 8. SURAT TUGAS GURU & TENDIK */}
      {docType === 'surat_tugas' && (
        <div>
          <div className="text-center mb-5">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT PERINTAH TUGAS
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <table className="w-full text-[11pt] mb-3">
            <tbody>
              <tr className="align-top">
                <td className="w-[85px] font-bold py-1">Dasar</td>
                <td className="w-[14px] py-1 text-center">:</td>
                <td className="py-1 text-justify">{data.dasarPenugasan}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-center font-bold tracking-wider my-3">
            M E M E R I N T A H K A N
          </p>

          <p className="font-bold mb-2">Kepada :</p>
          <table className="doc-table w-full text-[10pt] border border-black mb-4">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent text-center font-bold">
                <th className="border border-black px-2 py-1.5 w-[32px]">No</th>
                <th className="border border-black px-2 py-1.5 text-left">
                  Nama Lengkap
                </th>
                <th className="border border-black px-2 py-1.5 text-left">
                  NIP / NUPTK
                </th>
                <th className="border border-black px-2 py-1.5 text-left">
                  Pangkat / Gol
                </th>
                <th className="border border-black px-2 py-1.5 text-left">
                  Jabatan
                </th>
              </tr>
            </thead>
            <tbody>
              {data.petugasRows.map((p, idx) => (
                <tr key={p.id}>
                  <td className="border border-black px-2 py-1 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-black px-2 py-1 font-bold">
                    {p.nama}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {p.nip || '-'}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {p.pangkatGol || '-'}
                  </td>
                  <td className="border border-black px-2 py-1">{p.jabatan}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="font-bold mb-1">Untuk :</p>
          <p className="text-justify pl-5 mb-2">
            Mengikuti kegiatan <strong>{data.namaKegiatanTugas}</strong> yang
            dilaksanakan pada:
          </p>
          <BiodataRows
            rows={[
              { label: 'Hari / Tanggal', value: data.hariTanggalTugas },
              { label: 'Waktu', value: data.waktuTugas },
              { label: 'Tempat', value: data.tempatTugas },
            ]}
          />

          <p className="text-justify leading-relaxed mt-3">
            {data.keteranganTugas}
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}

      {/* 9. SURAT UNDANGAN */}
      {docType === 'surat_undangan' && (
        <div>
          <div className="flex justify-between items-start gap-6 mb-5 text-[11pt]">
            <table>
              <tbody>
                <tr>
                  <td className="w-[82px]">Nomor</td>
                  <td className="w-[12px]">:</td>
                  <td>{data.nomorSurat}</td>
                </tr>
                <tr>
                  <td>Sifat</td>
                  <td>:</td>
                  <td>{data.sifatUndangan}</td>
                </tr>
                <tr>
                  <td>Lampiran</td>
                  <td>:</td>
                  <td>{data.lampiran || '-'}</td>
                </tr>
                <tr className="align-top">
                  <td>Perihal</td>
                  <td>:</td>
                  <td className="font-bold underline">{data.perihal}</td>
                </tr>
              </tbody>
            </table>

            <div className="w-[44%]">
              <p>
                {data.tempatSurat || school.kabupatenKota},{' '}
                {formatTanggalIndonesia(data.tanggalSurat)}
              </p>
              <p className="mt-3">Kepada Yth.</p>
              <p className="font-bold">{data.kepadaYth}</p>
              <p>di {data.diTempatUndangan}</p>
            </div>
          </div>

          <p className="mb-3">Dengan hormat,</p>
          <p className="text-justify leading-relaxed mb-2">
            {data.isiPembukaUndangan}
          </p>

          <BiodataRows
            rows={[
              { label: 'Hari / Tanggal', value: data.hariTanggalUndangan },
              { label: 'Waktu', value: data.waktuUndangan },
              { label: 'Tempat', value: data.tempatUndangan },
            ]}
          />

          <div className="my-3 pl-5">
            <p className="font-bold mb-1">Susunan Acara / Agenda:</p>
            <MultilineText text={data.acaraUndangan} />
          </div>

          <p className="text-justify leading-relaxed mt-4">
            Mengingat pentingnya acara tersebut, kami sangat mengharapkan
            kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan kerja
            sama Bapak/Ibu, kami ucapkan terima kasih.
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}

      {/* 10. SURAT KETERANGAN LULUS (SKL) SD */}
      {docType === 'surat_keterangan_lulus' && (
        <div>
          <div className="text-center mb-4">
            <p className="font-bold underline uppercase text-[12.5pt]">
              SURAT KETERANGAN LULUS
            </p>
            <p className="font-bold text-[10.5pt]">
              TAHUN PELAJARAN {data.sklTahunLulus}
            </p>
            <p>Nomor : {data.nomorSurat}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Kepala {school.namaSekolah} (NPSN: {school.npsn}), Kecamatan{' '}
            {school.kecamatan}, {school.kabupatenKota}, berdasarkan kriteria
            kelulusan peserta didik dan Rapat Pleno Dewan Guru, menerangkan
            bahwa:
          </p>

          <BiodataRows
            rows={[
              { label: 'Nama Peserta Didik', value: data.siswaNama, bold: true },
              {
                label: 'Tempat, Tanggal Lahir',
                value: data.siswaTempatTanggalLahir,
              },
              {
                label: 'NIS / NISN',
                value: `${data.siswaNis} / ${data.siswaNisn}`,
              },
              { label: 'Nama Orang Tua / Wali', value: data.ortuNama },
              {
                label: 'Nomor Ijazah Sementara',
                value: data.sklNomorIjazahSementara,
              },
            ]}
          />

          <div className="my-3 py-2 border-y-2 border-black text-center">
            <p className="text-[10.5pt]">Dinyatakan :</p>
            <p className="text-[14pt] font-bold tracking-[0.2em]">
              {data.sklStatusKelulusan}
            </p>
            <p className="text-[10pt]">
              dari Satuan Pendidikan Sekolah Dasar pada Tahun Pelajaran{' '}
              {data.sklTahunLulus} dengan capaian nilai sebagai berikut:
            </p>
          </div>

          <table className="doc-table w-full text-[10pt] border border-black mb-3">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold text-center">
                <th className="border border-black px-2 py-1 w-[36px]">No</th>
                <th className="border border-black px-2 py-1 text-left">
                  Mata Pelajaran
                </th>
                <th className="border border-black px-2 py-1 w-[95px]">
                  Nilai Akhir
                </th>
              </tr>
            </thead>
            <tbody>
              {data.sklNilaiRows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="border border-black px-2 py-1 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {row.mataPelajaran}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {Number(row.nilai).toFixed(1)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td
                  colSpan={2}
                  className="border border-black px-2 py-1 text-right"
                >
                  Rata-Rata Nilai
                </td>
                <td className="border border-black px-2 py-1 text-center">
                  {avgSkl}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-justify text-[10pt] leading-snug">
            Surat Keterangan Lulus ini berlaku sementara sebagai pengganti
            Ijazah resmi sampai diterbitkannya Ijazah asli dari satuan
            pendidikan.
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}

      {/* 11. SURAT PANGGILAN / PEMBINAAN ORANG TUA */}
      {docType === 'surat_panggilan_ortu' && (
        <div>
          <div className="flex justify-between items-start gap-6 mb-5 text-[11pt]">
            <table>
              <tbody>
                <tr>
                  <td className="w-[82px]">Nomor</td>
                  <td className="w-[12px]">:</td>
                  <td>{data.nomorSurat}</td>
                </tr>
                <tr>
                  <td>Panggilan</td>
                  <td>:</td>
                  <td className="font-bold">{data.panggilanKe}</td>
                </tr>
                <tr className="align-top">
                  <td>Perihal</td>
                  <td>:</td>
                  <td className="font-bold underline">{data.perihal}</td>
                </tr>
              </tbody>
            </table>

            <div className="w-[44%]">
              <p>
                {data.tempatSurat || school.kabupatenKota},{' '}
                {formatTanggalIndonesia(data.tanggalSurat)}
              </p>
              <p className="mt-3">Kepada Yth.</p>
              <p className="font-bold">Bapak/Ibu {data.ortuNama}</p>
              <p>Orang Tua/Wali dari {data.siswaNama}</p>
              <p>di {data.ortuAlamat}</p>
            </div>
          </div>

          <p className="mb-3">Dengan hormat,</p>
          <p className="text-justify leading-relaxed">
            Bersama surat ini kami sampaikan bahwa berdasarkan catatan buku
            absensi dan bimbingan konseling kelas {data.siswaKelas}, peserta
            didik atas nama <strong>{data.siswaNama}</strong> (NIS/NISN:{' '}
            {data.siswaNis}/{data.siswaNisn}) tercatat tidak hadir tanpa
            keterangan (Alpha) sebanyak{' '}
            <strong>{data.jumlahKetidakhadiranAlpha} hari</strong>.
          </p>

          <p className="text-justify leading-relaxed mt-3">
            {data.catatanPembinaan} Oleh karena itu, kami mengharap kehadiran
            Bapak/Ibu Orang Tua/Wali Murid pada:
          </p>

          <BiodataRows
            rows={[
              { label: 'Hari / Tanggal', value: data.hariTanggalUndangan },
              { label: 'Waktu', value: data.waktuUndangan },
              { label: 'Tempat', value: data.tempatUndangan },
              { label: 'Menghadap', value: data.menghadapKepada },
            ]}
          />

          <p className="text-justify leading-relaxed mt-4">
            Demikian surat pemberitahuan dan panggilan ini kami sampaikan. Atas
            perhatian dan kerja sama Bapak/Ibu demi kebaikan peserta didik, kami
            ucapkan terima kasih.
          </p>

          <SignatureBlock school={school} data={{ ...data, tembusan: '' }} />
        </div>
      )}
    </div>
  );
};
