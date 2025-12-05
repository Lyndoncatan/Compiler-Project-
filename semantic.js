class SemanticAnalyzer {
    constructor(tokens) {
        this.tokens = tokens;
        this.symbolTable = new Map();
        this.errors = [];
        this.warnings = [];
        this.currentScope = 'global';
        this.functions = new Map();

         
        this.builtInIdentifiers = new Set([
             
            'printf', 'scanf', 'main', 'stdio', 'stdlib', 'string', 'math',
             
            'System', 'Scanner', 'String', 'Math', 'Object', 'Integer',
            'Double', 'Float', 'Boolean', 'Character', 'out', 'in', 'err',
            'java', 'util', 'io', 'lang', 'ArrayList', 'List', 'Map', 'Set',
            'println', 'print', 'next', 'nextInt', 'nextLine', 'nextDouble',
            'length', 'size', 'add', 'remove', 'get', 'set', 'toString',
            'equals', 'hashCode', 'close'
        ]);
    }

    analyze() {
        this.errors = [];
        this.warnings = [];
        this.symbolTable.clear();
        this.functions.clear();

        this.buildSymbolTable();
        this.checkTypeCompatibility();
        this.checkUndeclaredVariables();
        this.checkFunctionCalls();
        this.checkUnusedVariables();  

        if (this.errors.length === 0) {
            return {
                success: true,
                message: 'Semantic analysis completed successfully!',
                symbolTable: this.symbolTable,
                warnings: this.warnings
            };
        } else {
            return {
                success: false,
                errors: this.errors,
                warnings: this.warnings
            };
        }
    }

    buildSymbolTable() {
        let i = 0;

        while (i < this.tokens.length) {
            const token = this.tokens[i];

             
            if (token.type === 'KEYWORD' && (token.value === 'import' || token.value === 'include')) {
                 
                while (i < this.tokens.length &&
                       !(this.tokens[i].type === 'SEPARATOR' && this.tokens[i].value === ';')) {
                    i++;
                }
                if (i < this.tokens.length) i++; 
                continue;
            }

            
            if (token.type === 'SEPARATOR' && token.value === '#') {
                
                while (i < this.tokens.length &&
                       !(this.tokens[i].type === 'OPERATOR' && this.tokens[i].value === '>')) {
                    i++;
                }
                if (i < this.tokens.length) i++; 
                continue;
            }

           
            if (token.type === 'KEYWORD' &&
                ['int', 'float', 'double', 'char', 'void', 'boolean', 'byte', 'short', 'long', 'String'].includes(token.value)) {
                const type = token.value;
                i++;

                if (i < this.tokens.length && this.tokens[i].type === 'IDENTIFIER') {
                    const identifier = this.tokens[i];
                    i++;

                  
                    if (i < this.tokens.length && this.tokens[i].type === 'SEPARATOR' && this.tokens[i].value === '(') {
                        if (this.functions.has(identifier.value)) {
                            this.errors.push({
                                line: identifier.line,
                                message: `Function '${identifier.value}' is already declared`
                            });
                        } else {
                            this.functions.set(identifier.value, {
                                returnType: type,
                                parameters: [],
                                line: identifier.line
                            });
                        }

                        i++;
                         
                        while (i < this.tokens.length && !(this.tokens[i].type === 'SEPARATOR' && this.tokens[i].value === ')')) {
                            i++;
                        }
                    } else {
                        
                        const key = `${this.currentScope}:${identifier.value}`;
                        if (this.symbolTable.has(key)) {
                            this.errors.push({
                                line: identifier.line,
                                message: `Variable '${identifier.value}' is already declared in this scope`
                            });
                        } else {
                            this.symbolTable.set(key, {
                                type: type,
                                line: identifier.line,
                                initialized: false,
                                used: false
                            });
                        }

                         
                        if (i < this.tokens.length && this.tokens[i].type === 'OPERATOR' && this.tokens[i].value === '=') {
                            const symbol = this.symbolTable.get(key);
                            if (symbol) symbol.initialized = true;
                        }
                    }
                }
            } else {
                i++;
            }
        }
    }

    checkTypeCompatibility() {
        let i = 0;

        while (i < this.tokens.length) {
            const token = this.tokens[i];

            if (token.type === 'IDENTIFIER') {
                const key = `${this.currentScope}:${token.value}`;
                const globalKey = `global:${token.value}`;

                if (this.symbolTable.has(key) || this.symbolTable.has(globalKey)) {
                    const varKey = this.symbolTable.has(key) ? key : globalKey;
                    const symbol = this.symbolTable.get(varKey);

                     
                    if (i + 1 < this.tokens.length && this.tokens[i + 1].type === 'OPERATOR' && this.tokens[i + 1].value === '=') {
                         
                        i += 2;

                        if (i < this.tokens.length) {
                            const valueToken = this.tokens[i];

                            if (valueToken.type === 'NUMBER') {
                                if (symbol.type === 'int' && valueToken.value.includes('.')) {
                                    this.warnings.push({
                                        line: token.line,
                                        message: `Implicit conversion from float to int for variable '${token.value}'`
                                    });
                                }
                                symbol.initialized = true;
                            } else if (valueToken.type === 'CHAR_LITERAL') {
                                if (symbol.type !== 'char') {
                                    this.errors.push({
                                        line: token.line,
                                        message: `Type mismatch: Cannot assign char to ${symbol.type} variable '${token.value}'`
                                    });
                                }
                                symbol.initialized = true;
                            } else if (valueToken.type === 'STRING_LITERAL') {
                                if (symbol.type !== 'char' && symbol.type !== 'String') {
                                    this.warnings.push({
                                        line: token.line,
                                        message: `Assigning string literal to ${symbol.type} variable '${token.value}'`
                                    });
                                }
                                symbol.initialized = true;
                            } else if (valueToken.type === 'IDENTIFIER') {
                               
                                const rightKey = `${this.currentScope}:${valueToken.value}`;
                                const rightGlobalKey = `global:${valueToken.value}`;
                                if (this.symbolTable.has(rightKey)) {
                                    this.symbolTable.get(rightKey).used = true;
                                } else if (this.symbolTable.has(rightGlobalKey)) {
                                    this.symbolTable.get(rightGlobalKey).used = true;
                                }
                                symbol.initialized = true;
                            }

                             
                            while (i < this.tokens.length &&
                                   !(this.tokens[i].type === 'SEPARATOR' && this.tokens[i].value === ';')) {
                                if (this.tokens[i].type === 'IDENTIFIER') {
                                    const exprKey = `${this.currentScope}:${this.tokens[i].value}`;
                                    const exprGlobalKey = `global:${this.tokens[i].value}`;
                                    if (this.symbolTable.has(exprKey)) {
                                        this.symbolTable.get(exprKey).used = true;
                                    } else if (this.symbolTable.has(exprGlobalKey)) {
                                        this.symbolTable.get(exprGlobalKey).used = true;
                                    }
                                }
                                i++;
                            }
                        }
                    } else {
                       
                        symbol.used = true;
                    }
                }
            }

            i++;
        }
    }

    checkUndeclaredVariables() {
        let i = 0;
        const skipKeywords = new Set([
            'int', 'float', 'double', 'char', 'void', 'if', 'else', 'while',
            'for', 'return', 'break', 'continue', 'printf', 'scanf', 'include', 'main',
            'import', 'package', 'class', 'public', 'private', 'protected', 'static',
            'new', 'this', 'super', 'boolean', 'byte', 'short', 'long', 'String',
            'true', 'false', 'null'
        ]);

        while (i < this.tokens.length) {
            const token = this.tokens[i];

           
            if (token.type === 'KEYWORD' && (token.value === 'import' || token.value === 'include')) {
                while (i < this.tokens.length &&
                       !(this.tokens[i].type === 'SEPARATOR' && this.tokens[i].value === ';')) {
                    i++;
                }
                if (i < this.tokens.length) i++;
                continue;
            }

            
            if (token.type === 'SEPARATOR' && token.value === '#') {
                while (i < this.tokens.length &&
                       !(this.tokens[i].type === 'OPERATOR' && this.tokens[i].value === '>')) {
                    i++;
                }
                if (i < this.tokens.length) i++;
                continue;
            }

             
            if (token.type === 'IDENTIFIER' && i + 1 < this.tokens.length &&
                this.tokens[i + 1].type === 'SEPARATOR' && this.tokens[i + 1].value === '.') {
                
                while (i < this.tokens.length &&
                       (this.tokens[i].type === 'IDENTIFIER' ||
                        (this.tokens[i].type === 'SEPARATOR' && this.tokens[i].value === '.'))) {
                    i++;
                }
                continue;
            }

          
            if (token.type === 'IDENTIFIER' &&
                !skipKeywords.has(token.value) &&
                !this.builtInIdentifiers.has(token.value)) {

               
                if (i > 0 && this.tokens[i - 1].type === 'KEYWORD' &&
                    ['int', 'float', 'double', 'char', 'void', 'boolean', 'String'].includes(this.tokens[i - 1].value)) {
                    i++;
                    continue;
                }

                
                if (i > 0 && this.tokens[i - 1].type === 'SEPARATOR' && this.tokens[i - 1].value === '.') {
                    i++;
                    continue;
                }

              
                if (i + 1 < this.tokens.length && this.tokens[i + 1].type === 'SEPARATOR' &&
                    this.tokens[i + 1].value === '(') {
                    if (!this.functions.has(token.value) && !this.builtInIdentifiers.has(token.value)) {
                        this.errors.push({
                            line: token.line,
                            message: `Function '${token.value}' is not declared`
                        });
                    }
                } else {
                     
                    const key = `${this.currentScope}:${token.value}`;
                    const globalKey = `global:${token.value}`;

                    if (!this.symbolTable.has(key) && !this.symbolTable.has(globalKey) &&
                        !this.functions.has(token.value)) {
                        this.errors.push({
                            line: token.line,
                            message: `Variable '${token.value}' is not declared`
                        });
                    }
                }
            }

            i++;
        }
    }

    checkFunctionCalls() {
        let i = 0;

        while (i < this.tokens.length) {
            const token = this.tokens[i];

            if (token.type === 'IDENTIFIER' && i + 1 < this.tokens.length &&
                this.tokens[i + 1].type === 'SEPARATOR' && this.tokens[i + 1].value === '(') {

                if (this.functions.has(token.value)) {
                    const func = this.functions.get(token.value);
                    func.used = true;
                }
            }

            i++;
        }
    }

    checkUnusedVariables() {
        for (let [key, symbol] of this.symbolTable.entries()) {
            const varName = key.split(':')[1];
            if (!symbol.used && symbol.initialized) {
                this.warnings.push({
                    line: symbol.line,
                    message: `Variable '${varName}' is declared but never used`
                });
            }
        }
    }

    formatOutput(result) {
        let output = 'SEMANTIC ANALYSIS RESULTS\n';
        output += '='.repeat(60) + '\n\n';

        if (result.success) {
            output += '✓ ' + result.message + '\n\n';

            output += 'Symbol Table:\n';
            output += '-'.repeat(60) + '\n';

            if (result.symbolTable.size > 0) {
                for (let [key, symbol] of result.symbolTable.entries()) {
                    const varName = key.split(':')[1];
                    output += `  ${varName} (${symbol.type}) - Line ${symbol.line}\n`;
                    output += `    Initialized: ${symbol.initialized ? 'Yes' : 'No'}\n`;
                    output += `    Used: ${symbol.used ? 'Yes' : 'No'}\n`;
                }
            } else {
                output += '  No variables found\n';
            }

            if (result.warnings.length > 0) {
                output += '\nWarnings:\n';
                output += '-'.repeat(60) + '\n';
                result.warnings.forEach((warning, index) => {
                    output += `${index + 1}. Line ${warning.line}: ${warning.message}\n`;
                });
            }
        } else {
            output += `Found ${result.errors.length} error(s):\n\n`;

            result.errors.forEach((error, index) => {
                output += `${index + 1}. Line ${error.line}: ${error.message}\n`;
            });

            if (result.warnings.length > 0) {
                output += '\nWarnings:\n';
                output += '-'.repeat(60) + '\n';
                result.warnings.forEach((warning, index) => {
                    output += `${index + 1}. Line ${warning.line}: ${warning.message}\n`;
                });
            }
        }

        return output;
    }
}
