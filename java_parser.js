// JVM Instruction Mappings
const JVM_OPCODES = {
    0x00: { name: "nop", len: 0 },
    0x01: { name: "aconst_null", len: 0 },
    0x02: { name: "iconst_m1", len: 0 },
    0x03: { name: "iconst_0", len: 0 },
    0x04: { name: "iconst_1", len: 0 },
    0x05: { name: "iconst_2", len: 0 },
    0x06: { name: "iconst_3", len: 0 },
    0x07: { name: "iconst_4", len: 0 },
    0x08: { name: "iconst_5", len: 0 },
    0x09: { name: "lconst_0", len: 0 },
    0x0a: { name: "lconst_1", len: 0 },
    0x0b: { name: "fconst_0", len: 0 },
    0x0c: { name: "fconst_1", len: 0 },
    0x0d: { name: "fconst_2", len: 0 },
    0x0e: { name: "dconst_0", len: 0 },
    0x0f: { name: "dconst_1", len: 0 },
    0x10: { name: "bipush", len: 1, type: "byte" },
    0x11: { name: "sipush", len: 2, type: "short" },
    0x12: { name: "ldc", len: 1, type: "cp_index8" },
    0x13: { name: "ldc_w", len: 2, type: "cp_index16" },
    0x14: { name: "ldc2_w", len: 2, type: "cp_index16" },
    0x15: { name: "iload", len: 1, type: "local" },
    0x16: { name: "lload", len: 1, type: "local" },
    0x17: { name: "fload", len: 1, type: "local" },
    0x18: { name: "dload", len: 1, type: "local" },
    0x19: { name: "aload", len: 1, type: "local" },
    0x1a: { name: "iload_0", len: 0 },
    0x1b: { name: "iload_1", len: 0 },
    0x1c: { name: "iload_2", len: 0 },
    0x1d: { name: "iload_3", len: 0 },
    0x1e: { name: "lload_0", len: 0 },
    0x1f: { name: "lload_1", len: 0 },
    0x20: { name: "lload_2", len: 0 },
    0x21: { name: "lload_3", len: 0 },
    0x22: { name: "fload_0", len: 0 },
    0x23: { name: "fload_1", len: 0 },
    0x24: { name: "fload_2", len: 0 },
    0x25: { name: "fload_3", len: 0 },
    0x26: { name: "dload_0", len: 0 },
    0x27: { name: "dload_1", len: 0 },
    0x28: { name: "dload_2", len: 0 },
    0x29: { name: "dload_3", len: 0 },
    0x2a: { name: "aload_0", len: 0 },
    0x2b: { name: "aload_1", len: 0 },
    0x2c: { name: "aload_2", len: 0 },
    0x2d: { name: "aload_3", len: 0 },
    0x2e: { name: "iaload", len: 0 },
    0x2f: { name: "laload", len: 0 },
    0x30: { name: "faload", len: 0 },
    0x31: { name: "daload", len: 0 },
    0x32: { name: "aaload", len: 0 },
    0x33: { name: "baload", len: 0 },
    0x34: { name: "caload", len: 0 },
    0x35: { name: "saload", len: 0 },
    0x36: { name: "istore", len: 1, type: "local" },
    0x37: { name: "lstore", len: 1, type: "local" },
    0x38: { name: "fstore", len: 1, type: "local" },
    0x39: { name: "dstore", len: 1, type: "local" },
    0x3a: { name: "astore", len: 1, type: "local" },
    0x3b: { name: "istore_0", len: 0 },
    0x3c: { name: "istore_1", len: 0 },
    0x3d: { name: "istore_2", len: 0 },
    0x3e: { name: "istore_3", len: 0 },
    0x3f: { name: "lstore_0", len: 0 },
    0x40: { name: "lstore_1", len: 0 },
    0x41: { name: "lstore_2", len: 0 },
    0x42: { name: "lstore_3", len: 0 },
    0x43: { name: "fstore_0", len: 0 },
    0x44: { name: "fstore_1", len: 0 },
    0x45: { name: "fstore_2", len: 0 },
    0x46: { name: "fstore_3", len: 0 },
    0x47: { name: "dstore_0", len: 0 },
    0x48: { name: "dstore_1", len: 0 },
    0x49: { name: "dstore_2", len: 0 },
    0x4a: { name: "dstore_3", len: 0 },
    0x4b: { name: "astore_0", len: 0 },
    0x4c: { name: "astore_1", len: 0 },
    0x4d: { name: "astore_2", len: 0 },
    0x4e: { name: "astore_3", len: 0 },
    0x4f: { name: "iastore", len: 0 },
    0x50: { name: "lastore", len: 0 },
    0x51: { name: "fastore", len: 0 },
    0x52: { name: "dastore", len: 0 },
    0x53: { name: "aastore", len: 0 },
    0x54: { name: "bastore", len: 0 },
    0x55: { name: "castore", len: 0 },
    0x56: { name: "sastore", len: 0 },
    0x57: { name: "pop", len: 0 },
    0x58: { name: "pop2", len: 0 },
    0x59: { name: "dup", len: 0 },
    0x5a: { name: "dup_x1", len: 0 },
    0x5b: { name: "dup_x2", len: 0 },
    0x5c: { name: "dup2", len: 0 },
    0x5d: { name: "dup2_x1", len: 0 },
    0x5e: { name: "dup2_x2", len: 0 },
    0x5f: { name: "swap", len: 0 },
    0x60: { name: "iadd", len: 0 },
    0x61: { name: "ladd", len: 0 },
    0x62: { name: "fadd", len: 0 },
    0x63: { name: "dadd", len: 0 },
    0x64: { name: "isub", len: 0 },
    0x65: { name: "lsub", len: 0 },
    0x66: { name: "fsub", len: 0 },
    0x67: { name: "dsub", len: 0 },
    0x68: { name: "imul", len: 0 },
    0x69: { name: "lmul", len: 0 },
    0x6a: { name: "fmul", len: 0 },
    0x6b: { name: "dmul", len: 0 },
    0x6c: { name: "idiv", len: 0 },
    0x6d: { name: "ldiv", len: 0 },
    0x6e: { name: "fdiv", len: 0 },
    0x6f: { name: "ddiv", len: 0 },
    0x70: { name: "irem", len: 0 },
    0x71: { name: "lrem", len: 0 },
    0x72: { name: "frem", len: 0 },
    0x73: { name: "drem", len: 0 },
    0x74: { name: "ineg", len: 0 },
    0x75: { name: "lneg", len: 0 },
    0x76: { name: "fneg", len: 0 },
    0x77: { name: "dneg", len: 0 },
    0x78: { name: "ishl", len: 0 },
    0x79: { name: "lshl", len: 0 },
    0x7a: { name: "ishr", len: 0 },
    0x7b: { name: "lshr", len: 0 },
    0x7c: { name: "iushr", len: 0 },
    0x7d: { name: "lushr", len: 0 },
    0x7e: { name: "iand", len: 0 },
    0x7f: { name: "land", len: 0 },
    0x80: { name: "ior", len: 0 },
    0x81: { name: "lor", len: 0 },
    0x82: { name: "ixor", len: 0 },
    0x83: { name: "lxor", len: 0 },
    0x84: { name: "iinc", len: 2, type: "iinc" },
    0x85: { name: "i2l", len: 0 },
    0x86: { name: "i2f", len: 0 },
    0x87: { name: "i2d", len: 0 },
    0x88: { name: "l2i", len: 0 },
    0x89: { name: "l2f", len: 0 },
    0x8a: { name: "l2d", len: 0 },
    0x8b: { name: "f2i", len: 0 },
    0x8c: { name: "f2l", len: 0 },
    0x8d: { name: "f2d", len: 0 },
    0x8e: { name: "d2i", len: 0 },
    0x8f: { name: "d2l", len: 0 },
    0x90: { name: "d2f", len: 0 },
    0x91: { name: "i2b", len: 0 },
    0x92: { name: "i2c", len: 0 },
    0x93: { name: "i2s", len: 0 },
    0x94: { name: "lcmp", len: 0 },
    0x95: { name: "fcmpl", len: 0 },
    0x96: { name: "fcmpg", len: 0 },
    0x97: { name: "dcmpl", len: 0 },
    0x98: { name: "dcmpg", len: 0 },
    0x99: { name: "ifeq", len: 2, type: "branch" },
    0x9a: { name: "ifne", len: 2, type: "branch" },
    0x9b: { name: "iflt", len: 2, type: "branch" },
    0x9c: { name: "ifge", len: 2, type: "branch" },
    0x9d: { name: "ifgt", len: 2, type: "branch" },
    0x9e: { name: "ifle", len: 2, type: "branch" },
    0x9f: { name: "if_icmpeq", len: 2, type: "branch" },
    0xa0: { name: "if_icmpne", len: 2, type: "branch" },
    0xa1: { name: "if_icmplt", len: 2, type: "branch" },
    0xa2: { name: "if_icmpge", len: 2, type: "branch" },
    0xa3: { name: "if_icmpgt", len: 2, type: "branch" },
    0xa4: { name: "if_icmple", len: 2, type: "branch" },
    0xa5: { name: "if_acmpeq", len: 2, type: "branch" },
    0xa6: { name: "if_acmpne", len: 2, type: "branch" },
    0xa7: { name: "goto", len: 2, type: "branch" },
    0xa8: { name: "jsr", len: 2, type: "branch" },
    0xa9: { name: "ret", len: 1, type: "local" },
    0xaa: { name: "tableswitch", len: -1, type: "special" }, // variable length
    0xab: { name: "lookupswitch", len: -1, type: "special" }, // variable length
    0xac: { name: "ireturn", len: 0 },
    0xad: { name: "lreturn", len: 0 },
    0xae: { name: "freturn", len: 0 },
    0xaf: { name: "dreturn", len: 0 },
    0xb0: { name: "areturn", len: 0 },
    0xb1: { name: "return", len: 0 },
    0xb2: { name: "getstatic", len: 2, type: "cp_index16" },
    0xb3: { name: "putstatic", len: 2, type: "cp_index16" },
    0xb4: { name: "getfield", len: 2, type: "cp_index16" },
    0xb5: { name: "putfield", len: 2, type: "cp_index16" },
    0xb6: { name: "invokevirtual", len: 2, type: "cp_index16" },
    0xb7: { name: "invokespecial", len: 2, type: "cp_index16" },
    0xb8: { name: "invokestatic", len: 2, type: "cp_index16" },
    0xb9: { name: "invokeinterface", len: 4, type: "interface" },
    0xba: { name: "invokedynamic", len: 4, type: "dynamic" },
    0xbb: { name: "new", len: 2, type: "cp_index16" },
    0xbc: { name: "newarray", len: 1, type: "atype" },
    0xbd: { name: "anewarray", len: 2, type: "cp_index16" },
    0xbe: { name: "arraylength", len: 0 },
    0xbf: { name: "athrow", len: 0 },
    0xc0: { name: "checkcast", len: 2, type: "cp_index16" },
    0xc1: { name: "instanceof", len: 2, type: "cp_index16" },
    0xc2: { name: "monitorenter", len: 0 },
    0xc3: { name: "monitorexit", len: 0 }
};

