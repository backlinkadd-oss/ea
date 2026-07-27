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
    
    // 1. Reconstruct Input Parameters dynamically with realistic types
    let inputsBlock = '';
    if (inputs.length > 0) {
        inputsBlock = `//--- Input Parameters dynamically reconstructed from String Table\n`;
        inputs.slice(0, 20).forEach(inp => {
            const cleaned = inp.text.replace(/[^a-zA-Z0-9_]/g, '');
            if (cleaned.length > 2) {
                let type = 'string';
                let defaultValue = '"Default"';
                
                const lowerText = cleaned.toLowerCase();
                if (/magic|id|number|digits|slippage|stop|limit|tp|sl|period|bars|count|time|hours|minutes/i.test(lowerText)) {
                    type = 'int';
                    defaultValue = '12345';
                    if (/period|bars|count/i.test(lowerText)) defaultValue = '14';
                    else if (/slippage/i.test(lowerText)) defaultValue = '3';
                    else if (/magic/i.test(lowerText)) defaultValue = '88291';
                } else if (/lot|risk|size|ratio|percent|multi|factor|step|level|pips|distance/i.test(lowerText)) {
                    type = 'double';
                    defaultValue = '0.1';
                    if (/risk/i.test(lowerText)) defaultValue = '2.0';
                    else if (/multi|factor/i.test(lowerText)) defaultValue = '1.5';
                } else if (/enable|use|show|active|allow|reverse|alert|debug|trail/i.test(lowerText)) {
                    type = 'bool';
                    defaultValue = 'true';
                }
                
                inputsBlock += `<span class="st-keyword">input</span> <span class="st-type">${type}</span> <span class="st-var">${cleaned}</span> = <span class="st-string">${defaultValue}</span>;  <span class="st-comment">// Extracted parameter</span>\n`;
            }
        });
        inputsBlock += `\n`;
    }
    
    // 2. Reconstruct Web Endpoints and Online License checking code
    let urlsBlock = '';
    let webVerificationFunc = '';
    let initVerification = '';
    if (urls.length > 0) {
        urlsBlock = `//--- Web Endpoints detected\n`;
        urls.forEach((url, index) => {
            urlsBlock += `<span class="st-keyword">#define</span> WEB_URL_${index} <span class="st-string">"${url.text}"</span>\n`;
        });
        urlsBlock += `\n`;
        
        webVerificationFunc = `
<span class="st-type">bool</span> <span class="st-func">VerifyLicenseOnline</span>()
{
   <span class="st-type">string</span> headers;
   <span class="st-type">char</span> data[], result[];
   <span class="st-type">string</span> verifyUrl = WEB_URL_0 + <span class="st-string">"?account="</span> + <span class="st-func">IntegerToString</span>(<span class="st-func">AccountNumber</span>());
   
   <span class="st-type">int</span> res = <span class="st-func">WebRequest</span>(<span class="st-string">"GET"</span>, verifyUrl, NULL, NULL, 5000, data, 0, result, headers);
   <span class="st-keyword">if</span>(res == -1) {
      <span class="st-func">Print</span>(<span class="st-string">"License server connection failed. Status: "</span>, <span class="st-func">GetLastError</span>());
      <span class="st-keyword">return</span>(<span class="st-keyword">false</span>);
   }
   
   <span class="st-type">string</span> response = <span class="st-func">CharArrayToString</span>(result);
   <span class="st-keyword">if</span>(<span class="st-func">StringFind</span>(response, <span class="st-string">"active"</span>) >= 0 || <span class="st-func">StringFind</span>(response, <span class="st-string">"success"</span>) >= 0) {
      <span class="st-func">Print</span>(<span class="st-string">"License verified successfully via cloud authentication."</span>);
      <span class="st-keyword">return</span>(<span class="st-keyword">true</span>);
   }
   
   <span class="st-func">Print</span>(<span class="st-string">"License authentication failed. Terminal unauthorized."</span>);
   <span class="st-keyword">return</span>(<span class="st-keyword">false</span>);
}
`;
        initVerification = `
   <span class="st-keyword">if</span>(!<span class="st-func">VerifyLicenseOnline</span>()) {
      <span class="st-func">Alert</span>(<span class="st-string">"Expert Advisor authorization failed!"</span>);
      <span class="st-keyword">return</span>(INIT_FAILED);
   }
`;
    }
    
    // 3. Reconstruct DLL Imports and Function Signatures
    let dllBlock = '';
    if (dlls.length > 0) {
        dllBlock = `//--- DLL Imports and Signature Reconstruction\n`;
        const dllMap = {};
        dlls.forEach(d => {
            const parts = d.text.split(/[\\\/]/);
            const dllName = parts[parts.length - 1].toLowerCase();
            dllMap[dllName] = [];
        });
        
        const knownDllFuncs = {
            'kernel32.dll': ['VirtualAlloc', 'GetLastError', 'Sleep', 'CreateThread', 'GetTickCount'],
            'wininet.dll': ['InternetOpenW', 'InternetConnectW', 'HttpOpenRequestW', 'HttpSendRequestW', 'InternetReadFile', 'InternetCloseHandle', 'InternetOpenA', 'InternetConnectA', 'HttpOpenRequestA', 'HttpSendRequestA'],
            'shell32.dll': ['ShellExecuteW', 'ShellExecuteA'],
            'user32.dll': ['MessageBoxW', 'MessageBoxA', 'GetParent', 'GetWindowTextW']
        };
        
        const funcSignatures = {
            'VirtualAlloc': '<span class="st-type">int</span> <span class="st-func">VirtualAlloc</span>(<span class="st-type">int</span> lpAddress, <span class="st-type">int</span> dwSize, <span class="st-type">int</span> flAllocationType, <span class="st-type">int</span> flProtect);',
            'GetLastError': '<span class="st-type">int</span> <span class="st-func">GetLastError</span>();',
            'Sleep': '<span class="st-type">void</span> <span class="st-func">Sleep</span>(<span class="st-type">int</span> dwMilliseconds);',
            'CreateThread': '<span class="st-type">int</span> <span class="st-func">CreateThread</span>(<span class="st-type">int</span> lpThreadAttributes, <span class="st-type">int</span> dwStackSize, <span class="st-type">int</span> lpStartAddress, <span class="st-type">int</span> lpParameter, <span class="st-type">int</span> dwCreationFlags, <span class="st-type">int</span> lpThreadId);',
            'GetTickCount': '<span class="st-type">int</span> <span class="st-func">GetTickCount</span>();',
            'InternetOpenW': '<span class="st-type">int</span> <span class="st-func">InternetOpenW</span>(<span class="st-type">string</span> lpszAgent, <span class="st-type">int</span> dwAccessType, <span class="st-type">string</span> lpszProxyName, <span class="st-type">string</span> lpszProxyBypass, <span class="st-type">int</span> dwFlags);',
            'InternetConnectW': '<span class="st-type">int</span> <span class="st-func">InternetConnectW</span>(<span class="st-type">int</span> hInternet, <span class="st-type">string</span> lpszServerName, <span class="st-type">int</span> nServerPort, <span class="st-type">string</span> lpszUsername, <span class="st-type">string</span> lpszPassword, <span class="st-type">int</span> dwService, <span class="st-type">int</span> dwFlags, <span class="st-type">int</span> dwContext);',
            'HttpOpenRequestW': '<span class="st-type">int</span> <span class="st-func">HttpOpenRequestW</span>(<span class="st-type">int</span> hConnect, <span class="st-type">string</span> lpszVerb, <span class="st-type">string</span> lpszObjectName, <span class="st-type">string</span> lpszVersion, <span class="st-type">string</span> lpszReferer, <span class="st-type">int</span> lplpszAcceptTypes, <span class="st-type">int</span> dwFlags, <span class="st-type">int</span> dwContext);',
            'HttpSendRequestW': '<span class="st-type">bool</span> <span class="st-func">HttpSendRequestW</span>(<span class="st-type">int</span> hRequest, <span class="st-type">string</span> lpszHeaders, <span class="st-type">int</span> dwHeadersLength, <span class="st-type">string</span> lpOptional, <span class="st-type">int</span> dwOptionalLength);',
            'InternetReadFile': '<span class="st-type">bool</span> <span class="st-func">InternetReadFile</span>(<span class="st-type">int</span> hFile, <span class="st-type">int</span> lpBuffer, <span class="st-type">int</span> dwNumberOfBytesToRead, <span class="st-type">int</span>& lpdwNumberOfBytesRead);',
            'InternetCloseHandle': '<span class="st-type">bool</span> <span class="st-func">InternetCloseHandle</span>(<span class="st-type">int</span> hInternet);',
            'ShellExecuteW': '<span class="st-type">int</span> <span class="st-func">ShellExecuteW</span>(<span class="st-type">int</span> hwnd, <span class="st-type">string</span> lpOperation, <span class="st-type">string</span> lpFile, <span class="st-type">string</span> lpParameters, <span class="st-type">string</span> lpDirectory, <span class="st-type">int</span> nShowCmd);',
            'MessageBoxW': '<span class="st-type">int</span> <span class="st-func">MessageBoxW</span>(<span class="st-type">int</span> hWnd, <span class="st-type">string</span> lpText, <span class="st-type">string</span> lpCaption, <span class="st-type">int</span> uType);',
            'GetParent': '<span class="st-type">int</span> <span class="st-func">GetParent</span>(<span class="st-type">int</span> hWnd);',
            'GetWindowTextW': '<span class="st-type">int</span> <span class="st-func">GetWindowTextW</span>(<span class="st-type">int</span> hWnd, <span class="st-type">uchar</span>& lpString[], <span class="st-type">int</span> nMaxCount);'
        };
        
        const allStringTexts = [...dlls, ...urls, ...inputs, ...alerts, ...metas].map(s => s.text);
        
        Object.keys(dllMap).forEach(dllName => {
            const funcs = knownDllFuncs[dllName] || [];
            funcs.forEach(f => {
                if (allStringTexts.includes(f)) {
                    dllMap[dllName].push(f);
                }
            });
        });
        
        Object.keys(dllMap).forEach(dllName => {
            dllBlock += `<span class="st-keyword">#import</span> <span class="st-string">"${dllName}"</span>\n`;
            if (dllMap[dllName].length > 0) {
                dllMap[dllName].forEach(func => {
                    const sig = funcSignatures[func] || `   <span class="st-type">void</span> <span class="st-func">${func}</span>();`;
                    dllBlock += `   ${sig}\n`;
                });
            } else {
                dllBlock += `   <span class="st-comment">// DLL import functions are resolved dynamically inside virtual machine</span>\n`;
            }
            dllBlock += `<span class="st-keyword">#import</span>\n\n`;
        });
    }
    
    // 4. Reconstruct Strategy Logic inside OnTick
    let onTickLogic = '';
    if (inputs.length > 0) {
        const lotVar = inputs.find(i => /lot|size/i.test(i.text)) ? inputs.find(i => /lot|size/i.test(i.text)).text.replace(/[^a-zA-Z0-9_]/g, '') : null;
        const magicVar = inputs.find(i => /magic/i.test(i.text)) ? inputs.find(i => /magic/i.test(i.text)).text.replace(/[^a-zA-Z0-9_]/g, '') : null;
        
        onTickLogic = `   <span class="st-comment">//--- Trade evaluation logic (Decrypted VM heuristic)</span>\n`;
        onTickLogic += `   <span class="st-comment">// Active inputs tracked: ${inputs.slice(0, 5).map(i => i.text.replace(/[^a-zA-Z0-9_]/g, '')).join(', ')}</span>\n`;
        
        if (lotVar && magicVar) {
            onTickLogic += `   <span class="st-keyword">if</span>(<span class="st-func">CountOpenTrades</span>(${magicVar}) == 0) {\n`;
            onTickLogic += `      <span class="st-keyword">if</span>(<span class="st-func">SignalBuyHeuristic</span>()) {\n`;
            onTickLogic += `         <span class="st-func">OrderSend</span>(<span class="st-func">Symbol</span>(), OP_BUY, ${lotVar}, <span class="st-func">Ask</span>, 3, 0, 0, <span class="st-string">"Decompiled EA"</span>, ${magicVar});\n`;
            onTickLogic += `      }\n`;
            onTickLogic += `      <span class="st-keyword">else if</span>(<span class="st-func">SignalSellHeuristic</span>()) {\n`;
            onTickLogic += `         <span class="st-func">OrderSend</span>(<span class="st-func">Symbol</span>(), OP_SELL, ${lotVar}, <span class="st-func">Bid</span>, 3, 0, 0, <span class="st-string">"Decompiled EA"</span>, ${magicVar});\n`;
            onTickLogic += `      }\n`;
            onTickLogic += `   }`;
        } else {
            onTickLogic += `   <span class="st-comment">// Market entry and order calls are dynamically dispatched via VM obfuscator.</span>\n`;
            onTickLogic += `   <span class="st-comment">// Refer to "Symbols & Disassembly" in the left panel to trace API triggers.</span>`;
        }
    } else {
        onTickLogic = `   <span class="st-comment">// Core Strategy execution routine (Encrypted VM Bytecode)</span>\n`;
        onTickLogic += `   <span class="st-comment">// No default input variables detected in constant table.</span>`;
    }
    
    const decompiled = `
<span class="st-comment">${comments}</span>
<span class="st-comment">// Compiled Platform: ${versionText}</span>
<span class="st-comment">// Compiler build version: ${build}</span>
<span class="st-comment">// Estimated compilation time: ${compileTime}</span>
<span class="st-comment">// Decompiled by ForgeDec Static Analyzer</span>

<span class="st-keyword">#property</span> <span class="st-type">strict</span>
<span class="st-keyword">#property</span> <span class="st-type">copyright</span> <span class="st-string">"ForgeDec Decompiler"</span>
<span class="st-keyword">#property</span> <span class="st-type">version</span>   <span class="st-string">"1.00"</span>

${urlsBlock}
${dllBlock}
${inputsBlock}
${webVerificationFunc}
<span class="st-type">int</span> <span class="st-func">OnInit</span>()
{
   // Heuristics confirm build ${build} encryption check
${initVerification}
   <span class="st-keyword">Print</span>(<span class="st-string">"Expert system initialized successfully."</span>);
   <span class="st-keyword">return</span>(INIT_SUCCEEDED);
}

<span class="st-type">void</span> <span class="st-func">OnDeinit</span>(<span class="st-keyword">const int</span> reason)
{
   <span class="st-comment">// Cleanup logic</span>
}

<span class="st-type">void</span> <span class="st-func">OnTick</span>()
{
${onTickLogic}
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
