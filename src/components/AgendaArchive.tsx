import React, { useMemo, useState } from 'react';
import { Copy, FilePlus2, FolderOpen, Search, Trash2 } from 'lucide-react';
import {
  ArchivedDocument,
  DocumentCategory,
  DocumentType,
} from '../types/admin';
import { formatTanggalIndonesia } from '../utils/formatters';

interface AgendaArchiveProps {
  archives: ArchivedDocument[];
  onOpenItem: (item: ArchivedDocument) => void;
  onDuplicateItem: (item: ArchivedDocument) => void;
  onDeleteItem: (id: string) => void;
  onCreateNew: (type: DocumentType) => void;
}

const CATEGORIES: Array<'Semua' | DocumentCategory> = [
  'Semua',
  'SK Kepegawaian',
  'Mutasi & Kesiswaan',
  'Operasional & Dinas',
];

export const AgendaArchive: React.FC<AgendaArchiveProps> = ({
  archives,
  onOpenItem,
  onDuplicateItem,
  onDeleteItem,
  onCreateNew,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'Semua' | DocumentCategory
  >('Semua');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archives.filter((item) => {
      const matchCat =
        categoryFilter === 'Semua' || item.category === categoryFilter;
      const matchQuery =
        !q ||
        item.nomorSurat.toLowerCase().includes(q) ||
        item.judul.toLowerCase().includes(q) ||
        item.subjekUtama.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [archives, query, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Buku Agenda &amp; Arsip Surat Keluar
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Riwayat SK dan surat dinas tersimpan otomatis di peramban untuk dicetak ulang atau diduplikasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCreateNew('sk_pengangkatan_guru')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0"
        >
          <FilePlus2 className="w-4 h-4" />
          Buat Dokumen Baru
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor surat, nama guru, atau siswa..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:outline-none"
          />
        </div>
      </div>

      {/* Archive Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {archives.length === 0
                ? 'Belum ada surat atau SK di Buku Agenda.'
                : 'Tidak ditemukan arsip yang cocok dengan pencarian Anda.'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (archives.length === 0) {
                  onCreateNew('sk_pengangkatan_guru');
                } else {
                  setQuery('');
                  setCategoryFilter('Semua');
                }
              }}
              className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-xs font-semibold text-white hover:bg-[#162C49]"
            >
              {archives.length === 0 ? 'Buat Surat Pertama' : 'Reset Filter'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-10 text-center">No</th>
                  <th className="py-3 px-4">Nomor Surat</th>
                  <th className="py-3 px-4">Judul &amp; Kategori</th>
                  <th className="py-3 px-4">Subjek</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kertas</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-xs text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                      {item.nomorSurat}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {item.judul}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {item.subjekUtama}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatTanggalIndonesia(item.tanggalSurat)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {item.paperSize}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenItem(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] hover:underline"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Buka
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          title="Duplikat sebagai surat baru"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplikat
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                          title="Hapus dari arsip"
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
        )}
      </div>
    </div>
  );
};
