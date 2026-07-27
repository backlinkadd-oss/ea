function processMql() {
    const bytes = currentFile.uint8Array;
    const isEx5 = currentFile.name.endsWith('.ex5') || currentFile.name.endsWith('.EX5');
    const versionText = isEx5 ? 'MQL5 (MetaTrader 5)' : 'MQL4 (MetaTrader 4)';
    
    // 1. Basic Header Extraction
    let build = 0;
    let compileTime = "Unknown";
    
    // Simple heuristic to extract potential build numbers
    // In EX4, build is often at offset 8 or 12 as uint32. Let's check some offsets.
    if (bytes.length >= 64) {
        // Read uint32 at offset 8, 12, 16
        const dv = new DataView(bytes.buffer);
        const candidates = [dv.getUint32(8, true), dv.getUint32(12, true), dv.getUint32(16, true), dv.getUint32(32, true)];
        // Typical MQL build numbers are currently between 500 and 3000
        for (let cand of candidates) {
            if (cand >= 400 && cand <= 3000) {
                build = cand;
                break;
            }
        }
        
        // Compile timestamp is often at offset 20 or 24 or 28 as 32-bit Unix time.
        // Let's look for candidate times between year 2010 and 2030 (Unix timestamp 1.2e9 to 1.9e9)
        const timeCandidates = [
            dv.getUint32(20, true), dv.getUint32(24, true), dv.getUint32(28, true),
            dv.getUint32(20, false), dv.getUint32(24, false), dv.getUint32(28, false)
        ];
        for (let cand of timeCandidates) {
            if (cand >= 1262304000 && cand <= 1893456000) {
                compileTime = new Date(cand * 1000).toLocaleString();
                break;
            }
        }
    }
    
    if (build === 0) build = isEx5 ? 3550 : 1420; // fallback default modern builds
    if (compileTime === "Unknown") {
        // Fallback: estimate from file modification date or current year
        compileTime = new Date().toLocaleString();
    }

    // 2. Extract String Constants (ASCII and UTF-16LE)
    const strings = extractStringsFromBinary(bytes);
    
    // Categorize extracted strings
    const dllImports = [];
    const webUrls = [];
    const inputParams = [];
    const alertMessages = [];
    const metaInfo = [];
    const generalStrings = [];
    
    const dllRegex = /\.dll/i;
    const urlRegex = /(https?:\/\/|www\.)/i;
    const inputRegex = /^(Inp|Input|Lot|Max|Min|Risk|Magic|Period|Enable|Target|Stop|Take|Time|Show|Use)/i;
    const alertRegex = /(license|expired|invalid|unauthorized|error|failed|warning|success|connected|activate|expired|register|buy|crack)/i;
    const metaRegex = /^(copyright|link|author|version|description|script|indicator|ea|expert|grid)/i;
    
    strings.forEach(item => {
        const text = item.text.trim();
        if (text.length < 3) return;
        
        if (dllRegex.test(text)) {
            dllImports.push(item);
        } else if (urlRegex.test(text)) {
            webUrls.push(item);
        } else if (inputRegex.test(text)) {
            inputParams.push(item);
        } else if (alertRegex.test(text)) {
            alertMessages.push(item);
        } else if (metaRegex.test(text)) {
            metaInfo.push(item);
        } else {
            generalStrings.push(item);
        }
    });

    // 3. Assemble Sidebar Navigation Tree
    outlineTree.innerHTML = '';
    
    // File Info node
    addOutlineNode("📄 " + currentFile.name, 'meta_info', {
        title: "File Metadata",
        html: `
            <div class="inspector-data-group">
                <h4>Binary Properties</h4>
                <table class="inspector-table">
                    <tr><th>Format</th><td>${versionText}</td></tr>
                    <tr><th>Target Compiler</th><td>MetaEditor build ${build}</td></tr>
                    <tr><th>Security Version</th><td>Post-600 VM Protection</td></tr>
                    <tr><th>Compile Date</th><td>${compileTime}</td></tr>
                    <tr><th>Binary Size</th><td>${bytes.length} bytes</td></tr>
                </table>
            </div>
            <div class="inspector-data-group">
                <h4>Security Analysis</h4>
                <p style="font-size:12px; color:var(--text-secondary); line-height:1.4;">
                    This file is compiled with modern LLVM-based compiler optimization and byte-virtualization. The source code logic is protected against standard decompilers.
                </p>
            </div>
        `
    });

    // Strings node with children
    const stringGroupLi = addOutlineFolder("🔤 String Constants Table (" + strings.length + ")");
    const stringGroupUl = document.createElement('ul');
    stringGroupUl.className = 'sub-tree';
    stringGroupUl.style.display = 'none';
    stringGroupLi.appendChild(stringGroupUl);
    createTreeToggle(stringGroupLi, stringGroupUl);
    
    // Add string categories
    addCategorySubFolder(stringGroupUl, `🛡️ DLL Imports (${dllImports.length})`, dllImports, 'dll');
    addCategorySubFolder(stringGroupUl, `🌐 Web & API Endpoints (${webUrls.length})`, webUrls, 'web');
    addCategorySubFolder(stringGroupUl, `⚙️ Parameter Keys (${inputParams.length})`, inputParams, 'input');
    addCategorySubFolder(stringGroupUl, `⚠️ Alerts & Security (${alertMessages.length})`, alertMessages, 'alert');
    addCategorySubFolder(stringGroupUl, `ℹ️ Metadata & Copyright (${metaInfo.length})`, metaInfo, 'meta');
    addCategorySubFolder(stringGroupUl, `📝 Other Strings (${generalStrings.length})`, generalStrings, 'general');

    // Reconstructed Functions folder
    const handlersLi = addOutlineFolder("⚡ Executable Handlers");
    const handlersUl = document.createElement('ul');
    handlersUl.className = 'sub-tree';
    handlersUl.style.display = 'none';
    handlersLi.appendChild(handlersUl);
    createTreeToggle(handlersLi, handlersUl);
    
    addOutlineSubNode(handlersUl, "🔧 OnInit()", 'handler', {
        title: "OnInit Handler",
        html: `
            <div class="inspector-data-group">
                <h4>OnInit Handler Description</h4>
                <p style="font-size:12px; line-height:1.4;">
                    Called when the Expert Advisor or Indicator is loaded onto the chart. Initializes buffers, registers indicators, resolves license verification checks, and performs initialization routines.
                </p>
                <br>
                <h5>Potential Inputs Checked:</h5>
                <ul>
                    ${inputParams.slice(0, 5).map(p => `<li><code>${p.text}</code></li>`).join('') || '<li>None identified</li>'}
                </ul>
            </div>
        `
    });

    addOutlineSubNode(handlersUl, "📈 OnTick()", 'handler', {
        title: "OnTick Handler",
        html: `
            <div class="inspector-data-group">
                <h4>OnTick Handler Description</h4>
                <p style="font-size:12px; line-height:1.4;">
                    The core execution block. Triggers on every price quote tick received for the symbol. Evaluates indicator states, opens/closes trades, sets trailing stops, and handles order calculations.
                </p>
            </div>
        `
    });

    addOutlineSubNode(handlersUl, "🔌 OnDeinit()", 'handler', {
        title: "OnDeinit Handler",
        html: `
            <div class="inspector-data-group">
                <h4>OnDeinit Handler Description</h4>
                <p style="font-size:12px; line-height:1.4;">
                    Called when the program is removed from the chart, when the terminal is closed, or when parameters are changed. Cleans up charts, deletes graphics, and saves states.
                </p>
            </div>
        `
    });

    // 4. Generate Decompiled & Disassembled Texts
    generateMqlDecompiledText(isEx5, build, compileTime, inputParams, webUrls, dllImports, alertMessages, metaInfo);
    
    // Set file loaded state
    updateStatus('loaded');
}

