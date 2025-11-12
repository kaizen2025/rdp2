/**
 * Service Multimodal pour Gemini
 * Gère l'upload, l'analyse et l'édition de fichiers
 * Supporte: Images, PDF, Excel, Word, Audio, Vidéo
 */

const fs = require('fs').promises;
const path = require('path');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

class MultimodalService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../../../data/uploads');
        this.outputDir = path.join(__dirname, '../../../data/outputs');
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            console.error('Erreur création dossiers:', error);
        }
    }

    /**
     * Analyse un fichier selon son type
     */
    async analyzeFile(filePath, fileType) {
        const ext = path.extname(filePath).toLowerCase();

        try {
            switch (ext) {
                case '.pdf':
                    return await this.analyzePDF(filePath);

                case '.xlsx':
                case '.xls':
                    return await this.analyzeExcel(filePath);

                case '.docx':
                case '.doc':
                    return await this.analyzeWord(filePath);

                case '.csv':
                    return await this.analyzeCSV(filePath);

                case '.json':
                    return await this.analyzeJSON(filePath);

                case '.txt':
                case '.md':
                    return await this.analyzeText(filePath);

                case '.jpg':
                case '.jpeg':
                case '.png':
                case '.webp':
                case '.gif':
                    return await this.analyzeImage(filePath);

                default:
                    return {
                        type: 'file',
                        name: path.basename(filePath),
                        message: 'Type de fichier supporté par Gemini mais analyse détaillée non disponible'
                    };
            }
        } catch (error) {
            console.error('Erreur analyse fichier:', error);
            return {
                type: 'error',
                message: error.message
            };
        }
    }

    /**
     * Analyse PDF
     */
    async analyzePDF(filePath) {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);

        return {
            type: 'pdf',
            name: path.basename(filePath),
            pages: data.numpages,
            text: data.text,
            wordCount: data.text.split(/\s+/).length,
            preview: data.text.substring(0, 500) + '...'
        };
    }

    /**
     * Analyse Excel
     */
    async analyzeExcel(filePath) {
        const workbook = xlsx.readFile(filePath);
        const sheets = {};
        const summary = {
            type: 'excel',
            name: path.basename(filePath),
            sheetCount: workbook.SheetNames.length,
            sheets: workbook.SheetNames,
            data: {}
        };

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);
            const csvData = xlsx.utils.sheet_to_csv(worksheet);

            summary.data[sheetName] = {
                rows: jsonData.length,
                preview: jsonData.slice(0, 5),
                csv: csvData.split('\n').slice(0, 10).join('\n')
            };
        }

        return summary;
    }

    /**
     * Analyse Word
     */
    async analyzeWord(filePath) {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value;

        return {
            type: 'word',
            name: path.basename(filePath),
            text: text,
            wordCount: text.split(/\s+/).length,
            preview: text.substring(0, 500) + '...'
        };
    }

    /**
     * Analyse CSV
     */
    async analyzeCSV(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const workbook = xlsx.read(content, { type: 'string' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        return {
            type: 'csv',
            name: path.basename(filePath),
            rows: jsonData.length,
            columns: Object.keys(jsonData[0] || {}),
            preview: jsonData.slice(0, 10),
            csv: content.split('\n').slice(0, 10).join('\n')
        };
    }

    /**
     * Analyse JSON
     */
    async analyzeJSON(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        return {
            type: 'json',
            name: path.basename(filePath),
            structure: Array.isArray(data) ? 'array' : 'object',
            itemCount: Array.isArray(data) ? data.length : Object.keys(data).length,
            preview: JSON.stringify(data, null, 2).substring(0, 500) + '...'
        };
    }

    /**
     * Analyse texte
     */
    async analyzeText(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');

        return {
            type: 'text',
            name: path.basename(filePath),
            text: content,
            lines: content.split('\n').length,
            wordCount: content.split(/\s+/).length,
            preview: content.substring(0, 500) + '...'
        };
    }

    /**
     * Analyse image (metadata seulement, Gemini fera l'analyse visuelle)
     */
    async analyzeImage(filePath) {
        const stats = await fs.stat(filePath);

        return {
            type: 'image',
            name: path.basename(filePath),
            size: stats.size,
            message: 'Image prête pour analyse visuelle par Gemini'
        };
    }

    /**
     * Convertit une réponse texte en Excel
     */
    async textToExcel(text, filename = 'output.xlsx') {
        // Détecte si le texte contient des données tabulaires
        const lines = text.split('\n').filter(l => l.trim());
        const data = [];

        // Essaye de parser comme CSV/TSV
        for (const line of lines) {
            const cells = line.split(/[,\t|]/);
            if (cells.length > 1) {
                data.push(cells.map(c => c.trim()));
            }
        }

        if (data.length === 0) {
            // Pas de données tabulaires, retourne null
            return null;
        }

        const worksheet = xlsx.utils.aoa_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const outputPath = path.join(this.outputDir, filename);
        xlsx.writeFile(workbook, outputPath);

        return outputPath;
    }

    /**
     * Convertit une réponse texte en Word
     */
    async textToWord(text, filename = 'output.docx') {
        // Pour une vraie conversion Word, il faudrait utiliser docx
        // Pour l'instant on crée un fichier texte
        const outputPath = path.join(this.outputDir, filename.replace('.docx', '.txt'));
        await fs.writeFile(outputPath, text, 'utf-8');
        return outputPath;
    }

    /**
     * Modifie un fichier Excel basé sur des instructions
     */
    async modifyExcel(filePath, modifications) {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Applique les modifications (exemple: ajout de lignes)
        if (modifications.addRows) {
            const jsonData = xlsx.utils.sheet_to_json(worksheet);
            const newData = [...jsonData, ...modifications.addRows];
            const newWorksheet = xlsx.utils.json_to_sheet(newData);
            workbook.Sheets[sheetName] = newWorksheet;
        }

        const outputPath = path.join(this.outputDir, 'modified_' + path.basename(filePath));
        xlsx.writeFile(workbook, outputPath);

        return outputPath;
    }

    /**
     * Prépare les fichiers pour Gemini
     * Retourne les données dans le format attendu par Gemini API
     */
    async prepareFilesForGemini(files) {
        const prepared = [];

        for (const file of files) {
            const analysis = await this.analyzeFile(file.path, file.mimetype);

            prepared.push({
                path: file.path,
                name: file.filename,
                mimetype: file.mimetype,
                analysis: analysis,
                // Pour Gemini: inlineData pour images/PDF, text pour documents convertis
                geminiFormat: this.convertToGeminiFormat(file, analysis)
            });
        }

        return prepared;
    }

    /**
     * Convertit au format Gemini
     */
    convertToGeminiFormat(file, analysis) {
        // Images et PDF: format inlineData
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            return {
                type: 'inlineData',
                path: file.path,
                mimeType: file.mimetype
            };
        }

        // Documents textuels: convertis en texte
        if (analysis.text) {
            return {
                type: 'text',
                content: analysis.text
            };
        }

        // Excel/CSV: convertis en texte structuré
        if (analysis.csv) {
            return {
                type: 'text',
                content: `Données du fichier ${analysis.name}:\n\n${analysis.csv}`
            };
        }

        return {
            type: 'text',
            content: `Fichier: ${file.filename}\nType: ${file.mimetype}`
        };
    }

    /**
     * Nettoie les fichiers temporaires
     */
    async cleanupFiles(files, maxAge = 3600000) { // 1 heure par défaut
        const now = Date.now();

        for (const dir of [this.uploadDir, this.outputDir]) {
            try {
                const entries = await fs.readdir(dir);
                for (const entry of entries) {
                    const filePath = path.join(dir, entry);
                    const stats = await fs.stat(filePath);

                    if (now - stats.mtimeMs > maxAge) {
                        await fs.unlink(filePath);
                        console.log(`🧹 Fichier nettoyé: ${entry}`);
                    }
                }
            } catch (error) {
                console.error('Erreur nettoyage:', error);
            }
        }
    }
}

module.exports = new MultimodalService();
