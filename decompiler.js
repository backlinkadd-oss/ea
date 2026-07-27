// Binary Reader Utility
class BinaryReader {
    constructor(arrayBuffer) {
        this.dataView = new DataView(arrayBuffer);
        this.buffer = new Uint8Array(arrayBuffer);
        this.offset = 0;
        this.length = arrayBuffer.byteLength;
    }
    
    seek(offset) {
        this.offset = offset;
    }
    
    skip(bytes) {
        this.offset += bytes;
    }
    
    hasMore() {
        return this.offset < this.length;
    }
    
    readUint8() {
        if (this.offset >= this.length) return 0;
        let val = this.dataView.getUint8(this.offset);
        this.offset += 1;
        return val;
    }
    
    readInt8() {
        if (this.offset >= this.length) return 0;
        let val = this.dataView.getInt8(this.offset);
        this.offset += 1;
        return val;
    }
    
    readUint16(littleEndian = false) {
        if (this.offset + 2 > this.length) return 0;
        let val = this.dataView.getUint16(this.offset, littleEndian);
        this.offset += 2;
        return val;
    }
    
    readInt16(littleEndian = false) {
        if (this.offset + 2 > this.length) return 0;
        let val = this.dataView.getInt16(this.offset, littleEndian);
        this.offset += 2;
        return val;
    }
    
    readUint32(littleEndian = false) {
        if (this.offset + 4 > this.length) return 0;
        let val = this.dataView.getUint32(this.offset, littleEndian);
        this.offset += 4;
        return val;
    }
    
    readInt32(littleEndian = false) {
        if (this.offset + 4 > this.length) return 0;
        let val = this.dataView.getInt32(this.offset, littleEndian);
        this.offset += 4;
        return val;
    }
    
    readFloat32(littleEndian = false) {
        if (this.offset + 4 > this.length) return 0;
        let val = this.dataView.getFloat32(this.offset, littleEndian);
        this.offset += 4;
        return val;
    }
    
    readFloat64(littleEndian = false) {
        if (this.offset + 8 > this.length) return 0;
        let val = this.dataView.getFloat64(this.offset, littleEndian);
        this.offset += 8;
        return val;
    }
    
    readBytes(length) {
        if (this.offset + length > this.length) {
            length = this.length - this.offset;
        }
        let bytes = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;
        return bytes;
    }
    
    readUTF8String(length) {
        let bytes = this.readBytes(length);
        return new TextDecoder("utf-8").decode(bytes);
    }
}

// Global state for current file
let currentFile = {
    name: "",
    size: 0,
    arrayBuffer: null,
    uint8Array: null,
    type: "", // 'java', 'wasm', 'python', 'javascript', 'unknown'
    parsedData: null,
    decompiledText: "",
    disassemblyText: ""
};

// UI Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadScreen = document.getElementById('uploadScreen');
const workspaceScreen = document.getElementById('workspaceScreen');
const statusPanel = document.getElementById('statusPanel');
const headerFileName = document.getElementById('headerFileName');
const fileTypeBadge = document.getElementById('fileTypeBadge');
const fileSizeBadge = document.getElementById('fileSizeBadge');
const btnUploadNew = document.getElementById('btnUploadNew');
const outlineTree = document.getElementById('outlineTree');
const outlineSearch = document.getElementById('outlineSearch');
const decompiledCodeOutput = document.getElementById('decompiledCodeOutput');
const decompiledLineNumbers = document.getElementById('decompiledLineNumbers');
const disassemblyCodeOutput = document.getElementById('disassemblyCodeOutput');
const disassemblyLineNumbers = document.getElementById('disassemblyLineNumbers');
const hexGrid = document.getElementById('hexGrid');
const tabHex = document.getElementById('tabHex');

// Inspector UI Elements
const inspectorTitle = document.getElementById('inspectorTitle');
const inspectorContent = document.getElementById('inspectorContent');

// Modals & Info Elements
const btnHelp = document.getElementById('btnHelp');
const btnCloseHelp = document.getElementById('btnCloseHelp');
const helpModal = document.getElementById('helpModal');

// Drag and drop event listeners
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});



fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

btnUploadNew.addEventListener('click', () => {
    resetToUpload();
});

// Help Modal controls
btnHelp.addEventListener('click', () => {
    helpModal.classList.add('active');
});

