import React, { useState } from 'react';
import { Letter, LetterType } from '../types';
import { Search, Eye, Calendar, ArrowUpRight, ArrowDownLeft, FileText, CalendarClock, MapPin } from 'lucide-react';

interface LetterListProps {
  letters: Letter[];
  filterType?: LetterType | 'all';
}

const LetterList: React.FC<LetterListProps> = ({ letters, filterType = 'all' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLetters = letters
    .filter(l => filterType === 'all' || l.type === filterType)
    .filter(l => 
      l.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to format event date
  const formatEventTime = (startStr?: string, endStr?: string) => {
    if (!startStr) return null;
    const start = new Date(startStr);
    const date = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStart = start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    let timeEnd = '';
    if (endStr) {
        const end = new Date(endStr);
        timeEnd = ' - ' + end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return `${date}, ${timeStart}${timeEnd}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {filterType === 'all' ? 'Daftar Semua Surat' : filterType === LetterType.INCOMING ? 'Surat Masuk' : 'Surat Keluar'}
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari surat..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Jenis</th>
              <th className="px-6 py-4">Info Surat</th>
              <th className="px-6 py-4">Detail Acara & Ringkasan</th>
              <th className="px-6 py-4">Dokumen</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredLetters.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        Tidak ada surat yang ditemukan.
                    </td>
                </tr>
            ) : (
                filteredLetters.map((letter) => (
                <tr key={letter.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 align-top">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            letter.type === LetterType.INCOMING 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' 
                            : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800'
                        }`}>
                            {letter.type === LetterType.INCOMING ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {letter.type}
                        </div>
                    </td>
                    <td className="px-6 py-4 align-top max-w-[240px]">
                        <div className="font-semibold text-slate-800 dark:text-white truncate" title={letter.subject}>{letter.subject}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded w-fit">{letter.referenceNumber}</span>
                            <span className="truncate">
                                {letter.type === LetterType.INCOMING ? `Dari: ${letter.sender}` : `Ke: ${letter.recipient}`}
                            </span>
                             <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {letter.date}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 align-top max-w-[320px]">
                        {/* Event Details Highlight */}
                        {(letter.eventStart || letter.location) && (
                            <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                                {letter.eventStart && (
                                    <div className="flex items-start gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">
                                        <CalendarClock className="w-3.5 h-3.5 mt-0.5" />
                                        <span>{formatEventTime(letter.eventStart, letter.eventEnd)}</span>
                                    </div>
                                )}
                                {letter.location && (
                                    <div className="flex items-start gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                        <span className="break-words line-clamp-2">{letter.location}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-line line-clamp-3" title={letter.summary}>{letter.summary}</p>
                        
                        <div className="flex gap-1 mt-2 flex-wrap">
                            {letter.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">#{tag}</span>
                            ))}
                        </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                        {letter.documentUrl ? (
                            <a 
                                href={letter.documentUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"
                            >
                                <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                File
                            </a>
                        ) : (
                            <span className="text-slate-400 text-xs italic">Tidak ada file</span>
                        )}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                        <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1">
                            <Eye className="w-4 h-4" />
                        </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LetterList;