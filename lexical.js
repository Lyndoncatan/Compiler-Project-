class LexicalAnalyzer {
    constructor() {
        this.keywords = [

            'int', 'float', 'double', 'char', 'void', 'if', 'else',
            'while', 'for', 'return', 'break', 'continue', 'switch',
            'case', 'default', 'struct', 'typedef', 'const', 'static',
            'main', 'include', 'printf', 'scanf',

            'import', 'package', 'class', 'public', 'private', 'protected',
            'new', 'this', 'super', 'extends', 'implements', 'interface',
            'abstract', 'final', 'try', 'catch', 'throw', 'throws',
            'boolean', 'byte', 'short', 'long', 'String', 'true', 'false',
            'null', 'instanceof'
        ];


        this.operators = [
            '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>',
            '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-=',
            '*=', '/='
        ];

        this.separators = [
            '(', ')', '{', '}', '[', ']', ';', ',', '.', ':', '#'
        ];

        this.tokens = [];
    }

    isKeyword(word) {
        return this.keywords.includes(word);
    }

    isOperator(char) {
        return this.operators.some(op => op.startsWith(char));
    }

    isSeparator(char) {
        return this.separators.includes(char);
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    isLetter(char) {
        return /[a-zA-Z_]/.test(char);
    }

    isWhitespace(char) {
        return /\s/.test(char);
    }

    analyze(sourceCode) {
        this.tokens = [];
        let i = 0;
        let line = 1;

        while (i < sourceCode.length) {
            let char = sourceCode[i];

            if (char === '\n') {
                line++;
                i++;
                continue;
            }

            if (this.isWhitespace(char)) {
                i++;
                continue;
            }

            if (char === '/' && i + 1 < sourceCode.length && sourceCode[i + 1] === '/') {
                while (i < sourceCode.length && sourceCode[i] !== '\n') {
                    i++;
                }
                continue;
            }

            if (char === '/' && i + 1 < sourceCode.length && sourceCode[i + 1] === '*') {
                i += 2;
                while (i < sourceCode.length - 1) {
                    if (sourceCode[i] === '*' && sourceCode[i + 1] === '/') {
                        i += 2;
                        break;
                    }
                    if (sourceCode[i] === '\n') line++;
                    i++;
                }
                continue;
            }

            if (char === '"') {
                let start = i;
                i++;
                while (i < sourceCode.length && sourceCode[i] !== '"') {
                    if (sourceCode[i] === '\\') i++;
                    i++;
                }
                i++;
                this.tokens.push({
                    type: 'STRING_LITERAL',
                    value: sourceCode.substring(start, i),
                    line: line
                });
                continue;
            }

            if (char === "'") {
                let start = i;
                i++;
                while (i < sourceCode.length && sourceCode[i] !== "'") {
                    if (sourceCode[i] === '\\') i++;
                    i++;
                }
                i++;
                this.tokens.push({
                    type: 'CHAR_LITERAL',
                    value: sourceCode.substring(start, i),
                    line: line
                });
                continue;
            }

            if (this.isDigit(char)) {
                let start = i;
                while (i < sourceCode.length && (this.isDigit(sourceCode[i]) || sourceCode[i] === '.')) {
                    i++;
                }
                this.tokens.push({
                    type: 'NUMBER',
                    value: sourceCode.substring(start, i),
                    line: line
                });
                continue;
            }

            if (this.isLetter(char)) {
                let start = i;
                while (i < sourceCode.length && (this.isLetter(sourceCode[i]) || this.isDigit(sourceCode[i]))) {
                    i++;
                }
                let word = sourceCode.substring(start, i);
                this.tokens.push({
                    type: this.isKeyword(word) ? 'KEYWORD' : 'IDENTIFIER',
                    value: word,
                    line: line
                });
                continue;
            }

            if (this.isSeparator(char)) {
                this.tokens.push({
                    type: 'SEPARATOR',
                    value: char,
                    line: line
                });
                i++;
                continue;
            }

            let opStart = i;
            let op = char;
            if (i + 1 < sourceCode.length) {
                let twoCharOp = char + sourceCode[i + 1];
                if (this.operators.includes(twoCharOp)) {
                    op = twoCharOp;
                    i++;
                }
            }
            if (this.operators.includes(op)) {
                this.tokens.push({
                    type: 'OPERATOR',
                    value: op,
                    line: line
                });
                i++;
                continue;
            }

            this.tokens.push({
                type: 'UNKNOWN',
                value: char,
                line: line
            });
            i++;
        }

        return this.tokens;
    }

    formatOutput() {
        if (this.tokens.length === 0) {
            return 'No tokens found.';
        }

        let output = 'LEXICAL ANALYSIS RESULTS\n';
        output += '=' .repeat(60) + '\n\n';
        output += `Total Tokens: ${this.tokens.length}\n\n`;

        const tokensByType = {};
        this.tokens.forEach(token => {
            if (!tokensByType[token.type]) {
                tokensByType[token.type] = [];
            }
            tokensByType[token.type].push(token);
        });

        for (let type in tokensByType) {
            output += `\n${type}s (${tokensByType[type].length}):\n`;
            output += '-'.repeat(60) + '\n';
            tokensByType[type].forEach(token => {
                output += `  Line ${token.line}: "${token.value}"\n`;
            });
        }

        return output;
    }
}