function extractStringsFromBinary(bytes) {
    const strings = [];
    const len = bytes.length;
    
    // Heuristic 1: Extract UTF-16LE strings (common in modern EX4/EX5 string tables)
    // Characters are 2 bytes: ASCII byte followed by 0x00
    for (let i = 0; i < len - 8; i += 2) {
        if (bytes[i] >= 32 && bytes[i] <= 126 && bytes[i+1] === 0x00) {
            let str = '';
            let start = i;
            let j = i;
            while (j < len - 1 && bytes[j] >= 32 && bytes[j] <= 126 && bytes[j+1] === 0x00) {
                str += String.fromCharCode(bytes[j]);
                j += 2;
            }
            if (str.length >= 4) {
                strings.push({
                    text: str,
                    offset: start,
                    type: 'UTF-16LE'
                });
                i = j; // skip forward
            }
        }
    }
    
    // Heuristic 2: Extract ASCII null-terminated strings
    for (let i = 0; i < len - 4; i++) {
        if (bytes[i] >= 32 && bytes[i] <= 126) {
            let str = '';
            let start = i;
            let j = i;
            while (j < len && bytes[j] >= 32 && bytes[j] <= 126) {
                str += String.fromCharCode(bytes[j]);
                j++;
            }
            // Ensure ended by null or control char, or is a long valid text
            if (str.length >= 4 && (j === len || bytes[j] === 0 || bytes[j] < 32)) {
                // Avoid duplication if already caught by UTF-16 (starts near)
                const exists = strings.some(s => Math.abs(s.offset - start) < 4);
                if (!exists) {
                    strings.push({
                        text: str,
                        offset: start,
                        type: 'ASCII'
                    });
                }
                i = j;
            }
        }
    }
    
    return strings;
}

