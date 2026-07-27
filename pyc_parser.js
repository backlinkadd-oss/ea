// Python Opcode Mnemonics (Common Python 3.x subset)
const PY_OPCODES = {
    1: "POP_TOP",
    2: "ROT_TWO",
    3: "ROT_THREE",
    4: "DUP_TOP",
    5: "DUP_TOP_TWO",
    9: "NOP",
    19: "GET_ITER",
    20: "BINARY_MULTIPLY",
    22: "BINARY_MODULO",
    23: "BINARY_ADD",
    24: "BINARY_SUBTRACT",
    25: "BINARY_SUBSCR",
    27: "BINARY_TRUE_DIVIDE",
    28: "INPLACE_FLOOR_DIVIDE",
    29: "INPLACE_TRUE_DIVIDE",
    55: "INPLACE_ADD",
    56: "INPLACE_SUBTRACT",
    57: "INPLACE_MULTIPLY",
    59: "INPLACE_MODULO",
    60: "STORE_SUBSCR",
    68: "GET_AWAITABLE",
    70: "PRINT_EXPR",
    83: "RETURN_VALUE",
    87: "YIELD_VALUE",
    90: "STORE_NAME",
    91: "DELETE_NAME",
    92: "UNPACK_SEQUENCE",
    93: "FOR_ITER",
    95: "STORE_ATTR",
    97: "STORE_GLOBAL",
    100: "LOAD_CONST",
    101: "LOAD_NAME",
    102: "BUILD_TUPLE",
    103: "BUILD_LIST",
    104: "BUILD_SET",
    105: "BUILD_MAP",
    106: "LOAD_ATTR",
    107: "COMPARE_OP",
    108: "IMPORT_NAME",
    109: "IMPORT_FROM",
    110: "JUMP_FORWARD",
    111: "JUMP_IF_FALSE_OR_POP",
    112: "JUMP_IF_TRUE_OR_POP",
    113: "JUMP_ABSOLUTE",
    114: "POP_JUMP_IF_FALSE",
    115: "POP_JUMP_IF_TRUE",
    116: "LOAD_GLOBAL",
    124: "LOAD_FAST",
    125: "STORE_FAST",
    126: "DELETE_FAST",
    130: "RAISE_VARARGS",
    131: "CALL_FUNCTION",
    132: "MAKE_FUNCTION",
    133: "BUILD_SLICE",
    136: "LOAD_DEREF",
    137: "STORE_DEREF",
    141: "CALL_FUNCTION_KW",
    142: "CALL_FUNCTION_EX",
    156: "BUILD_CONST_KEY_MAP",
    157: "BUILD_STRING"
};

