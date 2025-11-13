class SyntaxAnalyzer {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
        this.errors = [];
        this.parseTree = [];
    }

    currentToken() {
        return this.tokens[this.currentIndex];
    }

    peek(offset = 1) {
        return this.tokens[this.currentIndex + offset];
    }

    advance() {
        this.currentIndex++;
    }

    match(type, value = null) {
        const token = this.currentToken();
        if (!token) return false;
        if (token.type !== type) return false;
        if (value && token.value !== value) return false;
        return true;
    }

    expect(type, value = null) {
        if (this.match(type, value)) {
            const token = this.currentToken();
            this.advance();
            return token;
        }
        const token = this.currentToken();
        const expected = value ? `${type} '${value}'` : type;
        this.errors.push({
            line: token ? token.line : 'EOF',
            message: `Expected ${expected}, but got ${token ? token.type + " '" + token.value + "'" : 'end of file'}`
        });
        return null;
    }

    analyze() {
        this.errors = [];
        this.parseTree = [];
        this.currentIndex = 0;

        try {
            while (this.currentIndex < this.tokens.length) {
                this.parseStatement();
            }

            if (this.errors.length === 0) {
                return {
                    success: true,
                    message: 'Syntax analysis completed successfully!',
                    tree: this.parseTree
                };
            } else {
                return {
                    success: false,
                    errors: this.errors
                };
            }
        } catch (e) {
            return {
                success: false,
                errors: [...this.errors, { line: 'N/A', message: e.message }]
            };
        }
    }

    parseStatement() {
        const token = this.currentToken();

        if (!token) return;

        if (token.type === 'SEPARATOR' && token.value === '#') {
            this.parsePreprocessor();
        } else if (token.type === 'KEYWORD') {
            if (['int', 'float', 'double', 'char', 'void'].includes(token.value)) {
                this.parseDeclaration();
            } else if (token.value === 'if') {
                this.parseIfStatement();
            } else if (token.value === 'while') {
                this.parseWhileStatement();
            } else if (token.value === 'for') {
                this.parseForStatement();
            } else if (token.value === 'return') {
                this.parseReturnStatement();
            } else {
                this.advance();
            }
        } else if (token.type === 'IDENTIFIER') {
            this.parseAssignmentOrFunctionCall();
        } else if (token.type === 'SEPARATOR' && token.value === '}') {
            this.advance();
        } else {
            this.advance();
        }
    }

    parsePreprocessor() {
        this.expect('SEPARATOR', '#');
        if (this.match('KEYWORD', 'include')) {
            this.advance();
            if (this.match('OPERATOR', '<') || this.match('STRING_LITERAL')) {
                while (this.currentToken() && this.currentToken().value !== '\n' &&
                       !(this.match('OPERATOR', '>') && this.peek() && this.peek().value === '\n')) {
                    this.advance();
                }
                if (this.match('OPERATOR', '>')) {
                    this.advance();
                }
            }
        }
        this.parseTree.push({ type: 'PREPROCESSOR' });
    }

    parseDeclaration() {
        const type = this.currentToken();
        this.advance();

        if (this.match('IDENTIFIER')) {
            const identifier = this.currentToken();
            this.advance();

            if (this.match('SEPARATOR', '(')) {
                this.parseFunctionDeclaration(type, identifier);
            } else {
                this.parseVariableDeclaration(type, identifier);
            }
        }
    }

    parseFunctionDeclaration(type, identifier) {
        this.expect('SEPARATOR', '(');

        while (this.currentToken() && !this.match('SEPARATOR', ')')) {
            if (this.match('KEYWORD')) {
                this.advance();
            }
            if (this.match('IDENTIFIER')) {
                this.advance();
            }
            if (this.match('SEPARATOR', ',')) {
                this.advance();
            }
        }

        this.expect('SEPARATOR', ')');

        if (this.match('SEPARATOR', '{')) {
            this.advance();
            this.parseBlock();
        } else if (this.match('SEPARATOR', ';')) {
            this.advance();
        }

        this.parseTree.push({ type: 'FUNCTION_DECLARATION', name: identifier.value });
    }

    parseVariableDeclaration(type, identifier) {
        if (this.match('OPERATOR', '=')) {
            this.advance();
            this.parseExpression();
        }

        while (this.match('SEPARATOR', ',')) {
            this.advance();
            if (this.match('IDENTIFIER')) {
                this.advance();
                if (this.match('OPERATOR', '=')) {
                    this.advance();
                    this.parseExpression();
                }
            }
        }

        this.expect('SEPARATOR', ';');
        this.parseTree.push({ type: 'VARIABLE_DECLARATION', name: identifier.value });
    }

    parseIfStatement() {
        this.expect('KEYWORD', 'if');
        this.expect('SEPARATOR', '(');
        this.parseExpression();
        this.expect('SEPARATOR', ')');

        if (this.match('SEPARATOR', '{')) {
            this.advance();
            this.parseBlock();
        } else {
            this.parseStatement();
        }

        if (this.match('KEYWORD', 'else')) {
            this.advance();
            if (this.match('SEPARATOR', '{')) {
                this.advance();
                this.parseBlock();
            } else {
                this.parseStatement();
            }
        }

        this.parseTree.push({ type: 'IF_STATEMENT' });
    }

    parseWhileStatement() {
        this.expect('KEYWORD', 'while');
        this.expect('SEPARATOR', '(');
        this.parseExpression();
        this.expect('SEPARATOR', ')');

        if (this.match('SEPARATOR', '{')) {
            this.advance();
            this.parseBlock();
        } else {
            this.parseStatement();
        }

        this.parseTree.push({ type: 'WHILE_STATEMENT' });
    }

    parseForStatement() {
        this.expect('KEYWORD', 'for');
        this.expect('SEPARATOR', '(');

        if (!this.match('SEPARATOR', ';')) {
            this.parseExpression();
        }
        this.expect('SEPARATOR', ';');

        if (!this.match('SEPARATOR', ';')) {
            this.parseExpression();
        }
        this.expect('SEPARATOR', ';');

        if (!this.match('SEPARATOR', ')')) {
            this.parseExpression();
        }
        this.expect('SEPARATOR', ')');

        if (this.match('SEPARATOR', '{')) {
            this.advance();
            this.parseBlock();
        } else {
            this.parseStatement();
        }

        this.parseTree.push({ type: 'FOR_STATEMENT' });
    }

    parseReturnStatement() {
        this.expect('KEYWORD', 'return');

        if (!this.match('SEPARATOR', ';')) {
            this.parseExpression();
        }

        this.expect('SEPARATOR', ';');
        this.parseTree.push({ type: 'RETURN_STATEMENT' });
    }

    parseAssignmentOrFunctionCall() {
        this.advance();

        if (this.match('SEPARATOR', '(')) {
            this.advance();
            while (this.currentToken() && !this.match('SEPARATOR', ')')) {
                if (this.match('SEPARATOR', ',')) {
                    this.advance();
                } else {
                    this.parseExpression();
                    if (this.match('SEPARATOR', ',')) {
                        continue;
                    } else if (!this.match('SEPARATOR', ')')) {
                        break;
                    }
                }
            }
            this.expect('SEPARATOR', ')');
            this.expect('SEPARATOR', ';');
            this.parseTree.push({ type: 'FUNCTION_CALL' });
        } else if (this.match('OPERATOR')) {
            this.advance();
            this.parseExpression();
            this.expect('SEPARATOR', ';');
            this.parseTree.push({ type: 'ASSIGNMENT' });
        }
    }

    parseBlock() {
        while (this.currentToken() && !this.match('SEPARATOR', '}')) {
            this.parseStatement();
        }
        this.expect('SEPARATOR', '}');
    }

    parseExpression() {
        let depth = 0;

        while (this.currentToken()) {
            const token = this.currentToken();

            if (token.type === 'SEPARATOR') {
                if (token.value === '(') {
                    depth++;
                    this.advance();
                } else if (token.value === ')') {
                    if (depth === 0) break;
                    depth--;
                    this.advance();
                } else if ([';', ',', '{', '}'].includes(token.value)) {
                    break;
                } else {
                    this.advance();
                }
            } else {
                this.advance();
            }
        }
    }

    formatOutput(result) {
        if (result.success) {
            let output = 'SYNTAX ANALYSIS RESULTS\n';
            output += '='.repeat(60) + '\n\n';
            output += '✓ ' + result.message + '\n\n';
            output += 'Parse Tree Nodes:\n';
            output += '-'.repeat(60) + '\n';

            const nodeCounts = {};
            result.tree.forEach(node => {
                nodeCounts[node.type] = (nodeCounts[node.type] || 0) + 1;
            });

            for (let type in nodeCounts) {
                output += `  ${type}: ${nodeCounts[type]}\n`;
            }

            return output;
        } else {
            let output = 'SYNTAX ANALYSIS ERRORS\n';
            output += '='.repeat(60) + '\n\n';
            output += `Found ${result.errors.length} error(s):\n\n`;

            result.errors.forEach((error, index) => {
                output += `${index + 1}. Line ${error.line}: ${error.message}\n`;
            });

            return output;
        }
    }
}
