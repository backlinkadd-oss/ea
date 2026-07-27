const WASM_TYPES = {
    0x7F: "i32",
    0x7E: "i64",
    0x7D: "f32",
    0x7C: "f64",
    0x70: "funcref",
    0x6F: "externref",
    0x40: "void"
};

const WASM_OPCODES = {
    0x00: { name: "unreachable" },
    0x01: { name: "nop" },
    0x02: { name: "block", type: "block" },
    0x03: { name: "loop", type: "block" },
    0x04: { name: "if", type: "block" },
    0x05: { name: "else" },
    0x0B: { name: "end" },
    0x0C: { name: "br", type: "varuint" },
    0x0D: { name: "br_if", type: "varuint" },
    0x0E: { name: "br_table", type: "br_table" },
    0x0F: { name: "return" },
    0x10: { name: "call", type: "varuint" },
    0x11: { name: "call_indirect", type: "call_indirect" },
    
    0x1A: { name: "drop" },
    0x1B: { name: "select" },
    
    0x20: { name: "local.get", type: "varuint" },
    0x21: { name: "local.set", type: "varuint" },
    0x22: { name: "local.tee", type: "varuint" },
    0x23: { name: "global.get", type: "varuint" },
    0x24: { name: "global.set", type: "varuint" },
    
    0x28: { name: "i32.load", type: "memarg" },
    0x29: { name: "i64.load", type: "memarg" },
    0x2A: { name: "f32.load", type: "memarg" },
    0x2B: { name: "f64.load", type: "memarg" },
    0x2C: { name: "i32.load8_s", type: "memarg" },
    0x2D: { name: "i32.load8_u", type: "memarg" },
    0x2E: { name: "i32.load16_s", type: "memarg" },
    0x2F: { name: "i32.load16_u", type: "memarg" },
    
    0x36: { name: "i32.store", type: "memarg" },
    0x37: { name: "i64.store", type: "memarg" },
    0x38: { name: "f32.store", type: "memarg" },
    0x39: { name: "f64.store", type: "memarg" },
    
    0x41: { name: "i32.const", type: "varint" },
    0x42: { name: "i64.const", type: "varint64" },
    0x43: { name: "f32.const", type: "float32" },
    0x44: { name: "f64.const", type: "float64" },
    
    0x45: { name: "i32.eqz" },
    0x46: { name: "i32.eq" },
    0x47: { name: "i32.ne" },
    0x48: { name: "i32.lt_s" },
    0x49: { name: "i32.lt_u" },
    0x4A: { name: "i32.gt_s" },
    0x4B: { name: "i32.gt_u" },
    0x4C: { name: "i32.le_s" },
    0x4D: { name: "i32.le_u" },
    0x4E: { name: "i32.ge_s" },
    0x4F: { name: "i32.ge_u" },
    
    0x67: { name: "i32.clz" },
    0x68: { name: "i32.ctz" },
    0x69: { name: "i32.popcnt" },
    0x6A: { name: "i32.add" },
    0x6B: { name: "i32.sub" },
    0x6C: { name: "i32.mul" },
    0x6D: { name: "i32.div_s" },
    0x6E: { name: "i32.div_u" },
    0x6F: { name: "i32.rem_s" },
    0x70: { name: "i32.rem_u" },
    0x71: { name: "i32.and" },
    0x72: { name: "i32.or" },
    0x73: { name: "i32.xor" },
    0x74: { name: "i32.shl" },
    0x75: { name: "i32.shr_s" },
    0x76: { name: "i32.shr_u" },
    0x77: { name: "i32.rotl" },
    0x78: { name: "i32.rotr" }
};

// Reads unsigned LEB128 integers from BinaryReader
function readVarUint(reader) {
    let result = 0;
    let shift = 0;
    while (true) {
        let byte = reader.readUint8();
        result |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
    }
    return result;
}

// Reads signed LEB128 integers from BinaryReader
function readVarInt(reader) {
    let result = 0;
    let shift = 0;
    let byte;
    while (true) {
        byte = reader.readUint8();
        result |= (byte & 0x7f) << shift;
        shift += 7;
        if ((byte & 0x80) === 0) break;
    }
    if ((shift < 32) && (byte & 0x40)) {
        result |= (~0 << shift);
    }
    return result;
}

