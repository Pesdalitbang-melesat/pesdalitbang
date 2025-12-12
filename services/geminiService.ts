import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, LetterType } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Safety settings to prevent blocking of legitimate documents
// Using string values for compatibility
const safetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

// Generic function to analyze media (Images or PDFs)
export const analyzeLetterMedia = async (base64Data: string, mimeType: string): Promise<AIAnalysisResult> => {
  const model = "gemini-2.5-flash"; // Supports PDF and Images efficiently

  const prompt = `
    Anda adalah asisten administrasi ahli. Tugas anda adalah menganalisis dokumen surat resmi ini dan mengekstrak informasi penting secara detail.

    Instruksi Ekstraksi:
    1.  **Metadata Surat**:
        - Jenis Surat: 'Masuk' atau 'Keluar'.
        - Nomor Surat, Pengirim, Penerima (Ditujukan Kepada), Tanggal Surat (YYYY-MM-DD), Perihal.
    
    2.  **Detail Acara (Sangat Penting)**:
        - Cari tanggal dan jam mulai acara. Format ke ISO String (YYYY-MM-DDTHH:mm).
        - Cari tanggal dan jam selesai acara. 
        - **ATURAN 4 JAM**: Jika jam selesai tidak tertulis secara eksplisit, ESTIMASIKAN waktu selesai adalah 4 jam setelah waktu mulai.
        - **Tempat**: Ambil nama lokasi. Jika Online/Zoom, WAJIB sertakan Link, Meeting ID, dan Passcode dalam field lokasi ini.

    3.  **Ringkasan**:
        - Buat ringkasan padat yang mencakup poin-poin penting selain waktu acara (karena waktu sudah ada field khususnya).

    4.  **Tags**: Berikan tag relevan.

    Kembalikan respons dalam format JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: [LetterType.INCOMING, LetterType.OUTGOING] },
            referenceNumber: { type: Type.STRING },
            sender: { type: Type.STRING },
            recipient: { type: Type.STRING },
            date: { type: Type.STRING },
            subject: { type: Type.STRING },
            eventStart: { type: Type.STRING, description: "ISO 8601 DateTime YYYY-MM-DDTHH:mm" },
            eventEnd: { type: Type.STRING, description: "ISO 8601 DateTime YYYY-MM-DDTHH:mm" },
            location: { type: Type.STRING, description: "Nama tempat atau Detail Zoom (Link, ID, Pass)" },
            summary: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["type", "referenceNumber", "sender", "recipient", "date", "subject", "summary", "tags"],
        },
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    if (!text) {
        console.warn("Empty response from AI. Candidate details:", response.candidates);
        throw new Error("AI tidak memberikan respons. Dokumen mungkin tidak terbaca atau terfilter.");
    }
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};

// Keep text analysis for backward compatibility or text-only input
export const analyzeLetterText = async (textContent: string): Promise<AIAnalysisResult> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Analisis teks surat berikut.
    Teks: "${textContent}"
    
    Instruksi:
    1. Ekstrak Jenis, Nomor, Pengirim, Penerima, Tanggal, Perihal.
    2. Ekstrak Waktu Acara (Start/End). Jika End tidak ada, tambahkan 4 jam dari Start. Format ISO YYYY-MM-DDTHH:mm.
    3. Ekstrak Tempat (Termasuk detail Zoom jika ada).
    4. Buat Ringkasan dan Tags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: [LetterType.INCOMING, LetterType.OUTGOING] },
            referenceNumber: { type: Type.STRING },
            sender: { type: Type.STRING },
            recipient: { type: Type.STRING },
            date: { type: Type.STRING },
            subject: { type: Type.STRING },
            eventStart: { type: Type.STRING },
            eventEnd: { type: Type.STRING },
            location: { type: Type.STRING },
            summary: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["type", "referenceNumber", "sender", "recipient", "date", "subject", "summary", "tags"],
        },
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    if (!text) {
        console.warn("Empty response from AI. Candidate details:", response.candidates);
        throw new Error("AI tidak memberikan respons. Teks mungkin terfilter.");
    }
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Error analyzing text:", error);
    throw error;
  }
};