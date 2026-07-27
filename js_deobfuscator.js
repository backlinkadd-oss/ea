function processJavaScript() {
    const bytes = currentFile.uint8Array;
    const text = new TextDecoder('utf-8').decode(bytes);
    
    updateStatus('processing', 'Formatting JavaScript...');
    
    // 1. Basic AST/Regex Outline generation
    outlineTree.innerHTML = '';
    const mainJsLi = addOutlineFolder(currentFile.name);
    const subTreeUl = document.createElement('ul');
    mainJsLi.appendChild(subTreeUl);
    createTreeToggle(mainJsLi, subTreeUl);
    
    // Find defined functions using regex
    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
    const arrowFuncRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/g;
    
    const functions = [];
    let match;
    
    while ((match = funcRegex.exec(text)) !== null) {
        if (!functions.includes(match[1])) functions.push(match[1]);
    }
    while ((match = arrowFuncRegex.exec(text)) !== null) {
        if (!functions.includes(match[1])) functions.push(match[1]);
    }

    if (functions.length > 0) {
        const funcsLi = addOutlineSubNode(subTreeUl, `📂 Functions (${functions.length})`, 'folder', {
            title: "JavaScript Functions",
            html: `<h4>Function count: ${functions.length}</h4>`
        });
        const funcsUl = document.createElement('ul');
        funcsUl.className = 'sub-tree';
        funcsUl.style.display = 'none';
        funcsLi.appendChild(funcsUl);
        createTreeToggle(funcsLi, funcsUl);
        
        functions.forEach(name => {
            addOutlineSubNode(funcsUl, `ƒ ${name}()`, 'func', {
                title: `Function: ${name}`,
                html: `<div class="inspector-data-group"><h4>Function Info</h4><p>Name: <code>${name}</code></p></div>`
            });
        });
    }

    // 2. Perform beautification and unicode decoding deobfuscation
    let beautified = beautifyJs(text);
    beautified = decodeUnicodeHexEscapes(beautified);
    
    // Highlight syntax basic
    const highlighted = highlightJsSyntax(beautified);
    
    updateCodeView(highlighted, `// JavaScript Disassembly: Not applicable. Review decompiled output.`);
    updateStatus('loaded');
}

// Simple JS beautifier
function beautifyJs(js) {
    let output = '';
    let indent = 0;
    const tab = '    ';
    
    // Clean spaces first
    js = js.replace(/\s+/g, ' ');
    
    for (let i = 0; i < js.length; i++) {
        const char = js[i];
        
        if (char === '{') {
            indent++;
            output += ' {\n' + tab.repeat(indent);
        } else if (char === '}') {
            indent = Math.max(0, indent - 1);
            // remove last trailing spaces
            if (output.endsWith(tab)) {
                output = output.slice(0, -tab.length);
            }
            output += '\n' + tab.repeat(indent) + '}';
            // Check next char
            if (i + 1 < js.length && js[i + 1] !== ';') {
                output += '\n' + tab.repeat(indent);
            }
        } else if (char === ';') {
            output += ';\n' + tab.repeat(indent);
        } else if (char === ',') {
            output += ', ';
        } else {
            // handle basic operators spaces
            if (['+', '-', '*', '/', '=', '<', '>', '&', '|'].includes(char)) {
                // Ensure spaces around operators unless they are double (e.g. ++, --, ==, &&, ||)
                const prev = output.trim().slice(-1);
                const next = js[i + 1];
                if (prev !== ' ' && !['+', '-', '=', '&', '|', '<', '>'].includes(prev)) {
                    output += ' ';
                }
                output += char;
                if (next !== ' ' && !['+', '-', '=', '&', '|', '<', '>', ';'].includes(next)) {
                    output += ' ';
                }
            } else {
                output += char;
            }
        }
    }
    
    // Clean up empty lines and formatting artifacts
    return output.replace(/\n\s*\n/g, '\n').trim();
}

// Decodes unicode and hex escape sequences (e.g. \x61 -> a, \u0061 -> a)
function decodeUnicodeHexEscapes(js) {
    // Replace \xXX sequences
    js = js.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
        const charCode = parseInt(hex, 16);
        // Only decode printable ASCII to avoid breaking control/special structures
        if (charCode >= 32 && charCode <= 126) {
            return String.fromCharCode(charCode);
        }
        return match;
    });
    
    // Replace \uXXXX sequences
    js = js.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
        const charCode = parseInt(hex, 16);
        if (charCode >= 32 && charCode <= 126) {
            return String.fromCharCode(charCode);
        }
        return match;
    });
    
    return js;
}

// Quick keyword highlighter
function highlightJsSyntax(js) {
    const keywords = [
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
        'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
        'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
        'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'enum'
    ];
    
    // Escape HTML first
    let escaped = escapeHtml(js);
    
    // Regex keyword highlight
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    escaped = escaped.replace(kwRegex, '<span class="st-keyword">$1</span>');
    
    // Highlight strings
    escaped = escaped.replace(/(["'])(.*?)\1/g, '<span class="st-string">"$2"</span>');
    
    // Highlight numbers
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="st-number">$1</span>');
    
    // Highlight comments
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="st-comment">$1</span>');
    
    return escaped;
}