function processWasm() {
    try {
        const reader = new BinaryReader(currentFile.arrayBuffer);
        
        // WASM Header check
        const magic = reader.readUint32(true); // little endian
        if (magic !== 0x6D736100) { // \0asm
            throw new Error("Invalid WebAssembly magic number");
        }
        
        const version = reader.readUint32(true);
        if (version !== 1) {
            throw new Error("Unsupported WASM version: " + version);
        }

        const sections = [];
        const types = [];
        const imports = [];
        const funcs = [];
        const exports = [];
        const globals = [];
        const codes = [];
        
        // Loop and decode WASM Sections
        while (reader.hasMore()) {
            const sectionOffset = reader.offset;
            const id = reader.readUint8();
            const payloadLen = readVarUint(reader);
            const bodyOffset = reader.offset;
            
            sections.push({
                id: id,
                offset: sectionOffset,
                length: payloadLen,
                bodyOffset: bodyOffset
            });
            
            switch (id) {
                case 1: // Type Section
                    const numTypes = readVarUint(reader);
                    for (let i = 0; i < numTypes; i++) {
                        const form = reader.readUint8();
                        if (form === 0x60) { // func type
                            const numParams = readVarUint(reader);
                            const params = [];
                            for (let p = 0; p < numParams; p++) {
                                params.push(WASM_TYPES[reader.readUint8()] || "unknown");
                            }
                            const numResults = readVarUint(reader);
                            const results = [];
                            for (let r = 0; r < numResults; r++) {
                                results.push(WASM_TYPES[reader.readUint8()] || "unknown");
                            }
                            types.push({ params, results });
                        }
                    }
                    break;
                    
                case 2: // Import Section
                    const numImports = readVarUint(reader);
                    for (let i = 0; i < numImports; i++) {
                        const modLen = readVarUint(reader);
                        const module = reader.readUTF8String(modLen);
                        const fieldLen = readVarUint(reader);
                        const field = reader.readUTF8String(fieldLen);
                        const kind = reader.readUint8();
                        const desc = {};
                        if (kind === 0) { // function
                            desc.typeIdx = readVarUint(reader);
                        } else if (kind === 1) { // table
                            desc.elemType = reader.readUint8();
                            desc.limits = readVarUint(reader); // limits
                        } else if (kind === 2) { // memory
                            desc.limits = readVarUint(reader);
                        } else if (kind === 3) { // global
                            desc.valType = reader.readUint8();
                            desc.mutable = reader.readUint8();
                        }
                        imports.push({ module, field, kind, desc });
                    }
                    break;
                    
                case 3: // Function Section
                    const numFuncs = readVarUint(reader);
                    for (let i = 0; i < numFuncs; i++) {
                        funcs.push(readVarUint(reader)); // index to type
                    }
                    break;
                    
                case 6: // Global Section
                    const numGlobals = readVarUint(reader);
                    for (let i = 0; i < numGlobals; i++) {
                        const type = WASM_TYPES[reader.readUint8()] || "unknown";
                        const mut = reader.readUint8() === 1 ? "mut" : "const";
                        // Skip init expression bytes (usually end with 0x0B)
                        while (reader.readUint8() !== 0x0B);
                        globals.push({ type, mut });
                    }
                    break;
                    
                case 7: // Export Section
                    const numExports = readVarUint(reader);
                    for (let i = 0; i < numExports; i++) {
                        const nameLen = readVarUint(reader);
                        const name = reader.readUTF8String(nameLen);
                        const kind = reader.readUint8();
                        const index = readVarUint(reader);
                        exports.push({ name, kind, index });
                    }
                    break;
                    
                case 10: // Code Section
                    const numCodes = readVarUint(reader);
                    for (let i = 0; i < numCodes; i++) {
                        const codeOffset = reader.offset;
                        const bodySize = readVarUint(reader);
                        const bodyBytes = reader.readBytes(bodySize);
                        codes.push({
                            offset: codeOffset,
                            bytes: bodyBytes
                        });
                    }
                    break;
                    
                default:
                    // Skip section body for other tags
                    reader.seek(bodyOffset + payloadLen);
                    break;
            }
        }

        // 3. Assemble Sidebar outline tree
        outlineTree.innerHTML = '';
        const mainWasmLi = addOutlineFolder("wasm Module");
        const subTreeUl = document.createElement('ul');
        mainWasmLi.appendChild(subTreeUl);
        createTreeToggle(mainWasmLi, subTreeUl);

        // Sections
        const sectionsLi = addOutlineSubNode(subTreeUl, `📂 Sections`, 'folder', {
            title: "WASM Section Layout",
            html: generateWasmSectionInspectorHtml(sections)
        });
        const sectionsUl = document.createElement('ul');
        sectionsUl.className = 'sub-tree';
        sectionsUl.style.display = 'none';
        sectionsLi.appendChild(sectionsUl);
        createTreeToggle(sectionsLi, sectionsUl);
        
        const sectionNames = {
            0: "Custom", 1: "Type", 2: "Import", 3: "Function",
            4: "Table", 5: "Memory", 6: "Global", 7: "Export",
            8: "Start", 9: "Element", 10: "Code", 11: "Data", 12: "DataCount"
        };
        sections.forEach(s => {
            addOutlineSubNode(sectionsUl, `${sectionNames[s.id]} Section`, 'section', {
                title: `${sectionNames[s.id]} Section details`,
                html: `
                    <div class="inspector-data-group">
                        <h4>Section Header</h4>
                        <table class="inspector-table">
                            <tr><th>Section ID</th><td>${s.id} (${sectionNames[s.id]})</td></tr>
                            <tr><th>Offset</th><td>0x${s.offset.toString(16).toUpperCase()}</td></tr>
                            <tr><th>Body Size</th><td>${s.length} bytes</td></tr>
                        </table>
                    </div>
                `
            });
        });

        // Imports
        if (imports.length > 0) {
            const importsLi = addOutlineSubNode(subTreeUl, `📂 Imports (${imports.length})`, 'folder', {
                title: "WASM Imports",
                html: `<h4>Total Imports: ${imports.length}</h4>`
            });
            const importsUl = document.createElement('ul');
            importsUl.className = 'sub-tree';
            importsUl.style.display = 'none';
            importsLi.appendChild(importsUl);
            createTreeToggle(importsLi, importsUl);
            
            imports.forEach((imp, idx) => {
                const typeText = imp.kind === 0 ? `func #${imp.desc.typeIdx}` : 'other';
                addOutlineSubNode(importsUl, `${imp.module}.${imp.field}`, 'import', {
                    title: `Import #${idx}`,
                    html: `
                        <div class="inspector-data-group">
                            <h4>Import Info</h4>
                            <table class="inspector-table">
                                <tr><th>Module</th><td><code>${imp.module}</code></td></tr>
                                <tr><th>Field/Symbol</th><td><code>${imp.field}</code></td></tr>
                                <tr><th>Type</th><td>${typeText}</td></tr>
                            </table>
                        </div>
                    `
                });
            });
        }

        // Exports
        if (exports.length > 0) {
            const exportsLi = addOutlineSubNode(subTreeUl, `📂 Exports (${exports.length})`, 'folder', {
                title: "WASM Exports",
                html: `<h4>Total Exports: ${exports.length}</h4>`
            });
            const exportsUl = document.createElement('ul');
            exportsUl.className = 'sub-tree';
            exportsUl.style.display = 'none';
            exportsLi.appendChild(exportsUl);
            createTreeToggle(exportsLi, exportsUl);
            
            exports.forEach(exp => {
                const kindNames = ["func", "table", "memory", "global"];
                addOutlineSubNode(exportsUl, `🚀 ${exp.name}`, 'export', {
                    title: `Exported Symbol: ${exp.name}`,
                    html: `
                        <div class="inspector-data-group">
                            <h4>Export Info</h4>
                            <table class="inspector-table">
                                <tr><th>Export Name</th><td><code>${exp.name}</code></td></tr>
                                <tr><th>Kind</th><td><code>${kindNames[exp.kind] || exp.kind}</code></td></tr>
                                <tr><th>Index</th><td>#${exp.index}</td></tr>
                            </table>
                        </div>
                    `
                });
            });
        }

        // Functions
        if (funcs.length > 0) {
            const funcsLi = addOutlineSubNode(subTreeUl, `📂 Functions (${funcs.length})`, 'folder', {
                title: "WASM Internal Functions",
                html: `<h4>Function count: ${funcs.length}</h4>`
            });
            const funcsUl = document.createElement('ul');
            funcsUl.className = 'sub-tree';
            funcsUl.style.display = 'none';
            funcsLi.appendChild(funcsUl);
            createTreeToggle(funcsLi, funcsUl);
            
            funcs.forEach((typeIdx, idx) => {
                const t = types[typeIdx] || { params: [], results: [] };
                const sig = `(${t.params.join(', ')}) -> (${t.results.join(', ')})`;
                
                // Map function to an export name if possible
                const expName = exports.find(e => e.kind === 0 && e.index === imports.length + idx)?.name || '';
                const nodeTitle = `func #${imports.length + idx}` + (expName ? ` (${expName})` : '');
                
                addOutlineSubNode(funcsUl, nodeTitle, 'func', {
                    title: `Function #${imports.length + idx}`,
                    html: `
                        <div class="inspector-data-group">
                            <h4>Signature</h4>
                            <p>Type index: <code>#${typeIdx}</code></p>
                            <p>Format: <code>${sig}</code></p>
                            ${expName ? `<p>Exported as: <strong style="color:var(--color-primary);">${expName}</strong></p>` : ''}
                        </div>
                    `
                });
            });
        }

        // 4. Generate WAT (WebAssembly Text) representation for Decompiled
        generateWatRepresentation(types, imports, funcs, exports, globals, codes);
        // Generate byte disassembly
        generateWasmDisassembly(types, imports, funcs, codes);

        updateStatus('loaded');
    } catch(err) {
        console.error(err);
        updateStatus('error', 'Error parsing WASM file: ' + err.message);
    }
}