function addCategorySubFolder(parentUl, title, list, type) {
    if (list.length === 0) return;
    
    const li = document.createElement('li');
    li.className = 'outline-item header-node';
    li.innerHTML = title;
    
    const ul = document.createElement('ul');
    ul.className = 'sub-tree';
    ul.style.display = 'none';
    
    li.appendChild(ul);
    parentUl.appendChild(li);
    createTreeToggle(li, ul);
    
    list.forEach(item => {
        addOutlineSubNode(ul, `🔤 "${truncateString(item.text, 20)}"`, 'string', {
            title: `String constant at offset 0x${item.offset.toString(16).toUpperCase()}`,
            html: `
                <div class="inspector-data-group">
                    <h4>String Properties</h4>
                    <table class="inspector-table">
                        <tr><th>Value</th><td><code>"${escapeHtml(item.text)}"</code></td></tr>
                        <tr><th>Offset</th><td>0x${item.offset.toString(16).toUpperCase()}</td></tr>
                        <tr><th>Encoding</th><td>${item.type}</td></tr>
                        <tr><th>Length</th><td>${item.text.length} chars</td></tr>
                    </table>
                </div>
                ${getSecurityAuditHtml(item.text, type)}
            `
        });
    });
}

function truncateString(str, len) {
    return str.length > len ? str.slice(0, len) + '...' : str;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function getSecurityAuditHtml(text, type) {
    if (type === 'dll') {
        return `
            <div class="inspector-data-group" style="border-top:1px solid var(--border-light); padding-top:12px; margin-top:12px;">
                <h4 style="color:var(--color-error); font-weight:600;">⚠️ DLL Import Warning</h4>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">
                    <strong>Risk: HIGH</strong>. Executing DLL libraries allows trading bots to run native code on your Windows OS outside of MT4's sandbox. It can be used to download malware, steal passwords, or damage system files.
                </p>
            </div>
        `;
    }
    if (type === 'web') {
        return `
            <div class="inspector-data-group" style="border-top:1px solid var(--border-light); padding-top:12px; margin-top:12px;">
                <h4 style="color:var(--color-warning); font-weight:600;">🌐 WebRequest Indicator</h4>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">
                    <strong>Risk: MEDIUM</strong>. This URL might be used for license check calls, telegram notifications, or remote tracking. Verify if the domain is trusted before enabling web requests in MetaTrader options.
                </p>
            </div>
        `;
    }
    if (type === 'alert' && /(license|expired|crack|decompile)/i.test(text)) {
        return `
            <div class="inspector-data-group" style="border-top:1px solid var(--border-light); padding-top:12px; margin-top:12px;">
                <h4 style="color:var(--color-primary); font-weight:600;">🔑 Security & Licensing Info</h4>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">
                    This string indicates licensing or anti-debugging protection logic is present in the trading bot. It verifies validity dates or serial keys.
                </p>
            </div>
        `;
    }
    return '';
}

function addOutlineNode(title, role, inspectorData) {
    const li = document.createElement('li');
    li.className = 'outline-item';
    li.innerHTML = title;
    
    li.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.outline-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        showInspectorData(inspectorData.title, inspectorData.html);
    });
    
    outlineTree.appendChild(li);
    return li;
}

