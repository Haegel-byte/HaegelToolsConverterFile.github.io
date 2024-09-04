const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const formatOutput = document.getElementById('formatOutput');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const downloadLink = document.getElementById('downloadLink');
const preview = document.getElementById('preview');
const characterImage = document.getElementById('character-image');
const characterSpeech = document.getElementById('character-speech');

const allowedFormats = ['txt', 'html', 'csv', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'gif'];

fileInput.addEventListener('change', function() {
    const file = this.files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedFormats.includes(fileExtension)) {
        result.textContent = `Format file ${fileExtension.toUpperCase()} tidak didukung. Silakan pilih file dengan format: ${allowedFormats.join(', ').toUpperCase()}.`;
        this.value = '';
    } else {
        result.textContent = '';
        showPreview(file);
        changeCharacterExpression('happy');
        showCharacterSpeech('File dipilih! Ayo kita konversi!');
    }
});

formatOutput.addEventListener('change', function() {
    const inputFormat = fileInput.files[0] ? fileInput.files[0].name.split('.').pop().toLowerCase() : '';
    const outputFormat = this.value;

    if (inputFormat && !isConversionSupported(inputFormat, outputFormat)) {
        result.textContent = `Konversi dari ${inputFormat.toUpperCase()} ke ${outputFormat.toUpperCase()} tidak didukung.`;
        convertBtn.disabled = true;
    } else {
        result.textContent = '';
        convertBtn.disabled = false;
    }
});

function isConversionSupported(inputFormat, outputFormat) {
    const supportedConversions = {
        'txt': ['html', 'csv', 'md', 'pdf', 'doc', 'docx'],
        'html': ['txt', 'csv', 'md', 'pdf', 'doc', 'docx'],
        'csv': ['html', 'txt', 'md', 'pdf', 'doc', 'docx'],
        'md': ['html', 'txt', 'csv', 'pdf', 'doc', 'docx'],
        'pdf': ['html', 'txt', 'csv', 'md', 'doc', 'docx'],
        'doc': ['html', 'txt', 'csv', 'md', 'pdf'],
        'docx': ['html', 'txt', 'csv', 'md', 'pdf'],
        'xls': ['csv', 'txt', 'html', 'pdf'],
        'xlsx': ['csv', 'txt', 'html', 'pdf'],
        'jpg': ['png', 'gif'],
        'png': ['jpg', 'gif'],
        'gif': ['jpg', 'png']
    };
    return supportedConversions[inputFormat] && supportedConversions[inputFormat].includes(outputFormat);
}

convertBtn.addEventListener('click', async function() {
    if (fileInput.files.length === 0) {
        result.textContent = 'Silakan pilih file terlebih dahulu.';
        return;
    }

    const outputFormat = formatOutput.value;
    const convertedFiles = [];

    loading.classList.remove('hidden');
    result.textContent = '';
    downloadLink.classList.add('hidden');
    changeCharacterExpression('excited');
    showCharacterSpeech('Sedang mengonversi... Semangat!');

    try {
        for (const file of fileInput.files) {
            const { convertedContent, fileName } = await convertFile(file, outputFormat);
            convertedFiles.push({ content: convertedContent, name: fileName });
        }

        if (convertedFiles.length === 1) {
            let blob;
            if (convertedFiles[0].content instanceof Blob) {
                blob = convertedFiles[0].content;
            } else {
                blob = new Blob([convertedFiles[0].content], { type: `application/${outputFormat}` });
            }
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = convertedFiles[0].name;
            downloadLink.classList.remove('hidden');
        } else {
            // Implementasikan logika untuk mengunduh multiple file (misalnya dalam format ZIP)
        }

        result.textContent = `${convertedFiles.length} file berhasil dikonversi ke ${outputFormat.toUpperCase()}.`;
        changeCharacterExpression('proud');
        showCharacterSpeech('Berhasil! File sudah dikonversi!', 5000);
    } catch (error) {
        result.textContent = error.message;
        changeCharacterExpression('sad');
        showCharacterSpeech('Ups, ada masalah. Coba lagi ya!', 5000);
    } finally {
        loading.classList.add('hidden');
    }
});

