/**
 * Service de parsing de documents multi-formats
 * Supporte: PDF, DOCX, XLSX, PPTX, images (OCR)
 */

const fs = require('fs').promises;
const path = require('path');
const pdfParseLib = require('pdf-parse');
const pdfParse = pdfParseLib.default || pdfParseLib;
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const PizZip = require('pizzip');
const Tesseract = require('tesseract.js');

class DocumentParserService {
    constructor() {
        this.supportedFormats = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.ppt', '.pptx', '.txt', '.jpg', '.jpeg',
            '.png', '.bmp', '.tiff'
        ];
    }

    /**
     * Parse un document selon son type
     */
    async parseDocument(filePath, fileBuffer = null) {
        try {
            const ext = path.extname(filePath).toLowerCase();

            if (!this.supportedFormats.includes(ext)) {
                throw new Error(`Format non supporte: ${ext}`);
            }

            const buffer = fileBuffer || await fs.readFile(filePath);

            switch (ext) {
                case '.pdf':
                    return await this.parsePDF(buffer);
                case '.docx':
                    return await this.parseDOCX(buffer);
                case '.doc':
                    return await this.parseDOC(buffer);
                case '.xlsx':
                case '.xls':
                    return await this.parseExcel(buffer);
                case '.pptx':
                    return await this.parsePPTX(buffer);
                case '.txt':
                    return await this.parseText(buffer);
                case '.jpg':
                case '.jpeg':
                case '.png':
                case '.bmp':
                case '.tiff':
                    return await this.parseImage(buffer);
                default:
                    throw new Error(`Format non gere: ${ext}`);
            }
        } catch (error) {
            console.error('Erreur parsing document:', error);
            throw error;
        }
    }

    /**
     * Parse un fichier PDF
     */
    async parsePDF(buffer) {
        try {
            const data = await pdfParse(buffer);
            return {
                text: data.text,
                pages: data.numpages,
                metadata: data.info,
                success: true
            };
        } catch (error) {
            console.error('Erreur parsing PDF:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Parse un fichier DOCX
     */
    async parseDOCX(buffer) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return {
                text: result.value,
                messages: result.messages,
                success: true
            };
        } catch (error) {
            console.error('Erreur parsing DOCX:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Parse un fichier DOC (ancien format)
     */
    async parseDOC(buffer) {
        try {
            // Pour les anciens fichiers .doc, utiliser mammoth aussi
            const result = await mammoth.extractRawText({ buffer });
            return {
                text: result.value,
                messages: result.messages,
                success: true
            };
        } catch (error) {
            console.error('Erreur parsing DOC:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Parse un fichier Excel
     */
    async parseExcel(buffer) {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let allText = '';

            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                allText += `\n=== Feuille: ${sheetName} ===\n`;
                jsonData.forEach(row => {
                    allText += row.join(' | ') + '\n';
                });
            });

            return {
                text: allText.trim(),
                sheets: workbook.SheetNames,
                success: true
            };
        } catch (error) {
            console.error('Erreur parsing Excel:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Parse un fichier PowerPoint PPTX
     */
    async parsePPTX(buffer) {
        try {
            const zip = new PizZip(buffer);
            let text = '';

            // Extraire les slides XML
            const slideFiles = Object.keys(zip.files).filter(
                name => name.match(/ppt\/slides\/slide\d+\.xml/)
            );

            slideFiles.forEach(fileName => {
                const fileContent = zip.files[fileName].asText();
                // Extraire le texte entre les balises <a:t>
                const textMatches = fileContent.match(/<a:t>([^<]+)<\/a:t>/g) || [];
                textMatches.forEach(match => {
                    const content = match.replace(/<\/?a:t>/g, '');
                    text += content + ' ';
                });
            });

            return {
                text: text.trim(),
                slides: slideFiles.length,
                success: true
            };
        } catch (error) {
            console.error('Erreur parsing PPTX:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Parse un fichier texte
     */
    async parseText(buffer) {
        try {
            const text = buffer.toString('utf-8');
            return {
                text: text,
                success: true
            };
        } catch (error) {
            console.error('Erreur parsing texte:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Parse une image avec OCR
     */
    async parseImage(buffer) {
        try {
            const { data: { text } } = await Tesseract.recognize(
                buffer,
                'fra+spa', // Francais et espagnol
                {
                    logger: info => {
                        if (info.status === 'recognizing text') {
                            console.log(`OCR progression: ${Math.round(info.progress * 100)}%`);
                        }
                    }
                }
            );

            return {
                text: text.trim(),
                method: 'OCR',
                success: true
            };
        } catch (error) {
            console.error('Erreur OCR:', error);
            return {
                text: '',
                error: error.message,
                success: false
            };
        }
    }

    /**
     * Detecte la langue d'un texte
     */
    detectLanguage(text) {
        // Mots cles francais
        const frenchWords = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'est', 'sont', 'dans'];
        // Mots cles espagnols
        const spanishWords = ['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'es', 'son', 'en'];

        const lowerText = text.toLowerCase();
        let frenchCount = 0;
        let spanishCount = 0;

        frenchWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            frenchCount += (lowerText.match(regex) || []).length;
        });

        spanishWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            spanishCount += (lowerText.match(regex) || []).length;
        });

        if (frenchCount > spanishCount) return 'fr';
        if (spanishCount > frenchCount) return 'es';
        return 'fr'; // Par defaut
    }

    /**
     * Nettoie le texte extrait
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ') // Multiples espaces en un seul
            .replace(/\n+/g, '\n') // Multiples retours ligne en un seul
            .replace(/[^\w\s\u00C0-\u017F\n.,;:!?()-]/g, '') // Garder caracteres accentues
            .trim();
    }

    /**
     * Decoupe le texte en chunks
     */
    chunkText(text, maxWords = 1000, overlap = 100) {
        const words = text.split(/\s+/);
        const chunks = [];

        for (let i = 0; i < words.length; i += (maxWords - overlap)) {
            const chunk = words.slice(i, i + maxWords).join(' ');
            chunks.push({
                text: chunk,
                position: Math.floor(i / maxWords),
                wordCount: chunk.split(/\s+/).length
            });
        }

        return chunks;
    }
}

module.exports = new DocumentParserService();
