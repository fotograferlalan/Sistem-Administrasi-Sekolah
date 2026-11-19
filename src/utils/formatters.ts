import { DocumentType } from '../types/admin';

const BULAN_ID = [
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

const ROMAN_MONTHS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
];

const HARI_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function formatTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  const day = parsed.getDate();
  const month = BULAN_ID[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatHariTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  const dayName = HARI_ID[parsed.getDay()];
  return `${dayName}, ${formatTanggalIndonesia(dateStr)}`;
}

export function getRomanMonth(dateStr?: string): string {
  const parsed = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return ROMAN_MONTHS[new Date().getMonth()];
  }
  return ROMAN_MONTHS[parsed.getMonth()];
}

export function generateNomorSurat(
  classificationCode: string,
  sequenceNumber: number,
  kodeSekolah: string,
  dateStr?: string
): string {
  const parsed = dateStr ? new Date(dateStr) : new Date();
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const seq = String(sequenceNumber).padStart(3, '0');
  const roman = ROMAN_MONTHS[safeDate.getMonth()];
  const year = safeDate.getFullYear();
  return `${classificationCode}/${seq}/${kodeSekolah}/${roman}/${year}`;
}

export function getDocClassificationCode(docType: DocumentType): string {
  switch (docType) {
    case 'sk_pengangkatan_guru':
      return '421.2/SK';
    case 'sk_pembagian_tugas':
      return '421.2/SK-PTM';
    case 'surat_mutasi':
    case 'surat_pindah_sekolah':
    case 'surat_siap_terima':
    case 'surat_siswa_aktif':
    case 'surat_kelakuan_baik':
    case 'surat_keterangan_lulus':
    case 'surat_panggilan_ortu':
      return '421.2';
    case 'surat_tugas':
      return '094';
    case 'surat_undangan':
      return '005';
    default:
      return '421.2';
  }
}

export function exportPaperToWord(elementId: string, filename: string): boolean {
  const sourceNode = document.getElementById(elementId);
  if (!sourceNode) return false;

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>
          @page {
            size: 21.5cm 33cm;
            margin: 1.5cm 1.8cm 1.5cm 2cm;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11.5pt;
            line-height: 1.4;
            color: #000000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          .doc-table th, .doc-table td {
            border: 1px solid #000000;
            padding: 4px 6px;
            font-size: 10.5pt;
          }
          .kop-border {
            border-bottom: 3px double #000000;
            padding-bottom: 8px;
            margin-bottom: 14px;
          }
          .page-break-before {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        ${sourceNode.innerHTML}
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export interface PrintPaperOptions {
  title?: string;
  paperSize?: 'F4' | 'A4';
  orientation?: 'portrait' | 'landscape';
}

function collectDocumentStyles(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (rules) {
        const text = Array.from(rules)
          .map((r) => r.cssText)
          .join('\n');
        chunks.push(text);
        continue;
      }
    } catch {
      // Ignore cross-origin stylesheet security errors
    }
    const owner = sheet.ownerNode;
    if (owner && owner.nodeName === 'STYLE' && owner.textContent) {
      chunks.push(owner.textContent);
    }
  }
  return chunks.join('\n');
}

export function printPaperElement(
  elementId: string,
  options: PrintPaperOptions = {}
): boolean {
  const sourceNode = document.getElementById(elementId);
  if (!sourceNode) {
    window.print();
    return false;
  }

  const {
    title = document.title || 'Dokumen TataUsaha SD',
    paperSize = 'F4',
    orientation = 'portrait',
  } = options;

  const pageSizeRule =
    orientation === 'landscape'
      ? paperSize === 'F4'
        ? '330mm 215mm'
        : 'A4 landscape'
      : paperSize === 'F4'
        ? '215mm 330mm'
        : 'A4 portrait';

  const pageMarginRule =
    orientation === 'landscape' ? '8mm 10mm' : '12mm 15mm 14mm 18mm';

  const existingIframe = document.getElementById('tatausaha-print-frame');
  if (existingIframe && existingIframe.parentNode) {
    existingIframe.parentNode.removeChild(existingIframe);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'tatausaha-print-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc || !iframe.contentWindow) {
    window.print();
    return false;
  }

  const appCss = collectDocumentStyles();
  const sanitizedClasses = sourceNode.className
    .split(/\s+/)
    .filter(
      (c) =>
        c &&
        c !== 'hidden' &&
        c !== 'shadow-sm' &&
        c !== 'shadow-md' &&
        c !== 'border-slate-200'
    )
    .join(' ');

  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      ${appCss}
      @page {
        size: ${pageSizeRule};
        margin: ${pageMarginRule};
      }
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-sheet-root {
        width: 100% !important;
        max-width: none !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: #ffffff !important;
        transform: none !important;
      }
      .page-break-before {
        break-before: page !important;
        page-break-before: always !important;
      }
      table {
        border-collapse: collapse;
      }
      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body>
    <div class="${sanitizedClasses} print-sheet-root">
      ${sourceNode.innerHTML}
    </div>
  </body>
</html>`;

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  try {
    iframe.contentWindow.onafterprint = cleanup;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(cleanup, 60000);
    return true;
  } catch {
    cleanup();
    window.print();
    return false;
  }
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

