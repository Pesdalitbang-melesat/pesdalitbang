import React, { useState, useEffect } from 'react';
import { Save, Trash2, Cloud, AlertCircle, Tag, List, Plus, X, Table, Download, ExternalLink, Scissors, AlertTriangle } from 'lucide-react';
import { AppSettings, Letter, SenderAbbreviation } from '../types';

const defaultSettings: AppSettings = {
  googleDriveFolderId: '',
  googleSheetUrl: '',
  autoUploadToDrive: true,
  theme: 'light',
  predefinedTags: ['Penting', 'Segera', 'Rahasia', 'Undangan', 'Dinas'],
  defaultCustomFields: ['Anggaran', 'Narahubung', 'Kode Proyek'],
  senderAbbreviations: [
    { full: 'Kementerian Dalam Negeri Republik Indonesia', short: 'Kemendagri' },
    { full: 'Badan Perencanaan Pembangunan Daerah', short: 'Bappeda' }
  ]
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Local state for inputs
  const [newTag, setNewTag] = useState('');
  const [newField, setNewField] = useState('');
  
  const [newAbbrFull, setNewAbbrFull] = useState('');
  const [newAbbrShort, setNewAbbrShort] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('suratAI_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge with default to ensure new fields exist if migrating from old version
      setSettings({ ...defaultSettings, ...parsed });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('suratAI_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const confirmResetData = () => {
      localStorage.removeItem('suratAI_data');
      setShowResetConfirm(false);
      window.location.reload();
  };

  const handleExportCSV = () => {
    const dataStr = localStorage.getItem('suratAI_data');
    if (!dataStr) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    try {
      const letters: Letter[] = JSON.parse(dataStr);
      
      // Define headers
      const headers = [
        "ID", "Jenis", "No. Surat", "Tanggal", "Pengirim", "Penerima", "Perihal", 
        "Awal Acara", "Akhir Acara", "Tempat/Lokasi", "Ringkasan", "Tags", "Link Dokumen", 
        "Data Custom (JSON)"
      ];

      // Convert to CSV rows
      const rows = letters.map(l => [
        `"${l.id}"`,
        `"${l.type}"`,
        `"${l.referenceNumber.replace(/"/g, '""')}"`,
        `"${l.date}"`,
        `"${l.sender.replace(/"/g, '""')}"`,
        `"${l.recipient.replace(/"/g, '""')}"`,
        `"${l.subject.replace(/"/g, '""')}"`,
        `"${l.eventStart || ''}"`,
        `"${l.eventEnd || ''}"`,
        `"${(l.location || '').replace(/"/g, '""')}"`,
        `"${l.summary.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${l.tags.join(', ')}"`,
        `"${l.documentUrl || ''}"`,
        `"${JSON.stringify(l.customFields || []).replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `rekap_surat_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e) {
      console.error(e);
      alert("Gagal mengexport data.");
    }
  };

  const openGoogleSheet = () => {
    if (settings.googleSheetUrl) {
      window.open(settings.googleSheetUrl, '_blank');
    }
  };

  // Tag Handlers
  const addTag = () => {
    if (newTag.trim() && !settings.predefinedTags.includes(newTag.trim())) {
      setSettings(prev => ({
        ...prev,
        predefinedTags: [...prev.predefinedTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      predefinedTags: prev.predefinedTags.filter(t => t !== tagToRemove)
    }));
  };

  // Custom Field Template Handlers
  const addField = () => {
    if (newField.trim() && !settings.defaultCustomFields.includes(newField.trim())) {
      setSettings(prev => ({
        ...prev,
        defaultCustomFields: [...prev.defaultCustomFields, newField.trim()]
      }));
      setNewField('');
    }
  };

  const removeField = (fieldToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      defaultCustomFields: prev.defaultCustomFields.filter(f => f !== fieldToRemove)
    }));
  };

  // Sender Abbreviation Handlers
  const addAbbreviation = () => {
    if (newAbbrFull.trim() && newAbbrShort.trim()) {
      setSettings(prev => ({
        ...prev,
        senderAbbreviations: [...(prev.senderAbbreviations || []), { full: newAbbrFull.trim(), short: newAbbrShort.trim() }]
      }));
      setNewAbbrFull('');
      setNewAbbrShort('');
    }
  };

  const removeAbbreviation = (index: number) => {
    setSettings(prev => ({
      ...prev,
      senderAbbreviations: (prev.senderAbbreviations || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <>
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-2xl mx-auto relative transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pengaturan Aplikasi</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasi penyimpanan, template data, dan preferensi.</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Google Drive Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold border-b border-indigo-100 dark:border-indigo-900 pb-2">
            <Cloud className="w-5 h-5" />
            <h3>Integrasi Google Drive</h3>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex gap-3">
             <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
             <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
               Aplikasi ini menggunakan mode simulasi untuk Google Drive. File Anda akan disimpan secara lokal di browser, namun kami akan membuat link simulasi seolah-olah file tersebut berada di folder Drive Anda.
             </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Google Drive Folder ID (Opsional)</label>
            <input 
              type="text" 
              value={settings.googleDriveFolderId}
              onChange={(e) => setSettings({...settings, googleDriveFolderId: e.target.value})}
              placeholder="Contoh: 1A2B3C4D5E6F..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Google Sheet Integration Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold border-b border-green-100 dark:border-green-900 pb-2">
            <Table className="w-5 h-5" />
            <h3>Integrasi Google Sheets (Rekap)</h3>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">Simpan link Google Sheet master Anda di sini untuk kemudahan akses.</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Link Google Sheet</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={settings.googleSheetUrl || ''}
                onChange={(e) => setSettings({...settings, googleSheetUrl: e.target.value})}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {settings.googleSheetUrl && (
                <button 
                  onClick={openGoogleSheet}
                  className="px-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors flex items-center justify-center"
                  title="Buka Spreadsheet"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-medium text-slate-800 dark:text-white">Export Database ke CSV</p>
                  <p>Download data untuk di-copy paste ke Google Sheet.</p>
              </div>
              <button 
                onClick={handleExportCSV}
                className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
          </div>
        </div>

        {/* Sender Abbreviations */}
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold border-b border-indigo-100 dark:border-indigo-900 pb-2">
                <Scissors className="w-5 h-5" />
                <h3>Singkatan Pengirim Otomatis</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Otomatis menyingkat nama instansi pengirim saat analisis surat.</p>
            
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    value={newAbbrFull}
                    onChange={(e) => setNewAbbrFull(e.target.value)}
                    placeholder="Nama Lengkap (Contoh: Badan Perencanaan...)"
                    className="flex-[2] p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <input 
                    type="text" 
                    value={newAbbrShort}
                    onChange={(e) => setNewAbbrShort(e.target.value)}
                    placeholder="Singkatan (Contoh: Bappeda)"
                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button onClick={addAbbreviation} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 self-end sm:self-auto">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
                {(settings.senderAbbreviations || []).map((abbr, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800 dark:text-white">{abbr.short}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">{abbr.full}</span>
                        </div>
                        <button onClick={() => removeAbbreviation(idx)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {(settings.senderAbbreviations || []).length === 0 && <p className="text-xs text-slate-400 italic">Belum ada data singkatan.</p>}
            </div>
        </div>

        {/* Master Data Tags */}
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold border-b border-indigo-100 dark:border-indigo-900 pb-2">
                <Tag className="w-5 h-5" />
                <h3>Manajemen Label (Tags)</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Daftar tag ini akan muncul sebagai rekomendasi saat membuat rekap surat.</p>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Nama Tag Baru..."
                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button onClick={addTag} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {settings.predefinedTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>

        {/* Master Data Custom Fields */}
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold border-b border-indigo-100 dark:border-indigo-900 pb-2">
                <List className="w-5 h-5" />
                <h3>Template Daftar Rekap (Custom Fields)</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Kolom-kolom ini akan otomatis muncul pada form rekap surat baru.</p>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addField()}
                    placeholder="Nama Kolom (Mis: Anggaran)..."
                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button onClick={addField} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-2">
                {settings.defaultCustomFields.map((field) => (
                    <div key={field} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{field}</span>
                        <button onClick={() => removeField(field)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {settings.defaultCustomFields.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada template kolom.</p>}
            </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold border-b border-red-100 dark:border-red-900 pb-2">
            <Trash2 className="w-5 h-5" />
            <h3>Zona Bahaya</h3>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
             <div>
                 <p className="font-medium text-red-800 dark:text-red-300">Hapus Semua Data Surat</p>
                 <p className="text-xs text-red-600 dark:text-red-400">Menghapus semua arsip surat. Pengaturan tidak dihapus.</p>
             </div>
             <button 
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-colors shadow-sm"
             >
                Reset Data
             </button>
          </div>
        </div>

        {/* Save Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            {saved && <span className="text-green-600 dark:text-green-400 text-sm flex items-center px-3">Pengaturan tersimpan!</span>}
            <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 flex items-center gap-2 transition-all"
            >
                <Save className="w-4 h-4" /> Simpan Pengaturan
            </button>
        </div>
      </div>
    </div>

    {/* Danger Confirmation Modal */}
    {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5">
                        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Hapus Semua Data?</h3>
                    
                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-8">
                        <p>
                            Tindakan ini akan <strong>menghapus permanen</strong> seluruh arsip surat masuk dan keluar yang tersimpan di browser ini.
                        </p>
                        <p className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
                            <strong>Peringatan:</strong> Data yang sudah dihapus tidak dapat dikembalikan lagi.
                        </p>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setShowResetConfirm(false)}
                            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={confirmResetData}
                            className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Ya, Hapus Semua
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Settings;