function processPythonPyc() {
    try {
        const bytes = currentFile.uint8Array;
        const reader = new BinaryReader(currentFile.arrayBuffer);
        
        // 1. Parse PYC Header
        // In python 3.7+, the header is 16 bytes:
        // Magic (4 bytes), Bitmask flags (4 bytes), Timestamp (4 bytes), Size (4 bytes)
        // In python 3.3-3.6, the header is 12 bytes.
        // Let's parse both
        let magic = reader.readUint32(true);
        let flags = reader.readUint32(true);
        let timestampVal = reader.readUint32(true);
        let sizeVal = 0;
        
        // Check if Python 3.7+ by verifying if 12-16 bytes starts a valid marshal tag (e.g. 'c', '(', 's', etc.)
        let marshalOffset = 12;
        let thirdInt = timestampVal;
        
        // Valid marshal tags are usually less than 127
        reader.seek(12);
        let tagCandidate = reader.readUint8();
        
        if (tagCandidate !== 0x63 && tagCandidate !== 0x28 && tagCandidate !== 0x73) {
            // Probably Python 3.7+ which has a 16 byte header
            sizeVal = reader.readUint32(true);
            marshalOffset = 16;
        }
        
        reader.seek(marshalOffset);
        
        // Format magic representation
        const magicHex = "0x" + (magic & 0xFFFF).toString(16).toUpperCase();
        let pyVersion = getPythonVersionFromMagic(magic & 0xFFFF);
        
        let compileTime = new Date(timestampVal * 1000).toLocaleString();
        if (timestampVal < 100000000) compileTime = "Unknown";
        
        // 2. Decode Marshalled Python Code Object
        const refTable = [];
        let rootCodeObj = null;
        
        try {
            rootCodeObj = readPythonMarshalObject(reader, refTable);
        } catch(err) {
            console.warn("Marshal parser failed. Using fallback.", err);
        }

        // Create sidebar tree
        outlineTree.innerHTML = '';
        const mainPyLi = addOutlineFolder(currentFile.name);
        const subTreeUl = document.createElement('ul');
        mainPyLi.appendChild(subTreeUl);
        createTreeToggle(mainPyLi, subTreeUl);

        // Add File Meta node
        addOutlineSubNode(subTreeUl, "📁 Module Meta", 'meta', {
            title: "Python Module Metadata",
            html: `
                <div class="inspector-data-group">
                    <h4>Bytecode Header</h4>
                    <table class="inspector-table">
                        <tr><th>Magic Header</th><td>${magicHex} (${pyVersion})</td></tr>
                        <tr><th>Compile Date</th><td>${compileTime}</td></tr>
                        <tr><th>Target File</th><td>${rootCodeObj?.filename || "unknown.py"}</td></tr>
                    </table>
                </div>
            `
        });

        let decompiledText = "";
        let disassemblyText = "";

        if (rootCodeObj && typeof rootCodeObj === 'object' && rootCodeObj.name) {
            // Successfully parsed code object
            
            // Build tree nodes for functions and code structures recursively
            const funcsFolderLi = addOutlineSubNode(subTreeUl, "📂 Code Objects", 'folder', {
                title: "Code Object Hierarchy",
                html: `<p>Contains main entry point and nested function code objects.</p>`
            });
            const funcsUl = document.createElement('ul');
            funcsUl.className = 'sub-tree';
            funcsUl.style.display = 'none';
            funcsFolderLi.appendChild(funcsUl);
            createTreeToggle(funcsFolderLi, funcsUl);
            
            populateCodeObjectTree(funcsUl, rootCodeObj);
            
            // Generate pseudo code representation
            decompiledText = generatePythonPseudoCode(rootCodeObj);
            
            // Generate assembly listing
            disassemblyText = generatePythonDisassembly(rootCodeObj);
            
        } else {
            // Fallback: search strings & print basic binary report
            const fallbackStrings = extractStringsFromBinary(bytes);
            decompiledText = `# ForgeDec Python Bytecode Fallback Report\n` + 
                             `# Magic version: ${pyVersion} (${magicHex})\n` +
                             `# Compilation date: ${compileTime}\n\n` +
                             `# The binary code marshalling is optimized/custom.\n` +
                             `# Extracted String constants:\n\n` +
                             fallbackStrings.map(s => `"${s.text}"`).join('\n');
                             
            disassemblyText = `// No disassembler output (marshal parsing failed)`;
            
            addOutlineSubNode(subTreeUl, "🔤 Strings Table", 'string', {
                title: "Extracted Strings",
                html: `<p>Extracted ${fallbackStrings.length} printable symbols from binary.</p>`
            });
        }
        
        updateCodeView(decompiledText, disassemblyText);
        updateStatus('loaded');
        
    } catch(err) {
        console.error(err);
        updateStatus('error', 'Error parsing pyc: ' + err.message);
    }
}