async function convertFile(file, outputFormat) {
    const inputFormat = file.name.split('.').pop().toLowerCase();
    let convertedContent, fileName;

    try {
        const fileContent = await readFileAsText(file);
        switch (true) {
            case inputFormat === 'txt' && outputFormat === 'html':
                convertedContent = txtToHtml(fileContent);
                fileName = 'converted.html';
                break;
            case inputFormat === 'html' && outputFormat === 'txt':
                convertedContent = htmlToTxt(fileContent);
                fileName = 'converted.txt';
                break;
            case inputFormat === 'csv' && outputFormat === 'html':
                convertedContent = csvToHtml(fileContent);
                fileName = 'converted.html';
                break;
            case inputFormat === 'html' && outputFormat === 'csv':
                convertedContent = htmlToCsv(fileContent);
                fileName = 'converted.csv';
                break;
            case inputFormat === 'md' && outputFormat === 'html':
                convertedContent = mdToHtml(fileContent);
                fileName = 'converted.html';
                break;
            case inputFormat === 'html' && outputFormat === 'md':
                convertedContent = htmlToMd(fileContent);
                fileName = 'converted.md';
                break;
            case inputFormat === 'pdf' && ['html', 'txt', 'csv', 'md', 'doc', 'docx'].includes(outputFormat):
                convertedContent = await pdfToText(file);
                if (outputFormat === 'html') convertedContent = txtToHtml(convertedContent);
                if (outputFormat === 'csv') convertedContent = txtToCsv(convertedContent);
                if (outputFormat === 'md') convertedContent = txtToMd(convertedContent);
                if (outputFormat === 'doc') convertedContent = await txtToDoc(convertedContent);
                if (outputFormat === 'docx') convertedContent = await txtToDocx(convertedContent);
                fileName = `converted.${outputFormat}`;
                break;
            case ['txt', 'html', 'csv', 'md'].includes(inputFormat) && outputFormat === 'pdf':
                convertedContent = await textToPdf(fileContent);
                fileName = 'converted.pdf';
                break;
            case ['doc', 'docx'].includes(inputFormat) && ['txt', 'html', 'csv', 'md', 'pdf'].includes(outputFormat):
                const extractedText = await docToText(file);
                if (outputFormat === 'txt') convertedContent = extractedText;
                if (outputFormat === 'html') convertedContent = txtToHtml(extractedText);
                if (outputFormat === 'csv') convertedContent = txtToCsv(extractedText);
                if (outputFormat === 'md') convertedContent = txtToMd(extractedText);
                if (outputFormat === 'pdf') convertedContent = await textToPdf(extractedText);
                fileName = `converted.${outputFormat}`;
                break;
            case ['xls', 'xlsx'].includes(inputFormat) && ['csv', 'txt', 'html', 'pdf'].includes(outputFormat):
                const sheetData = await xlsToJson(file);
                if (outputFormat === 'csv') convertedContent = jsonToCsv(sheetData);
                if (outputFormat === 'txt') convertedContent = jsonToTxt(sheetData);
                if (outputFormat === 'html') convertedContent = jsonToHtml(sheetData);
                if (outputFormat === 'pdf') convertedContent = await jsonToPdf(sheetData);
                fileName = `converted.${outputFormat}`;
                break;
            case ['jpg', 'png', 'gif'].includes(inputFormat) && ['jpg', 'png', 'gif'].includes(outputFormat):
                convertedContent = await convertImage(file, outputFormat);
                fileName = `converted.${outputFormat}`;
                break;
            default:
                throw new Error(`Konversi dari ${inputFormat.toUpperCase()} ke ${outputFormat.toUpperCase()} belum didukung.`);
        }

        return { convertedContent, fileName };
    } catch (error) {
        throw error;
    }
}

async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

async function pdfToHtml(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let html = '<div>';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            html += `<p>${textContent.items.map(item => item.str).join(' ')}</p>`;
        }
        html += '</div>';
        return html;
    } catch (error) {
        throw new Error('Gagal mengonversi PDF ke HTML: ' + error.message);
    }
}

async function pdfToText(file) {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
}

async function pdfToCsv(file) {
    const text = await pdfToText(file);
    return text.split('\n').map(line => line.split(' ').join(',')).join('\n');
}

async function pdfToMd(file) {
    const text = await pdfToText(file);
    return '# ' + text.split('\n').join('\n\n');
}

async function pdfToDoc(file) {
    const pdfText = await pdfToText(file);
    const docx = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    children: [new docx.TextRun(pdfText)],
                }),
            ],
        }],
    });
    const buffer = await docx.Packer.toBuffer(docx);
    return buffer;
}

async function pdfToDocx(file) {
    return await pdfToDoc(file); // Karena DOC dan DOCX menggunakan proses yang sama
}

async function htmlToPdf(htmlContent) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.html(htmlContent, {
        callback: function (doc) {
            return doc.output('arraybuffer');
        },
        x: 10,
        y: 10
    });
}

async function txtToPdf(txtContent) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(txtContent, 180);
    doc.text(splitText, 10, 10);
    return doc.output('arraybuffer');
}

async function csvToPdf(csvContent) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const rows = csvContent.split('\n');
    let y = 10;
    rows.forEach((row, index) => {
        const cells = row.split(',');
        let x = 10;
        cells.forEach(cell => {
            doc.text(cell, x, y);
            x += 40;
        });
        y += 10;
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
    });
    return doc.output('arraybuffer');
}

async function mdToPdf(mdContent) {
    const htmlContent = mdToHtml(mdContent);
    return htmlToPdf(htmlContent);
}

async function txtToDoc(text) {
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    children: [new docx.TextRun(text)],
                }),
            ],
        }],
    });
    const blob = await docx.Packer.toBlob(doc);
    return blob;
}