const JVM_ACCESS_FLAGS = {
    0x0001: "public",
    0x0002: "private",
    0x0004: "protected",
    0x0008: "static",
    0x0010: "final",
    0x0020: "synchronized",
    0x0040: "bridge",
    0x0080: "varargs",
    0x0100: "native",
    0x0200: "interface",
    0x0400: "abstract",
    0x0800: "strictfp",
    0x1000: "synthetic",
    0x2000: "annotation",
    0x4000: "enum"
};

// Parses a complete Java .class binary file
function processJavaClass() {
    try {
        const reader = new BinaryReader(currentFile.arrayBuffer);
        
        // 1. Header
        const magic = reader.readUint32();
        if (magic !== 0xCAFEBABE) {
            throw new Error("Invalid magic signature");
        }
        
        const minor = reader.readUint16();
        const major = reader.readUint16();
        const jdkVersion = major - 44; // Major 45 is JDK 1.1, 49 is Java 5, 61 is Java 17, etc.
        
        // 2. Constant Pool
        const cpCount = reader.readUint16();
        const cp = [];
        cp[0] = null;
        
        for (let i = 1; i < cpCount; i++) {
            const tag = reader.readUint8();
            const entry = { tag: tag };
            
            switch (tag) {
                case 1: // UTF8
                    const length = reader.readUint16();
                    entry.value = reader.readUTF8String(length);
                    break;
                case 3: // Integer
                    entry.value = reader.readInt32();
                    break;
                case 4: // Float
                    entry.value = reader.readFloat32();
                    break;
                case 5: // Long
                    entry.value = reader.readFloat64(); // approximations
                    cp[i++] = entry; // Longs and Doubles take up two indices
                    cp[i] = null;
                    break;
                case 6: // Double
                    entry.value = reader.readFloat64();
                    cp[i++] = entry;
                    cp[i] = null;
                    break;
                case 7: // Class
                    entry.nameIndex = reader.readUint16();
                    break;
                case 8: // String
                    entry.stringIndex = reader.readUint16();
                    break;
                case 9: // Fieldref
                case 10: // Methodref
                case 11: // InterfaceMethodref
                    entry.classIndex = reader.readUint16();
                    entry.nameAndTypeIndex = reader.readUint16();
                    break;
                case 12: // NameAndType
                    entry.nameIndex = reader.readUint16();
                    entry.descriptorIndex = reader.readUint16();
                    break;
                case 15: // MethodHandle
                    entry.referenceKind = reader.readUint8();
                    entry.referenceIndex = reader.readUint16();
                    break;
                case 16: // MethodType
                    entry.descriptorIndex = reader.readUint16();
                    break;
                case 18: // InvokeDynamic
                    entry.bootstrapMethodAttrIndex = reader.readUint16();
                    entry.nameAndTypeIndex = reader.readUint16();
                    break;
                case 19: // Module
                    entry.nameIndex = reader.readUint16();
                    break;
                case 20: // Package
                    entry.nameIndex = reader.readUint16();
                    break;
                default:
                    throw new Error(`Unknown Constant Pool Tag: ${tag} at index ${i}`);
            }
            if (cp[i] !== null) cp[i] = entry;
        }

        // Helper to resolve constant pool item to a friendly string
        function cpString(idx) {
            if (idx <= 0 || idx >= cp.length) return "invalid";
            const item = cp[idx];
            if (!item) return "null";
            
            switch (item.tag) {
                case 1: return item.value;
                case 3:
                case 4:
                case 5:
                case 6: return item.value.toString();
                case 7: return cpString(item.nameIndex);
                case 8: return cpString(item.stringIndex);
                case 12: return `${cpString(item.nameIndex)}:${cpString(item.descriptorIndex)}`;
                case 9:
                case 10:
                case 11:
                    return `${cpString(item.classIndex)}.${cpString(item.nameAndTypeIndex)}`;
                default: return `[Tag ${item.tag}]`;
            }
        }

        // 3. Class structure details
        const accessFlags = reader.readUint16();
        const thisClassIdx = reader.readUint16();
        const superClassIdx = reader.readUint16();
        
        const className = cpString(thisClassIdx).replace(/\//g, '.');
        const superName = superClassIdx > 0 ? cpString(superClassIdx).replace(/\//g, '.') : "None";
        
        const interfacesCount = reader.readUint16();
        const interfaces = [];
        for (let i = 0; i < interfacesCount; i++) {
            interfaces.push(cpString(reader.readUint16()).replace(/\//g, '.'));
        }

        // Helper to parse attributes block
        function parseAttributes() {
            const attrCount = reader.readUint16();
            const attrs = [];
            for (let i = 0; i < attrCount; i++) {
                const nameIdx = reader.readUint16();
                const length = reader.readUint32();
                const info = reader.readBytes(length);
                attrs.push({
                    name: cpString(nameIdx),
                    info: info
                });
            }
            return attrs;
        }

        // 4. Fields
        const fieldsCount = reader.readUint16();
        const fields = [];
        for (let i = 0; i < fieldsCount; i++) {
            const flags = reader.readUint16();
            const nameIdx = reader.readUint16();
            const descIdx = reader.readUint16();
            const attrs = parseAttributes();
            fields.push({
                flags: flags,
                name: cpString(nameIdx),
                descriptor: cpString(descIdx),
                attributes: attrs
            });
        }

        // 5. Methods
        const methodsCount = reader.readUint16();
        const methods = [];
        for (let i = 0; i < methodsCount; i++) {
            const flags = reader.readUint16();
            const nameIdx = reader.readUint16();
            const descIdx = reader.readUint16();
            const attrs = parseAttributes();
            methods.push({
                flags: flags,
                name: cpString(nameIdx),
                descriptor: cpString(descIdx),
                attributes: attrs
            });
        }

        // Attributes of the class
        const classAttrs = parseAttributes();

        // Reconstruct friendly access flags
        function formatFlags(flags) {
            let str = [];
            for (let mask in JVM_ACCESS_FLAGS) {
                if ((flags & mask) != 0) {
                    str.push(JVM_ACCESS_FLAGS[mask]);
                }
            }
            return str.join(' ');
        }

        // 6. Build the Sidebar Tree
        outlineTree.innerHTML = '';
        
        // Main Class Node
        const classTitle = formatFlags(accessFlags) + " class " + className.split('.').pop();
        const mainClassLi = addOutlineFolder(classTitle);
        const subTreeUl = document.createElement('ul');
        subTreeUl.className = 'sub-tree';
        mainClassLi.appendChild(subTreeUl);
        createTreeToggle(mainClassLi, subTreeUl);

        // Constant Pool node
        addOutlineSubNode(subTreeUl, `📂 Constant Pool (${cp.length - 1} items)`, 'cp', {
            title: "Constant Pool Inspector",
            html: generateConstantPoolInspectorHtml(cp, cpString)
        });

        // Fields sub-node
        if (fields.length > 0) {
            const fieldsLi = addOutlineSubNode(subTreeUl, `📂 Fields`, 'folder', {
                title: "Fields Summary",
                html: `<h4>Fields count: ${fields.length}</h4>`
            });
            const fieldsUl = document.createElement('ul');
            fieldsUl.className = 'sub-tree';
            fieldsUl.style.display = 'none';
            fieldsLi.appendChild(fieldsUl);
            createTreeToggle(fieldsLi, fieldsUl);
            
            fields.forEach(f => {
                const modifier = formatFlags(f.flags);
                addOutlineSubNode(fieldsUl, `${modifier} ${f.name}`, 'field', {
                    title: `Field: ${f.name}`,
                    html: `
                        <div class="inspector-data-group">
                            <h4>Field Properties</h4>
                            <table class="inspector-table">
                                <tr><th>Name</th><td>${f.name}</td></tr>
                                <tr><th>Type Signature</th><td><code>${f.descriptor}</code></td></tr>
                                <tr><th>Modifiers</th><td><code>${modifier}</code></td></tr>
                                <tr><th>Attributes</th><td>${f.attributes.map(a => a.name).join(', ') || 'None'}</td></tr>
                            </table>
                        </div>
                    `
                });
            });
        }

        // Methods sub-node
        if (methods.length > 0) {
            const methodsLi = addOutlineSubNode(subTreeUl, `📂 Methods`, 'folder', {
                title: "Methods Summary",
                html: `<h4>Methods count: ${methods.length}</h4>`
            });
            const methodsUl = document.createElement('ul');
            methodsUl.className = 'sub-tree';
            methodsUl.style.display = 'none';
            methodsLi.appendChild(methodsUl);
            createTreeToggle(methodsLi, methodsUl);
            
            methods.forEach(m => {
                const modifier = formatFlags(m.flags);
                addOutlineSubNode(methodsUl, `ƒ ${m.name}()`, 'method', {
                    title: `Method: ${m.name}`,
                    html: generateMethodInspectorHtml(m, cpString)
                });
            });
        }

        // 7. Generate Decompiled & Disassembled Views
        generateJavaDecompiledCode(className, superName, interfaces, accessFlags, fields, methods, cpString);
        generateJavaDisassemblyCode(className, superName, major, minor, jdkVersion, fields, methods, cpString);

        updateStatus('loaded');
    } catch(err) {
        console.error(err);
        updateStatus('error', 'Error parsing class file: ' + err.message);
    }
}

function generateConstantPoolInspectorHtml(cp, cpString) {
    let rows = '';
    const tagNames = {
        1: "Utf8", 3: "Integer", 4: "Float", 5: "Long", 6: "Double",
        7: "Class", 8: "String", 9: "Fieldref", 10: "Methodref",
        11: "InterfaceMethodref", 12: "NameAndType", 15: "MethodHandle",
        16: "MethodType", 18: "InvokeDynamic", 19: "Module", 20: "Package"
    };

    for (let i = 1; i < cp.length; i++) {
        const item = cp[i];
        if (!item) continue;
        
        let detail = cpString(i);
        let refs = '';
        if (item.tag === 7) {
            refs = `Name Index: #${item.nameIndex}`;
        } else if (item.tag === 8) {
            refs = `String Index: #${item.stringIndex}`;
        } else if (item.tag === 9 || item.tag === 10 || item.tag === 11) {
            refs = `Class: #${item.classIndex}, NameAndType: #${item.nameAndTypeIndex}`;
        } else if (item.tag === 12) {
            refs = `Name: #${item.nameIndex}, Descriptor: #${item.descriptorIndex}`;
        }
        
        rows += `
            <tr>
                <td style="font-family:'JetBrains Mono',monospace;">#${i}</td>
                <td><span class="badge-magic">${tagNames[item.tag]}</span></td>
                <td style="font-family:'JetBrains Mono',monospace; word-break:break-all; max-width:200px;">${escapeHtml(detail)}</td>
                <td style="font-size:10px; color:var(--text-muted);">${refs}</td>
            </tr>
        `;
    }
    
    return `
        <div class="inspector-data-group">
            <h4>Constant Pool entries</h4>
            <div style="max-height: 400px; overflow-y: auto;">
                <table class="inspector-table">
                    <thead>
                        <tr><th>Index</th><th>Tag</th><th>Value</th><th>References</th></tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateMethodInspectorHtml(method, cpString) {
    const codeAttr = method.attributes.find(a => a.name === "Code");
    if (!codeAttr) {
        return `
            <div class="inspector-data-group">
                <h4>Method Meta</h4>
                <p>Signature: <code>${method.descriptor}</code></p>
                <p>Modifiers: <code>${method.flags}</code></p>
                <p><em>Abstract or Native Method (No Bytecode)</em></p>
            </div>
        `;
    }
    
    // Parse code properties
    const info = codeAttr.info;
    const dv = new DataView(info.buffer, info.byteOffset, info.byteLength);
    const maxStack = dv.getUint16(0);
    const maxLocals = dv.getUint16(2);
    const codeLength = dv.getUint32(4);
    
    return `
        <div class="inspector-data-group">
            <h4>Method Frame</h4>
            <table class="inspector-table">
                <tr><th>Name</th><td><code>${method.name}</code></td></tr>
                <tr><th>Signature</th><td><code>${method.descriptor}</code></td></tr>
                <tr><th>Max Stack</th><td>${maxStack}</td></tr>
                <tr><th>Max Locals</th><td>${maxLocals}</td></tr>
                <tr><th>Bytecode Length</th><td>${codeLength} bytes</td></tr>
            </table>
        </div>
    `;
}

function generateJavaDecompiledCode(className, superName, interfaces, accessFlags, fields, methods, cpString) {
    const pkg = className.includes('.') ? className.slice(0, className.lastIndexOf('.')) : '';
    const simpleName = className.includes('.') ? className.slice(className.lastIndexOf('.') + 1) : className;
    
    let code = ``;
    if (pkg) {
        code += `<span class="st-keyword">package</span> ${pkg};\n\n`;
    }
    
    const cleanFlags = formatFlagsJava(accessFlags);
    code += `${cleanFlags} <span class="st-keyword">class</span> <span class="st-type">${simpleName}</span>`;
    
    if (superName && superName !== "java.lang.Object") {
        code += ` <span class="st-keyword">extends</span> <span class="st-type">${superName.split('.').pop()}</span>`;
    }
    if (interfaces.length > 0) {
        code += ` <span class="st-keyword">implements</span> ` + interfaces.map(i => `<span class="st-type">${i.split('.').pop()}</span>`).join(', ');
    }
    
    code += ` {\n\n`;
    
    // Fields
    fields.forEach(f => {
        const flagStr = formatFlagsJava(f.flags);
        const typeName = parseDescriptor(f.descriptor);
        code += `    ${flagStr} ${typeName} <span class="st-var">${f.name}</span>;\n`;
    });
    
    if (fields.length > 0) code += `\n`;
    
    // Methods
    methods.forEach(m => {
        const flagStr = formatFlagsJava(m.flags);
        const sig = parseMethodDescriptor(m.descriptor);
        
        code += `    ${flagStr} ${sig.returnType} <span class="st-func">${m.name}</span>(${sig.args.map((a, i) => `${a} arg${i}`).join(', ')})`;
        
        const codeAttr = m.attributes.find(a => a.name === "Code");
        if (!codeAttr) {
            code += `;\n\n`;
        } else {
            code += ` {\n`;
            code += `        <span class="st-comment">// Bytecode decompilation placeholder</span>\n`;
            code += `        <span class="st-comment">// View the exact instructions in the "Disassembly" tab</span>\n`;
            
            // Try to add a simple guess for returns
            if (sig.returnType === 'void') {
                code += `        <span class="st-keyword">return</span>;\n`;
            } else if (sig.returnType === 'int' || sig.returnType === 'boolean') {
                code += `        <span class="st-keyword">return</span> <span class="st-number">0</span>;\n`;
            } else if (sig.returnType === 'double' || sig.returnType === 'float') {
                code += `        <span class="st-keyword">return</span> <span class="st-number">0.0</span>;\n`;
            } else {
                code += `        <span class="st-keyword">return</span> <span class="st-keyword">null</span>;\n`;
            }
            code += `    }\n\n`;
        }
    });
    
    code += `}`;
    
    decompiledCodeOutput.innerHTML = code;
}

function generateJavaDisassemblyCode(className, superName, major, minor, jdkVersion, fields, methods, cpString) {
    let code = `// ClassFile: ${className}.class\n`;
    code += `// Major Version: ${major} (JDK ${jdkVersion}), Minor Version: ${minor}\n`;
    code += `// SuperClass: ${superName}\n\n`;
    
    methods.forEach(m => {
        const flags = formatFlagsJava(m.flags);
        code += `Method ${flags} ${m.name} : ${m.descriptor}\n`;
        
        const codeAttr = m.attributes.find(a => a.name === "Code");
        if (!codeAttr) {
            code += `    [abstract/native method]\n\n`;
            return;
        }
        
        const info = codeAttr.info;
        const dv = new DataView(info.buffer, info.byteOffset, info.byteLength);
        const maxStack = dv.getUint16(0);
        const maxLocals = dv.getUint16(2);
        const codeLength = dv.getUint32(4);
        
        code += `    Max Stack: ${maxStack}, Max Locals: ${maxLocals}\n`;
        
        // Loop and disassemble code block
        let offset = 8; // byteOffset + 8 points to the actual code block
        const codeEnd = offset + codeLength;
        
        while (offset < codeEnd) {
            const pc = offset - 8;
            const op = info[offset];
            const ins = JVM_OPCODES[op];
            
            if (!ins) {
                code += `        ${pc.toString().padStart(4, '0')}: <span class="st-error">0x${op.toString(16).toUpperCase()} [Unknown Opcode]</span>\n`;
                offset++;
                continue;
            }
            
            let operandText = '';
            
            if (ins.len === 0) {
                // no operands
                operandText = '';
            } else if (ins.type === 'cp_index8') {
                const idx = info[offset + 1];
                operandText = `#${idx} // ${cpString(idx)}`;
            } else if (ins.type === 'cp_index16') {
                const idx = (info[offset + 1] << 8) | info[offset + 2];
                operandText = `#${idx} // ${cpString(idx)}`;
            } else if (ins.type === 'byte') {
                operandText = `${info[offset + 1]}`;
            } else if (ins.type === 'short') {
                const val = (info[offset + 1] << 8) | info[offset + 2];
                operandText = `${val}`;
            } else if (ins.type === 'local') {
                operandText = `var_${info[offset + 1]}`;
            } else if (ins.type === 'branch') {
                const rel = (info[offset + 1] << 8) | info[offset + 2];
                const signRel = (rel & 0x8000) ? (rel - 0x10000) : rel;
                operandText = `${pc + signRel}`;
            } else if (ins.type === 'iinc') {
                operandText = `var_${info[offset + 1]} by ${info[offset + 2]}`;
            } else if (ins.type === 'interface') {
                const idx = (info[offset + 1] << 8) | info[offset + 2];
                operandText = `#${idx} count ${info[offset + 3]} // ${cpString(idx)}`;
            } else if (ins.type === 'dynamic') {
                const idx = (info[offset + 1] << 8) | info[offset + 2];
                operandText = `#${idx} // ${cpString(idx)}`;
            } else {
                operandText = 'args...';
            }
            
            code += `        ${pc.toString().padStart(4, '0')}: <span class="st-op">${ins.name}</span> ${escapeHtml(operandText)}\n`;
            offset += 1 + (ins.len >= 0 ? ins.len : 0);
        }
        code += `\n`;
    });
    
    disassemblyCodeOutput.innerHTML = code;
}

// JVM Helper Decoders
function formatFlagsJava(flags) {
    let str = [];
    const order = [0x0001, 0x0002, 0x0004, 0x0008, 0x0400, 0x0010]; // public, private, protected, static, abstract, final
    for (let f of order) {
        if ((flags & f) !== 0) {
            str.push(JVM_ACCESS_FLAGS[f]);
        }
    }
    return str.map(s => `<span class="st-keyword">${s}</span>`).join(' ');
}

function parseDescriptor(desc) {
    if (desc.startsWith('[')) {
        return parseDescriptor(desc.slice(1)) + '[]';
    }
    if (desc.startsWith('L') && desc.endsWith(';')) {
        return desc.slice(1, -1).split('/').pop();
    }
    const types = {
        'B': 'byte', 'C': 'char', 'D': 'double', 'F': 'float',
        'I': 'int', 'J': 'long', 'S': 'short', 'Z': 'boolean', 'V': 'void'
    };
    return types[desc] || desc;
}

function parseMethodDescriptor(desc) {
    const args = [];
    const match = desc.match(/^\((.*)\)(.*)$/);
    if (!match) return { args: [], returnType: 'void' };
    
    let argStr = match[1];
    const retStr = match[2];
    
    while (argStr.length > 0) {
        if (argStr.startsWith('[')) {
            // array type
            let i = 0;
            while (argStr[i] === '[') i++;
            let type = '';
            if (argStr[i] === 'L') {
                const end = argStr.indexOf(';', i);
                type = argStr.slice(i + 1, end).split('/').pop();
                argStr = argStr.slice(end + 1);
            } else {
                type = parseDescriptor(argStr[i]);
                argStr = argStr.slice(i + 1);
            }
            args.push(type + '[]'.repeat(i));
        } else if (argStr.startsWith('L')) {
            const end = argStr.indexOf(';');
            args.push(argStr.slice(1, end).split('/').pop());
            argStr = argStr.slice(end + 1);
        } else {
            args.push(parseDescriptor(argStr[0]));
            argStr = argStr.slice(1);
        }
    }
    
    return {
        args: args,
        returnType: parseDescriptor(retStr)
    };
}