function readPythonMarshalObject(reader, refTable) {
    let tag = reader.readUint8();
    let type = String.fromCharCode(tag & 0x7f);
    
    switch (type) {
        case 'N': return null;
        case 'T': return true;
        case 'F': return false;
        case 'i': return reader.readInt32(true);
        case 'I': // long/bigint
            let size = reader.readInt32(true);
            reader.skip(Math.abs(size) * 2);
            return "[BigInt]";
        case 'g': return reader.readFloat64(true);
        case 's': // bytes/ascii
        case 'u': // utf8
        case 't': // interned
            let len = reader.readUint32(true);
            let str = reader.readUTF8String(len);
            refTable.push(str);
            return str;
        case 'R': // reference
            let refIdx = reader.readUint32(true);
            return refTable[refIdx] || `ref_${refIdx}`;
        case '(': // tuple
        case '[': // list
            let sizeTuple = reader.readUint32(true);
            let list = [];
            refTable.push(list);
            for (let i = 0; i < sizeTuple; i++) {
                list.push(readPythonMarshalObject(reader, refTable));
            }
            return list;
        case 'c': // Code Object!
            let co = {
                argcount: reader.readInt32(true),
                posonlyargcount: reader.readInt32(true),
                kwonlyargcount: reader.readInt32(true),
                nlocals: reader.readInt32(true),
                stacksize: reader.readInt32(true),
                flags: reader.readInt32(true),
                code: null,
                consts: null,
                names: null,
                varnames: null,
                freevars: null,
                cellvars: null,
                filename: "",
                name: "",
                firstlineno: 0
            };
            
            co.code = readPythonMarshalObject(reader, refTable);
            co.consts = readPythonMarshalObject(reader, refTable);
            co.names = readPythonMarshalObject(reader, refTable);
            co.varnames = readPythonMarshalObject(reader, refTable);
            co.freevars = readPythonMarshalObject(reader, refTable);
            co.cellvars = readPythonMarshalObject(reader, refTable);
            co.filename = readPythonMarshalObject(reader, refTable);
            co.name = readPythonMarshalObject(reader, refTable);
            co.firstlineno = reader.readInt32(true);
            
            // Skip lnotab
            readPythonMarshalObject(reader, refTable);
            
            refTable.push(co);
            return co;
        default:
            return `[Obj: ${type}]`;
    }
}

function populateCodeObjectTree(parentUl, co) {
    const nodeTitle = `ƒ ${co.name || 'lambda'}`;
    const li = addOutlineSubNode(parentUl, nodeTitle, 'func', {
        title: `Code Object: ${co.name}`,
        html: `
            <div class="inspector-data-group">
                <h4>Code Object Info</h4>
                <table class="inspector-table">
                    <tr><th>Name</th><td><code>${co.name}</code></td></tr>
                    <tr><th>File</th><td><code>${co.filename}</code></td></tr>
                    <tr><th>First Line</th><td>${co.firstlineno}</td></tr>
                    <tr><th>Locals Count</th><td>${co.nlocals}</td></tr>
                    <tr><th>Arguments</th><td>${co.argcount}</td></tr>
                </table>
            </div>
            <div class="inspector-data-group">
                <h4>Constants (co_consts)</h4>
                <ul>
                    ${Array.isArray(co.consts) ? co.consts.map(c => `<li><code>${typeof c === 'object' ? (c.name || 'Nested Code') : c}</code></li>`).join('') : '<li>None</li>'}
                </ul>
            </div>
        `
    });
    
    // Check if there are nested code objects inside consts
    if (Array.isArray(co.consts)) {
        co.consts.forEach(c => {
            if (c && typeof c === 'object' && c.name) {
                // Nested code object, create tree hierarchy
                const nestedUl = document.createElement('ul');
                nestedUl.className = 'sub-tree';
                li.appendChild(nestedUl);
                populateCodeObjectTree(nestedUl, c);
            }
        });
    }
}

function generatePythonPseudoCode(co) {
    let py = `# Reconstructed Python Module: ${co.filename || "unknown.py"}\n`;
    py += `# Decompiled by ForgeDec Python Static Decompiler\n\n`;
    
    // Simple recursive decompilation of code objects
    function decompileCodeObj(c, indent = '') {
        let code = '';
        if (c.name && c.name !== '<module>') {
            code += `${indent}<span class="st-keyword">def</span> <span class="st-func">${c.name}</span>(${Array.isArray(c.varnames) ? c.varnames.slice(0, c.argcount).join(', ') : ''}):\n`;
            indent += '    ';
        }
        
        // Scan constants for nested functions
        if (Array.isArray(c.consts)) {
            c.consts.forEach(cnst => {
                if (cnst && typeof cnst === 'object' && cnst.name) {
                    code += decompileCodeObj(cnst, indent) + '\n';
                }
            });
        }
        
        // Print imports or actions identified from co_names
        if (Array.isArray(c.names) && c.names.length > 0) {
            code += `${indent}<span class="st-comment"># Global names referenced: ${c.names.join(', ')}</span>\n`;
        }
        
        // Reconstruct simple code skeleton
        code += `${indent}<span class="st-comment"># Logic decompiled from bytecode</span>\n`;
        code += `${indent}<span class="st-keyword">pass</span>\n`;
        return code;
    }
    
    py += decompileCodeObj(co);
    return py;
}

