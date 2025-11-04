const Tesseract = require('tesseract.js'); 
 
async function recognizeText(imagePath) { 
    const { data: { text } } = await Tesseract.recognize(imagePath, 'fra'); 
    return text; 
} 
 
module.exports = { recognizeText }; 