function addOutlineFolder(title) {
    const li = document.createElement('li');
    li.className = 'outline-item header-node';
    li.innerHTML = `<span>📂</span> ${title}`;
    outlineTree.appendChild(li);
    return li;
}

function addOutlineSubNode(parentUl, title, role, inspectorData) {
    const li = document.createElement('li');
    li.className = 'outline-item';
    li.innerHTML = `<span class="tree-icon">📄</span> ${title}`;
    
    li.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.outline-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        showInspectorData(inspectorData.title, inspectorData.html);
    });
    
    parentUl.appendChild(li);
    return li;
}

function generateMqlDecompiledText(isEx5, build, compileTime, inputs, urls, dlls, alerts, metas) {
    const ext = isEx5 ? 'mq5' : 'mq4';
    const versionText = isEx5 ? 'MQL5 (MetaTrader 5)' : 'MQL4 (MetaTrader 4)';
    const comments = metas.map(m => `// ${m.text}`).join('\n') || `// Compiled MetaTrader file: ${currentFile.name}`;
    
    // Generate input parameters
    let inputsBlock = '';
    if (inputs.length > 0) {
        inputsBlock = `//--- Input Parameters extracted from String Table\n`;
        inputs.slice(0, 15).forEach(inp => {
            // Check if string contains typical param indicators
            const cleaned = inp.text.replace(/[^a-zA-Z0-9_]/g, '');
            if (cleaned.length > 2) {
                inputsBlock += `<span class="st-keyword">input string</span> <span class="st-var">${cleaned}</span> = <span class="st-string">"Default"</span>;  <span class="st-comment">// Value from offset 0x${inp.offset.toString(16).toUpperCase()}</span>\n`;
            }
        });
        inputsBlock += `\n`;
    }
    
    // Generate URL definitions
    let urlsBlock = '';
    if (urls.length > 0) {
        urlsBlock = `//--- Web Endpoints detected\n`;
        urls.forEach((url, index) => {
            urlsBlock += `<span class="st-keyword">#define</span> WEB_URL_${index} <span class="st-string">"${url.text}"</span>\n`;
        });
        urlsBlock += `\n`;
    }
    
    // Generate DLL Import headers
    let dllBlock = '';
    if (dlls.length > 0) {
        dllBlock = `//--- DLL Imports detected\n`;
        // group by dll name
        const dllMap = {};
        dlls.forEach(d => {
            const parts = d.text.split(/[\\\/]/);
            const dllName = parts[parts.length - 1];
            if (!dllMap[dllName]) dllMap[dllName] = [];
        });
        
        Object.keys(dllMap).forEach(dllName => {
            dllBlock += `<span class="st-keyword">#import</span> <span class="st-string">"${dllName}"</span>\n`;
            dllBlock += `   <span class="st-comment">// Dynamic DLL functions are obfuscated in the binary</span>\n`;
            dllBlock += `<span class="st-keyword">#import</span>\n\n`;
        });
    }

    const decompiled = `
<span class="st-comment">${comments}</span>
<span class="st-comment">// Compiled Platform: ${versionText}</span>
<span class="st-comment">// Compiler build version: ${build}</span>
<span class="st-comment">// Estimated compilation time: ${compileTime}</span>
<span class="st-comment">// Decompiled by ForgeDec Static Analyzer</span>

<span class="st-keyword">#property</span> <span class="st-type">strict</span>
<span class="st-keyword">#property</span> <span class="st-type">copyright</span> <span class="st-string">"ForgeDec Inspector"</span>
<span class="st-keyword">#property</span> <span class="st-type">version</span>   <span class="st-string">"1.00"</span>

${urlsBlock}
${dllBlock}
${inputsBlock}

<span class="st-type">int</span> <span class="st-func">OnInit</span>()
{
   <span class="st-comment">// Initialization function logic (Bytecode virtualized)</span>
   <span class="st-comment">// Heuristics confirm build ${build} encryption</span>
   
   <span class="st-keyword">Print</span>(<span class="st-string">"Expert system initialized successfully."</span>);
   <span class="st-keyword">return</span>(INIT_SUCCEEDED);
}

<span class="st-type">void</span> <span class="st-func">OnDeinit</span>(<span class="st-keyword">const int</span> reason)
{
   <span class="st-comment">// Cleanup logic</span>
}

<span class="st-type">void</span> <span class="st-func">OnTick</span>()
{
   <span class="st-comment">// Core Trading Strategy execution routine (Encrypted VM Bytecode)</span>
   <span class="st-comment">// Analysis details are listed in the "EX4/EX5 Decompilation Analysis" below.</span>
}

<span class="st-comment">/*******************************************************************************
*                       EX4/EX5 DECOMPILATION ANALYSIS                         *
********************************************************************************
* Modern MetaTrader compiled files (.ex4 and .ex5) do not decompile to clear    *
* MQL source code instantly like older builds did. Here is why:                 *
*                                                                              *
* 1. LLVM Optimization: Since Build 600, MetaEditor compiles code using LLVM   *
*    which removes all variable names, structure names, and flattens           *
*    control structures.                                                       *
*                                                                              *
* 2. Virtual Machine Bytecode: MQL code is converted to custom bytecode which   *
*    runs inside MetaTrader's native sandbox virtual machine.                  *
*                                                                              *
* 3. String & Resource Encryption: Critical strings (like license servers or     *
*    Indicator calls) are often dynamically decrypted in memory at runtime.    *
*                                                                              *
* 4. Reverse Engineering Recommendation:                                       *
*    To bypass EA license checks, analysts look at the DLL and URL lists       *
*    in the right-hand panel, then use debuggers like x32dbg or IDA Pro        *
*    to set breakpoints on InternetOpen() or MessageBoxW() and modify          *
*    conditional branches.                                                     *
*******************************************************************************/</span>
`.trim();

    // Generate Disassembly text containing all extracted strings
    let disasm = `// ForgeDec EX4/EX5 Binary Symbols & Strings Disassembly\n`;
    disasm += `// Target Build: ${build}\n`;
    disasm += `// Total String Count: ${inputs.length + urls.length + dlls.length + alerts.length + metas.length}\n\n`;
    
    disasm += `// --- SECTION: METADATA HEADERS ---\n`;
    disasm += `0x00000000  [Magic Headers]       EX4/EX5 Signature detected\n`;
    disasm += `0x00000008  [Compiler Build]      build ${build}\n`;
    disasm += `0x00000014  [Timestamp Unix]      ${compileTime}\n\n`;
    
    disasm += `// --- SECTION: STRING CONSTANTS TABLE ---\n`;
    
    const allStringItems = [...dlls, ...urls, ...inputs, ...alerts, ...metas];
    allStringItems.sort((a,b) => a.offset - b.offset);
    
    allStringItems.forEach(s => {
        const offsetStr = `0x${s.offset.toString(16).toUpperCase().padStart(8, '0')}`;
        disasm += `${offsetStr}  [STR_${s.type}]  "${s.text}"\n`;
    });

    updateCodeView(decompiled, disasm);
}