function generateWasmSectionInspectorHtml(sections) {
    let rows = '';
    const sectionNames = {
        0: "Custom", 1: "Type", 2: "Import", 3: "Function",
        4: "Table", 5: "Memory", 6: "Global", 7: "Export",
        8: "Start", 9: "Element", 10: "Code", 11: "Data", 12: "DataCount"
    };
    
    sections.forEach(s => {
        rows += `
            <tr>
                <td>#${s.id}</td>
                <td><span class="badge-magic">${sectionNames[s.id]}</span></td>
                <td>0x${s.offset.toString(16).toUpperCase()}</td>
                <td>${s.length} bytes</td>
            </tr>
        `;
    });
    
    return `
        <div class="inspector-data-group">
            <h4>WASM Sections layout</h4>
            <table class="inspector-table">
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Offset</th><th>Size</th></tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

function generateWatRepresentation(types, imports, funcs, exports, globals, codes) {
    let wat = `(<span class="st-keyword">module</span>\n`;
    
    // 1. Types
    types.forEach((t, i) => {
        wat += `  (<span class="st-keyword">type</span> <span class="st-var">;${i};</span> (<span class="st-keyword">func</span>`;
        if (t.params.length > 0) wat += ` (param ` + t.params.join(' ') + `)`;
        if (t.results.length > 0) wat += ` (result ` + t.results.join(' ') + `)`;
        wat += `))\n`;
    });
    
    // 2. Imports
    imports.forEach((imp, i) => {
        wat += `  (<span class="st-keyword">import</span> <span class="st-string">"${imp.module}"</span> <span class="st-string">"${imp.field}"</span> `;
        if (imp.kind === 0) {
            wat += `(func <span class="st-var">;${i};</span> (type ${imp.desc.typeIdx}))`;
        } else {
            wat += `(other)`;
        }
        wat += `)\n`;
    });
    
    // 3. Globals
    globals.forEach((g, i) => {
        wat += `  (<span class="st-keyword">global</span> <span class="st-var">;${i};</span> (${g.mut} ${g.type}) ...)\n`;
    });
    
    // 4. Exports
    exports.forEach(exp => {
        const kindNames = ["func", "table", "memory", "global"];
        wat += `  (<span class="st-keyword">export</span> <span class="st-string">"${exp.name}"</span> (${kindNames[exp.kind] || exp.kind} ${exp.index}))\n`;
    });
    
    // 5. Function Code blocks
    funcs.forEach((typeIdx, i) => {
        const globalIdx = imports.length + i;
        const expName = exports.find(e => e.kind === 0 && e.index === globalIdx)?.name || '';
        
        wat += `\n  (<span class="st-keyword">func</span> <span class="st-var">;${globalIdx};</span> (type ${typeIdx})`;
        if (expName) wat += ` <span class="st-comment">; export "${expName}" ;</span>`;
        
        // Print parameters and results for convenience
        const t = types[typeIdx] || { params: [], results: [] };
        t.params.forEach(p => wat += ` (param ${p})`);
        t.results.forEach(r => wat += ` (result ${r})`);
        
        // Show disassembled instructions if code is available
        const code = codes[i];
        if (code) {
            wat += `\n`;
            // De-serialize locals
            const cr = new BinaryReader(code.bytes.buffer);
            const numLocalGroups = readVarUint(cr);
            const locals = [];
            for (let l = 0; l < numLocalGroups; l++) {
                const count = readVarUint(cr);
                const type = WASM_TYPES[cr.readUint8()];
                for (let c = 0; c < count; c++) locals.push(type);
            }
            
            if (locals.length > 0) {
                wat += `    (local ` + locals.join(' ') + `)\n`;
            }
            
            // Render basic body
            wat += `    <span class="st-comment">;; Function Bytecode:</span>\n`;
            
            let indent = 4;
            while (cr.hasMore()) {
                const op = cr.readUint8();
                const ins = WASM_OPCODES[op];
                if (!ins) {
                    wat += ` `.repeat(indent) + `i32.const /* Unknown Op: 0x${op.toString(16)} */\n`;
                    continue;
                }
                
                if (ins.name === "end" || ins.name === "else") {
                    indent = Math.max(4, indent - 2);
                }
                
                let operand = '';
                if (ins.type === 'varuint') {
                    operand = `${readVarUint(cr)}`;
                } else if (ins.type === 'varint') {
                    operand = `${readVarInt(cr)}`;
                } else if (ins.type === 'varint64') {
                    operand = `${readVarInt(cr)}`; // simple representation
                } else if (ins.type === 'float32') {
                    operand = `${cr.readFloat32(true)}`;
                } else if (ins.type === 'float64') {
                    operand = `${cr.readFloat64(true)}`;
                } else if (ins.type === 'block') {
                    cr.readUint8(); // read type descriptor
                    operand = '';
                } else if (ins.type === 'memarg') {
                    const align = readVarUint(cr);
                    const offset = readVarUint(cr);
                    operand = `align=${align} offset=${offset}`;
                }
                
                wat += ` `.repeat(indent) + `<span class="st-op">${ins.name}</span> ${operand}\n`;
                
                if (ins.type === 'block' || ins.name === "else") {
                    indent += 2;
                }
            }
        } else {
            wat += `)\n`;
        }
        wat += `  )\n`;
    });
    
    wat += `)`;
    
    decompiledCodeOutput.innerHTML = wat;
}

function generateWasmDisassembly(types, imports, funcs, codes) {
    let dis = `// WebAssembly Module Disassembly\n\n`;
    
    funcs.forEach((typeIdx, i) => {
        const globalIdx = imports.length + i;
        const code = codes[i];
        
        dis += `Function #${globalIdx} (type: ${typeIdx}):\n`;
        if (!code) {
            dis += `    Imported / System function\n\n`;
            return;
        }
        
        const cr = new BinaryReader(code.bytes.buffer);
        const numLocalGroups = readVarUint(cr);
        
        dis += `    Offset: 0x${code.offset.toString(16).toUpperCase()}\n`;
        dis += `    Local groups: ${numLocalGroups}\n`;
        
        let pc = 0;
        // Decode
        const codeStartOffset = cr.offset;
        while (cr.hasMore()) {
            const byteOffset = cr.offset;
            const op = cr.readUint8();
            const ins = WASM_OPCODES[op];
            
            const hexPc = `0x` + (byteOffset).toString(16).toUpperCase().padStart(4, '0');
            
            if (!ins) {
                dis += `      ${hexPc}:  0x${op.toString(16).toUpperCase()} [Unknown Opcode]\n`;
                continue;
            }
            
            let opVal = '';
            if (ins.type === 'varuint') opVal = `${readVarUint(cr)}`;
            else if (ins.type === 'varint') opVal = `${readVarInt(cr)}`;
            else if (ins.type === 'memarg') {
                const align = readVarUint(cr);
                const offset = readVarUint(cr);
                opVal = `align=${align} offset=${offset}`;
            }
            
            dis += `      ${hexPc}:  <span class="st-op">${ins.name}</span> ${opVal}\n`;
        }
        dis += `\n`;
    });
    
    disassemblyCodeOutput.innerHTML = dis;
}