btnCloseHelp.addEventListener('click', () => {
    helpModal.classList.remove('active');
});

helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
        helpModal.classList.remove('active');
    }
});

// Tab navigation setup
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const tabName = btn.dataset.tab;
        document.getElementById(`panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
        
        if (tabName === 'hexview') {
            renderHexView();
        }
    });
});

// Copy & Download Code actions
document.getElementById('btnCopyCode').addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let textToCopy = "";
    if (activeTab === 'decompiled') {
        textToCopy = decompiledCodeOutput.textContent;
    } else if (activeTab === 'disassembly') {
        textToCopy = disassemblyCodeOutput.textContent;
    } else if (activeTab === 'hexview') {
        // Copy Hex text
        const rows = document.querySelectorAll('.hex-row');
        let hexText = "";
        rows.forEach(row => {
            const offset = row.querySelector('.hex-offset').textContent;
            const bytes = Array.from(row.querySelectorAll('.hex-byte')).map(b => b.textContent).join(' ');
            const ascii = row.querySelector('.hex-ascii').textContent;
            hexText += `${offset}  ${bytes.padEnd(48, ' ')}  |${ascii}|\n`;
        });
        textToCopy = hexText;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('btnCopyCode');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        btn.classList.add('btn-primary');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-primary');
        }, 1500);
    });
});

document.getElementById('btnDownloadCode').addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let text = "";
    let filename = currentFile.name;
    
    if (activeTab === 'decompiled') {
        text = decompiledCodeOutput.textContent;
        if (currentFile.type === 'java') filename = filename.replace(/\.class$/i, '') + '.java';
        else if (currentFile.type === 'wasm') filename = filename.replace(/\.wasm$/i, '') + '.wat';
        else if (currentFile.type === 'python') filename = filename.replace(/\.pyc$/i, '') + '.py';
        else if (currentFile.type === 'javascript') filename = filename.replace(/\.js$/i, '') + '.decompiled.js';
    } else if (activeTab === 'disassembly') {
        text = disassemblyCodeOutput.textContent;
        filename = filename + '.disasm';
    } else {
        // Hex download
        text = Array.from(document.querySelectorAll('.hex-row')).map(row => {
            const offset = row.querySelector('.hex-offset').textContent;
            const bytes = Array.from(row.querySelectorAll('.hex-byte')).map(b => b.textContent).join(' ');
            const ascii = row.querySelector('.hex-ascii').textContent;
            return `${offset}  ${bytes.padEnd(48, ' ')}  |${ascii}|\n`;
        }).join('');
        filename = filename + '.hex';
    }
    
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Search functions in outline
outlineSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const items = outlineTree.querySelectorAll('.outline-item:not(.header-node)');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'flex';
            // Show parent subtrees if hidden
            let parent = item.closest('.sub-tree');
            while (parent) {
                parent.style.display = 'block';
                const toggle = parent.previousElementSibling.querySelector('.tree-arrow');
                if (toggle) toggle.classList.remove('collapsed');
                parent = parent.parentElement.closest('.sub-tree');
            }
        } else {
            item.style.display = 'none';
        }
    });
});

// File processing router
function handleFile(file) {
    currentFile.name = file.name;
    currentFile.size = file.size;
    
    updateStatus('processing', `Reading ${file.name}...`);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        currentFile.arrayBuffer = arrayBuffer;
        currentFile.uint8Array = new Uint8Array(arrayBuffer);
        
        detectFileTypeAndProcess();
    };
    reader.onerror = function() {
        updateStatus('error', 'Error reading file.');
    };
    reader.readAsArrayBuffer(file);
}

function detectFileTypeAndProcess() {
    const bytes = currentFile.uint8Array;
    
    // Check Java class file: Magic 0xCAFEBABE
    if (bytes.length >= 4 && bytes[0] === 0xCA && bytes[1] === 0xFE && bytes[2] === 0xBA && bytes[3] === 0xBE) {
        currentFile.type = 'java';
        processJavaClass();
    }
    // Check WASM: Magic 0x00 0x61 0x73 0x6D (\0asm)
    else if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6D) {
        currentFile.type = 'wasm';
        processWasm();
    }
    // Check Python .pyc or file extension
    else if (currentFile.name.endsWith('.pyc') || (bytes.length >= 4 && bytes[2] === 0x0D && bytes[3] === 0x0A)) {
        currentFile.type = 'python';
        processPythonPyc();
    }
    // Check EX4 / EX5
    else if (/\.ex(4|5)$/i.test(currentFile.name)) {
        currentFile.type = 'mql';
        processMql();
    }
    // Check if JavaScript (or other text formats)
    else if (currentFile.name.endsWith('.js') || isTextFile(bytes)) {
        currentFile.type = 'javascript';
        processJavaScript();
    }
    else {
        currentFile.type = 'unknown';
        processUnknownFile();
    }
}

// Utility to check if file content looks like text
function isTextFile(bytes) {
    // Check the first 200 bytes for nulls or high ratios of control chars
    const len = Math.min(bytes.length, 200);
    let controlChars = 0;
    for (let i = 0; i < len; i++) {
        if (bytes[i] === 0) return false;
        if (bytes[i] < 9 || (bytes[i] > 13 && bytes[i] < 32)) {
            controlChars++;
        }
    }
    return (controlChars / len) < 0.1;
}

// Reset UI state to upload screen
function resetToUpload() {
    currentFile = {
        name: "",
        size: 0,
        arrayBuffer: null,
        uint8Array: null,
        type: "",
        parsedData: null,
        decompiledText: "",
        disassemblyText: ""
    };
    
    uploadScreen.classList.add('active');
    workspaceScreen.classList.remove('active');
    btnUploadNew.style.display = 'none';
    
    updateStatus('idle', 'Ready');
    headerFileName.textContent = 'No file loaded';
    fileInput.value = '';
    
    decompiledCodeOutput.textContent = '';
    disassemblyCodeOutput.textContent = '';
    decompiledLineNumbers.innerHTML = '';
    disassemblyLineNumbers.innerHTML = '';
    hexGrid.innerHTML = '';
    
    outlineTree.innerHTML = '';
    resetInspector();
}

function updateStatus(state, message) {
    const badge = statusPanel.querySelector('.status-badge');
    badge.className = `status-badge ${state}`;
    badge.textContent = state;
    headerFileName.textContent = currentFile.name || message;
    
    if (state === 'loaded') {
        uploadScreen.classList.remove('active');
        workspaceScreen.classList.add('active');
        btnUploadNew.style.display = 'flex';
        
        fileTypeBadge.textContent = getFriendlyTypeName(currentFile.type);
        fileSizeBadge.textContent = formatBytes(currentFile.size);
    }
}

function getFriendlyTypeName(type) {
    switch (type) {
        case 'java': return 'Java Class File';
        case 'wasm': return 'WebAssembly Binary';
        case 'python': return 'Python Bytecode';
        case 'mql': return 'MetaTrader Executable';
        case 'javascript': return 'JavaScript Script';
        default: return 'Generic Binary';
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Renders the file's raw bytes in hex format
function renderHexView() {
    if (hexGrid.children.length > 0) return; // already rendered
    
    const bytes = currentFile.uint8Array;
    const rowCount = Math.min(Math.ceil(bytes.length / 16), 1000); // limit to 1000 rows for performance
    
    let html = '';
    for (let r = 0; r < rowCount; r++) {
        const offset = (r * 16).toString(16).toUpperCase().padStart(8, '0');
        
        let byteHtml = '';
        let asciiHtml = '';
        
        for (let b = 0; b < 16; b++) {
            const idx = r * 16 + b;
            if (idx < bytes.length) {
                const val = bytes[idx];
                const hexVal = val.toString(16).toUpperCase().padStart(2, '0');
                
                // Color code interesting sections for Java/WASM
                let highlightClass = '';
                if (currentFile.type === 'java') {
                    if (idx < 4) highlightClass = 'highlight-magic';
                    else if (idx >= 4 && idx < 8) highlightClass = 'highlight-version';
                    else if (idx >= 8 && idx < 300) highlightClass = 'highlight-cp'; // approximate constant pool color
                } else if (currentFile.type === 'wasm') {
                    if (idx < 4) highlightClass = 'highlight-magic';
                    else if (idx >= 4 && idx < 8) highlightClass = 'highlight-version';
                }
                
                byteHtml += `<span class="hex-byte ${highlightClass}" data-idx="${idx}">${hexVal}</span>`;
                
                // Printable character
                const char = (val >= 32 && val <= 126) ? String.fromCharCode(val) : '.';
                // Escape HTML chars
                const escChar = char.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                asciiHtml += `<span class="hex-char" data-idx="${idx}">${escChar}</span>`;
            } else {
                byteHtml += '<span class="hex-byte empty">  </span>';
                asciiHtml += '<span class="hex-char empty"> </span>';
            }
        }
        
        html += `
            <div class="hex-row">
                <span class="hex-offset">${offset}</span>
                <div class="hex-bytes">${byteHtml}</div>
                <div class="hex-ascii">${asciiHtml}</div>
            </div>
        `;
    }
    
    if (bytes.length > rowCount * 16) {
        html += `<div class="hex-row" style="color: var(--text-muted); justify-content: center; grid-template-columns: 1fr;">[File truncated in Hex View, displaying first ${rowCount * 16} bytes]</div>`;
    }
    
    hexGrid.innerHTML = html;
    
    // Add hover interactions
    hexGrid.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (target.classList.contains('hex-byte') || target.classList.contains('hex-char')) {
            const idx = target.dataset.idx;
            if (!idx) return;
            const elements = hexGrid.querySelectorAll(`[data-idx="${idx}"]`);
            elements.forEach(el => el.classList.add('hovered'));
        }
    });
    
    hexGrid.addEventListener('mouseout', (e) => {
        const target = e.target;
        if (target.classList.contains('hex-byte') || target.classList.contains('hex-char')) {
            const idx = target.dataset.idx;
            if (!idx) return;
            const elements = hexGrid.querySelectorAll(`[data-idx="${idx}"]`);
            elements.forEach(el => el.classList.remove('hovered'));
        }
    });
}

function updateCodeView(decompiled, disassembly) {
    decompiledCodeOutput.innerHTML = decompiled;
    disassemblyCodeOutput.innerHTML = disassembly;
    
    // Fill line numbers
    const decompLines = decompiled.split('\n').length;
    let decNumHtml = '';
    for (let i = 1; i <= decompLines; i++) {
        decNumHtml += `${i}\n`;
    }
    decompiledLineNumbers.textContent = decNumHtml;
    
    const disasmLines = disassembly.split('\n').length;
    let disasmNumHtml = '';
    for (let i = 1; i <= disasmLines; i++) {
        disasmNumHtml += `${i}\n`;
    }
    disassemblyLineNumbers.textContent = disasmNumHtml;
}

function createTreeToggle(li, subTree) {
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'tree-arrow';
    arrowSpan.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <polyline points="6 9 12 15 18 9"/>
        </svg>
    `;
    
    li.insertBefore(arrowSpan, li.firstChild);
    
    li.addEventListener('click', (e) => {
        // Toggle if arrow is clicked, or if item header is clicked
        if (e.target.closest('.tree-arrow') || e.target.classList.contains('header-node')) {
            e.stopPropagation();
            const arrow = li.querySelector('.tree-arrow');
            arrow.classList.toggle('collapsed');
            if (subTree.style.display === 'none') {
                subTree.style.display = 'block';
            } else {
                subTree.style.display = 'none';
            }
        }
    });
}

