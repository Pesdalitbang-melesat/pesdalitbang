import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Check, Loader2, RefreshCw, X, File, Link as LinkIcon, ExternalLink, Plus, Trash2, Tag, CalendarClock, MapPin } from 'lucide-react';
import { analyzeLetterMedia, analyzeLetterText } from '../services/geminiService';
import { AIAnalysisResult, Letter, LetterType, CustomField, AppSettings, SenderAbbreviation } from '../types';

interface LetterFormProps {
  onSave: (letter: Letter) => void;
  onCancel: () => void;
}

const LetterForm: React.FC<LetterFormProps> = ({ onSave, onCancel }) => {
  const [mode, setMode] = useState<'upload' | 'text'>('upload');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Settings Data
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [senderAbbreviations, setSenderAbbreviations] = useState<SenderAbbreviation[]>([]);
  
  // File handling
  const [filePreview, setFilePreview] = useState<string | null>(null); // Base64 for AI
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  
  const [textContent, setTextContent] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Letter>>({
    type: LetterType.INCOMING,
    referenceNumber: '',
    sender: '',
    recipient: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    summary: '',
    eventStart: '',
    eventEnd: '',
    location: '',
    documentUrl: '',
    tags: [],
    customFields: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Settings on Mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('suratAI_settings');
    if (savedSettings) {
        const settings: AppSettings = JSON.parse(savedSettings);
        
        // Load tags
        if (settings.predefinedTags) {
            setSuggestedTags(settings.predefinedTags);
        }

        // Load Sender Abbreviations
        if (settings.senderAbbreviations) {
            setSenderAbbreviations(settings.senderAbbreviations);
        }

        // Initialize custom fields if empty
        if (settings.defaultCustomFields && settings.defaultCustomFields.length > 0) {
            setFormData(prev => {
                // Only set defaults if no fields exist yet
                if (!prev.customFields || prev.customFields.length === 0) {
                    return {
                        ...prev,
                        customFields: settings.defaultCustomFields.map(key => ({ key, value: '' }))
                    };
                }
                return prev;
            });
        }
    } else {
        // Fallback if no settings saved yet
        setSuggestedTags(['Penting', 'Segera', 'Rahasia']);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // VALIDATION: Check file size (Limit to 20MB to be safe within API limits)
      const MAX_SIZE_MB = 20;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`Ukuran file terlalu besar (${(file.size / (1024*1024)).toFixed(2)} MB). Maksimal ${MAX_SIZE_MB} MB untuk diproses AI.`);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear input
        }
        setFilePreview(null);
        setFileName("");
        return;
      }

      setFileName(file.name);
      setFileType(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFilePreview(base64String);
        // Simulate a "Cloud" URL for the document (In real app, this is the Drive URL)
        const fakeDriveUrl = `https://drive.google.com/file/d/simulated-id-${Date.now()}/view?usp=sharing`;
        setFormData(prev => ({ ...prev, documentUrl: fakeDriveUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      let result: AIAnalysisResult;

      if (mode === 'upload' && filePreview) {
        // Strip base64 prefix
        const base64Data = filePreview.split(',')[1];
        // Pass the actual mime type (e.g., application/pdf or image/jpeg)
        result = await analyzeLetterMedia(base64Data, fileType);
      } else if (mode === 'text' && textContent) {
        result = await analyzeLetterText(textContent);
      } else {
        alert("Mohon masukkan dokumen atau teks terlebih dahulu.");
        setLoading(false);
        return;
      }

      // Apply Sender Abbreviations
      let processedSender = result.sender;
      if (senderAbbreviations.length > 0) {
          senderAbbreviations.forEach(abbr => {
              if (abbr.full && abbr.short) {
                   // Escape special regex characters in the full name
                   const escapedFull = abbr.full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                   const regex = new RegExp(escapedFull, 'gi');
                   processedSender = processedSender.replace(regex, abbr.short);
              }
          });
      }

      setFormData(prev => ({
        ...prev,
        ...result,
        sender: processedSender,
        // Ensure event dates are formatted for datetime-local (YYYY-MM-DDTHH:mm)
        eventStart: result.eventStart ? result.eventStart.slice(0, 16) : prev.eventStart,
        eventEnd: result.eventEnd ? result.eventEnd.slice(0, 16) : prev.eventEnd,
        // Preserve custom fields
        customFields: prev.customFields 
      }));

    } catch (error: any) {
      console.error(error);
      let errorMessage = "Gagal menganalisis surat. Pastikan file terbaca dengan jelas.";
      
      if (error.message && (error.message.includes("size") || error.message.includes("limit") || error.message.includes("400"))) {
        errorMessage = "Gagal memproses: Ukuran file mungkin terlalu besar atau format tidak didukung oleh AI.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Custom Fields Handlers
  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), { key: '', value: '' }]
    }));
  };

  const removeCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields?.filter((_, i) => i !== index)
    }));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', val: string) => {
    const newFields = [...(formData.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: val };
    setFormData(prev => ({ ...prev, customFields: newFields }));
  };

  // Tag Handlers
  const addTag = (tag: string) => {
      if (!formData.tags?.includes(tag)) {
          setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sender || !formData.subject) {
        alert("Mohon lengkapi data surat (Pengirim & Perihal wajib diisi).");
        return;
    }

    // Fallback Logic: If Start exists but End is empty, add 4 hours
    let finalEventEnd = formData.eventEnd;
    if (formData.eventStart && !formData.eventEnd) {
        const startDate = new Date(formData.eventStart);
        startDate.setHours(startDate.getHours() + 4);
        // Format to ISO string for datetime-local (YYYY-MM-DDTHH:mm)
        const offset = startDate.getTimezoneOffset() * 60000;
        finalEventEnd = new Date(startDate.getTime() - offset).toISOString().slice(0, 16);
    }

    setLoading(true);
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            finalizeSave(finalEventEnd);
        }
    }, 50);

    const finalizeSave = (calculatedEnd?: string) => {
        // --- AUTO RENAMING LOGIC ---
        // 1. Get Year
        const year = formData.date ? formData.date.split('-')[0] : new Date().getFullYear();

        // 2. Determine Sender for Filename (Prioritize Short Name)
        let senderForFile = formData.sender || 'NoSender';
        // Double check against abbreviations in case user typed full name manually
        const foundAbbr = senderAbbreviations.find(a => a.full.toLowerCase() === senderForFile.toLowerCase());
        if (foundAbbr) {
            senderForFile = foundAbbr.short;
        }
        // Sanitize Sender: Remove special chars, spaces to underscores
        const safeSender = senderForFile.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

        // 3. Sanitize Reference Number (Replace slashes and special chars with underscores)
        const safeRef = (formData.referenceNumber || 'NoRef').replace(/[\/\\:*?"<>|]/g, '_');

        // 4. Get Extension
        let extension = 'pdf'; 
        if (fileName) {
            const parts = fileName.split('.');
            if (parts.length > 1) extension = parts.pop() || 'pdf';
        }

        // 5. Construct Name: YEAR_SENDER_REF.ext
        const autoGeneratedFileName = `${year}_${safeSender}_${safeRef}.${extension}`;
        // ---------------------------

        const newLetter: Letter = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            type: formData.type as LetterType,
            referenceNumber: formData.referenceNumber || '-',
            sender: formData.sender || '',
            recipient: formData.recipient || '',
            date: formData.date || new Date().toISOString().split('T')[0],
            subject: formData.subject || '',
            eventStart: formData.eventStart,
            eventEnd: calculatedEnd,
            location: formData.location || '',
            summary: formData.summary || '',
            tags: formData.tags || [],
            documentUrl: formData.documentUrl || '',
            fileName: autoGeneratedFileName, // Use the auto-generated name
            mimeType: fileType,
            content: textContent || undefined,
            customFields: formData.customFields || [],
        };

        onSave(newLetter);
        setLoading(false);
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rekap Surat Baru</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mendukung Gambar (JPG, PNG) dan Dokumen (PDF). Max 20MB.</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Side: Input Source */}
        <div className="p-6 border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                mode === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload File
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                mode === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" /> Input Teks
            </button>
          </div>

          <div className="min-h-[400px] flex flex-col">
            {mode === 'upload' ? (
              <div className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                 />
                 
                 {filePreview ? (
                    <div className="flex flex-col items-center justify-center text-center">
                        {fileType.includes('image') ? (
                             <img src={filePreview} alt="Preview" className="max-h-[200px] object-contain rounded-lg shadow-sm mb-4" />
                        ) : (
                             <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl flex items-center justify-center mb-4">
                                <FileText className="w-10 h-10" />
                             </div>
                        )}
                        <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{fileName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mt-1">{fileType.split('/')[1]}</p>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium"
                        >
                            Ganti File
                        </button>
                    </div>
                 ) : (
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500 dark:text-indigo-400">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold">Klik untuk upload dokumen</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">PDF, JPG, PNG (Max 20MB)</p>
                    </div>
                 )}
              </div>
            ) : (
              <textarea
                className="flex-1 w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm leading-relaxed text-slate-900 dark:text-slate-100"
                placeholder="Paste isi surat di sini..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || (mode === 'upload' && !filePreview) || (mode === 'text' && !textContent)}
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && uploadProgress === 0 ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {loading && uploadProgress === 0 ? 'Menganalisis dengan Gemini AI...' : 'Analisis & Rekap Otomatis'}
            </button>
          </div>
        </div>

        {/* Right Side: Result Form */}
        <div className="p-6 bg-white dark:bg-slate-800 overflow-y-auto max-h-[80vh] transition-colors">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. JENIS SURAT */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">1. Jenis Surat</label>
                    <select 
                        name="type" 
                        value={formData.type} 
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    >
                        <option value={LetterType.INCOMING}>Surat Masuk</option>
                        <option value={LetterType.OUTGOING}>Surat Keluar</option>
                    </select>
                </div>

                {/* 2. NOMOR SURAT */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">2. Nomor Surat</label>
                    <input 
                        type="text" 
                        name="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    />
                </div>

                {/* 3. TANGGAL SURAT */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">3. Tanggal Surat</label>
                    <input 
                        type="date" 
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    />
                </div>

                {/* 4. PENGIRIM */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        4. {formData.type === LetterType.INCOMING ? 'Pengirim (Eksternal)' : 'Pengirim (Internal/Unit)'}
                    </label>
                    <input 
                        type="text" 
                        name="sender"
                        value={formData.sender}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    />
                </div>

                {/* 5. DITUJUKAN KEPADA */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        5. {formData.type === LetterType.INCOMING ? 'Ditujukan Kepada (Internal)' : 'Ditujukan Kepada (Eksternal)'}
                    </label>
                     <input 
                        type="text" 
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    />
                </div>

                {/* 6. PERIHAL */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">6. Perihal</label>
                    <input 
                        type="text" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    />
                </div>

                {/* 7 & 8. ACARA (AWAL & AKHIR) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" /> 7. Awal Acara
                        </label>
                        <input 
                            type="datetime-local" 
                            name="eventStart"
                            value={formData.eventStart || ''}
                            onChange={handleChange}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" /> 8. Akhir Acara
                        </label>
                        <input 
                            type="datetime-local" 
                            name="eventEnd"
                            value={formData.eventEnd || ''}
                            onChange={handleChange}
                            placeholder="Opsional (Otomatis +4 jam)"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">*Jika kosong, otomatis +4 jam dari awal</p>
                    </div>
                </div>

                {/* 9. TEMPAT */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> 9. Tempat (Lokasi / Detail Zoom)
                    </label>
                    <textarea 
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Nama Ruangan, Alamat, atau Link Zoom (Meeting ID & Password)"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium resize-none"
                    />
                </div>

                {/* 10. RINGKASAN */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                        <span>10. Ringkasan (Format Otomatis)</span>
                        <span className="text-indigo-500 dark:text-indigo-400 text-[10px] font-normal cursor-pointer hover:underline">Regenerate</span>
                    </label>
                    <textarea 
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        rows={5}
                        className="w-full p-3 bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Ringkasan akan muncul di sini"
                    />
                </div>

                {/* 11. TAGS */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">11. Tags</label>
                    
                    {/* Active Tags */}
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg min-h-[44px] mb-2">
                        {formData.tags && formData.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded text-xs font-medium text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => {
                                    const newTags = formData.tags?.filter((_, i) => i !== idx);
                                    setFormData({...formData, tags: newTags});
                                }} className="hover:text-red-500 dark:hover:text-red-400"><X className="w-3 h-3"/></button>
                            </span>
                        ))}
                         <input 
                            type="text" 
                            placeholder="+ Tag baru"
                            className="bg-transparent text-sm outline-none w-32 text-slate-900 dark:text-white placeholder:text-slate-400"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val) addTag(val);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>

                    {/* Suggested Tags from Settings */}
                    {suggestedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><Tag className="w-3 h-3"/> Rekomendasi:</span>
                            {suggestedTags.filter(t => !formData.tags?.includes(t)).map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => addTag(tag)}
                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-600 dark:text-slate-300 transition-colors"
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custom Fields (Optional Extra) */}
                {formData.customFields && formData.customFields.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Data Tambahan (Custom)</label>
                        </div>
                        <div className="space-y-2">
                            {formData.customFields.map((field, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={field.key}
                                        readOnly
                                        className="w-1/3 p-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-medium"
                                    />
                                    <input 
                                        type="text" 
                                        value={field.value}
                                        onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                                        className="flex-1 p-2 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                                        placeholder="Isi data..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Document Link */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 mt-4">Link Dokumen (Drive)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                name="documentUrl"
                                value={formData.documentUrl}
                                onChange={handleChange}
                                placeholder="https://drive.google.com/..."
                                className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex gap-3">
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                        Batal
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70">
                        {loading && uploadProgress > 0 ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading {uploadProgress}%
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Simpan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default LetterForm;