async function txtToDocx(text) {
    return await txtToDoc(text); // Karena DOC dan DOCX menggunakan proses yang sama
}

async function docToText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function xlsToJson(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

function jsonToCsv(jsonData) {
    const header = Object.keys(jsonData[0]).join(',') + '\n';
    const rows = jsonData.map(obj => Object.values(obj).join(','));
    return header + rows.join('\n');
}

function jsonToTxt(jsonData) {
    return JSON.stringify(jsonData, null, 2);
}

function jsonToHtml(jsonData) {
    let html = '<table><thead><tr>';
    const headers = Object.keys(jsonData[0]);
    html += headers.map(header => `<th>${header}</th>`).join('');
    html += '</tr></thead><tbody>';
    jsonData.forEach(row => {
        html += '<tr>';
        html += headers.map(header => `<td>${row[header]}</td>`).join('');
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
}

async function jsonToPdf(jsonData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(JSON.stringify(jsonData, null, 2), 10, 10);
    return doc.output('arraybuffer');
}

async function textToPdf(text) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(text, 10, 10);
    return doc.output('arraybuffer');
}

function txtToHtml(text) {
    return text.split('\n').map(line => `<p>${line}</p>`).join('');
}

function htmlToTxt(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}

function csvToHtml(csv) {
    const rows = csv.split('\n');
    let html = '<table>';
    rows.forEach((row, index) => {
        const cells = row.split(',');
        html += '<tr>';
        cells.forEach(cell => {
            html += index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    return html;
}

function htmlToCsv(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const rows = tempDiv.querySelectorAll('tr');
    let csv = '';
    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        csv += Array.from(cells).map(cell => cell.textContent).join(',') + '\n';
    });
    return csv;
}

function mdToHtml(md) {
    // Implementasi sederhana, gunakan library seperti marked.js untuk implementasi yang lebih baik
    return md.replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\n/gim, '<br>');
}

function htmlToMd(html) {
    // Implementasi sederhana, gunakan library seperti turndown untuk implementasi yang lebih baik
    return html.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<br>/gi, '\n');
}

async function convertImage(file, outputFormat) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(blob => {
                resolve(blob);
            }, `image/${outputFormat}`);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function showPreview(file) {
    preview.innerHTML = '';
    preview.classList.remove('hidden');

    const fileInfo = document.createElement('p');
    fileInfo.textContent = `Nama file: ${file.name}, Ukuran: ${formatFileSize(file.size)}`;
    preview.appendChild(fileInfo);

    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.maxWidth = '100%';
        img.style.maxHeight = '300px';
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const dimensions = document.createElement('p');
            dimensions.textContent = `Dimensi: ${img.naturalWidth} x ${img.naturalHeight} piksel`;
            preview.appendChild(dimensions);
        };
        preview.appendChild(img);
    } else if (file.type === 'application/pdf') {
        const pdfInfo = document.createElement('p');
        pdfInfo.textContent = 'Pratinjau PDF tidak tersedia. Silakan konversi untuk melihat hasilnya.';
        preview.appendChild(pdfInfo);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const pre = document.createElement('pre');
            pre.textContent = e.target.result.slice(0, 500) + (e.target.result.length > 500 ? '...' : '');
            pre.style.maxHeight = '300px';
            pre.overflow = 'auto';
            preview.appendChild(pre);
        };
        reader.readAsText(file);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function addFadeInEffect(element) {
    element.classList.add('fade-in');
    setTimeout(() => {
        element.classList.remove('fade-in');
    }, 500);
}

fileInput.addEventListener('change', function() {
    addFadeInEffect(preview);
});

convertBtn.addEventListener('click', function() {
    addFadeInEffect(result);
    addFadeInEffect(downloadLink);
});

const validExpressions = ['happy', 'sad', 'excited', 'proud'];

function changeCharacterExpression(expression) {
    if (!validExpressions.includes(expression)) {
        console.error(`Ekspresi "${expression}" tidak valid.`);
        return;
    }

    const newImage = new Image();
    newImage.onload = function() {
        characterImage.src = this.src;
    };
    newImage.onerror = function() {
        console.error(`Gambar untuk ekspresi "${expression}" tidak ditemukan.`);
    };
    newImage.src = `images/character-${expression}.png`;
}

// Preload gambar
validExpressions.forEach(exp => {
    const img = new Image();
    img.src = `images/character-${exp}.png`;
});

function showCharacterSpeech(message, duration = 3000) {
    characterSpeech.textContent = message;
    characterSpeech.classList.remove('hidden');
    characterSpeech.classList.add('show');
    setTimeout(() => {
        characterSpeech.classList.remove('show');
        setTimeout(() => {
            characterSpeech.classList.add('hidden');
        }, 300);
    }, duration);
}

setTimeout(() => {
    showCharacterSpeech('Selamat datang di HaegelTools! Hari yang cerah dan indah!');
}, 1000);