function resetInspector() {
    inspectorTitle.textContent = "Inspector";
    inspectorContent.innerHTML = `
        <div class="welcome-inspector">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <h4>Inspection Panel</h4>
            <p>Select a method, class member, or constant pool entry from the outline to inspect its properties and references in detail.</p>
        </div>
    `;
}

function showInspectorData(title, contentHtml) {
    inspectorTitle.textContent = title;
    inspectorContent.innerHTML = contentHtml;
}

// Fallback handler for un-supported types
function processUnknownFile() {
    const rawText = new TextDecoder('utf-8').decode(currentFile.uint8Array.subarray(0, 10000));
    const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, '.');
    
    const decompiled = `// ForgeDec Hex Dump & Basic Decode of Unknown File: ${currentFile.name}\n\n` + 
                       `// The file format could not be automatically detected.\n` + 
                       `// Displaying the first 10KB of raw text characters:\n\n` + 
                       cleanText;
                       
    const disassembly = `// No disassembler available for this file type.`;
    
    updateCodeView(decompiled, disassembly);
    
    // Add default tree node
    const li = document.createElement('li');
    li.className = 'outline-item active';
    li.innerHTML = `<span class="tree-icon">📄</span> ${currentFile.name}`;
    outlineTree.appendChild(li);
    
    updateStatus('loaded');
}


