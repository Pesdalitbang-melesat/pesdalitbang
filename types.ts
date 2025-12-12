export enum LetterType {
  INCOMING = 'Masuk',
  OUTGOING = 'Keluar'
}

export interface CustomField {
  key: string;
  value: string;
}

export interface SenderAbbreviation {
  full: string;
  short: string;
}

export interface Letter {
  id: string;
  type: LetterType;
  referenceNumber: string; // Nomor Surat
  sender: string;
  recipient: string;
  date: string; // ISO Date string (Tanggal Surat)
  subject: string; // Perihal
  
  // Event Details
  eventStart?: string; // ISO DateTime string
  eventEnd?: string;   // ISO DateTime string
  location?: string;   // Tempat / Zoom Link

  summary: string; // Ringkasan AI
  content?: string; // Full text or OCR text
  documentUrl?: string; // Link ke Google Drive atau penyimpanan cloud
  fileName?: string;
  mimeType?: string; // image/jpeg, application/pdf
  tags: string[];
  customFields?: CustomField[]; // Fitur Custom Daftar Rekap
  createdAt: number;
}

export interface AIAnalysisResult {
  type: LetterType;
  referenceNumber: string;
  sender: string;
  recipient: string;
  date: string;
  subject: string;
  eventStart?: string;
  eventEnd?: string;
  location?: string;
  summary: string;
  tags: string[];
}

export interface AppSettings {
  googleDriveFolderId: string;
  googleSheetUrl?: string;       // Link Google Sheet untuk Rekap
  autoUploadToDrive: boolean;
  theme: 'light' | 'dark';
  predefinedTags: string[];      // Daftar Tag Tersimpan
  defaultCustomFields: string[]; // Template Nama Kolom Custom (Mis: Anggaran, PIC)
  senderAbbreviations: SenderAbbreviation[]; // Konfigurasi Singkatan Nama Pengirim
}