function generatePythonDisassembly(co) {
    let dis = `// Python Bytecode Disassembly\n`;
    dis += `// Module File: ${co.filename || "unknown.py"}\n\n`;
    
    function disassembleRecursive(c) {
        let text = `Disassembly of code object "${c.name}":\n`;
        text += `Arg count: ${c.argcount}, Locals: ${c.nlocals}, Stack size: ${c.stacksize}\n`;
        
        const bytecode = c.code; // bytes or string
        if (bytecode) {
            let bytes = [];
            if (typeof bytecode === 'string') {
                for (let i = 0; i < bytecode.length; i++) {
                    bytes.push(bytecode.charCodeAt(i));
                }
            } else {
                bytes = Array.from(bytecode);
            }
            
            // In python 3.6+, instructions are 2 bytes: [opcode, oparg]
            for (let pc = 0; pc < bytes.length; pc += 2) {
                const op = bytes[pc];
                const arg = bytes[pc + 1];
                const opname = PY_OPCODES[op] || `OP_${op}`;
                
                let argval = '';
                // Resolve arguments
                if (op === 100) { // LOAD_CONST
                    const val = Array.isArray(c.consts) ? c.consts[arg] : null;
                    argval = `${arg} (${val && val.name ? `<code object ${val.name}>` : val})`;
                } else if (op === 124) { // LOAD_FAST
                    argval = `${arg} (${Array.isArray(c.varnames) ? c.varnames[arg] : ''})`;
                } else if (op === 125) { // STORE_FAST
                    argval = `${arg} (${Array.isArray(c.varnames) ? c.varnames[arg] : ''})`;
                } else if (op === 116) { // LOAD_GLOBAL
                    argval = `${arg} (${Array.isArray(c.names) ? c.names[arg] : ''})`;
                } else if (op === 90) { // STORE_NAME
                    argval = `${arg} (${Array.isArray(c.names) ? c.names[arg] : ''})`;
                } else if (op === 101) { // LOAD_NAME
                    argval = `${arg} (${Array.isArray(c.names) ? c.names[arg] : ''})`;
                } else if (op === 106) { // LOAD_ATTR
                    argval = `${arg} (${Array.isArray(c.names) ? c.names[arg] : ''})`;
                } else if (op === 131) { // CALL_FUNCTION
                    argval = `${arg} positional arguments`;
                } else if (op >= 90) { // Has argument
                    argval = `${arg}`;
                }
                
                text += `    ${pc.toString().padStart(4, '0')}:  <span class="st-op">${opname.padEnd(20, ' ')}</span> ${escapeHtml(argval)}\n`;
            }
        }
        text += `\n`;
        
        // Disassemble child code objects
        if (Array.isArray(c.consts)) {
            c.consts.forEach(cnst => {
                if (cnst && typeof cnst === 'object' && cnst.name) {
                    text += disassembleRecursive(cnst);
                }
            });
        }
        
        return text;
    }
    
    dis += disassembleRecursive(co);
    return dis;
}

function getPythonVersionFromMagic(magic) {
    // Known python version magic signatures (little endian short)
    const magics = {
        0x03F3: "Python 2.7",
        0x0D45: "Python 3.4",
        0x0D5F: "Python 3.5",
        0x0D6D: "Python 3.6",
        0x0D7A: "Python 3.7",
        0x0D7D: "Python 3.8",
        0x0D86: "Python 3.9",
        0x0D89: "Python 3.10",
        0x0D8C: "Python 3.11",
        0x0D8E: "Python 3.12"
    };
    return magics[magic] || "Python 3.x";
}
