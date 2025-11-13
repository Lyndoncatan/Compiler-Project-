let sourceCode = '';
let lexicalAnalyzer = null;
let currentTokens = [];

const fileInput = document.getElementById('fileInput');
const openFileBtn = document.getElementById('openFileBtn');
const lexicalBtn = document.getElementById('lexicalBtn');
const syntaxBtn = document.getElementById('syntaxBtn');
const semanticBtn = document.getElementById('semanticBtn');
const clearBtn = document.getElementById('clearBtn');
const codeArea = document.getElementById('codeArea');
const resultArea = document.getElementById('resultArea');

openFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            sourceCode = e.target.result;
            codeArea.value = sourceCode;
            resultArea.textContent = `File loaded: ${file.name}\n\nReady for analysis.`;

            lexicalBtn.disabled = false;
            syntaxBtn.disabled = true;
            semanticBtn.disabled = true;

            lexicalAnalyzer = null;
            currentTokens = [];
        };

        reader.onerror = () => {
            resultArea.textContent = 'Error reading file. Please try again.';
        };

        reader.readAsText(file);
    }
});

lexicalBtn.addEventListener('click', () => {
    if (!sourceCode) {
        resultArea.textContent = 'Please open a file first.';
        return;
    }

    try {
        lexicalAnalyzer = new LexicalAnalyzer();
        currentTokens = lexicalAnalyzer.analyze(sourceCode);

        const output = lexicalAnalyzer.formatOutput();
        resultArea.textContent = output;

        if (currentTokens.length > 0) {
            syntaxBtn.disabled = false;
        }

        lexicalBtn.disabled = true;

    } catch (error) {
        resultArea.textContent = `Error during lexical analysis:\n${error.message}`;
    }
});

syntaxBtn.addEventListener('click', () => {
    if (currentTokens.length === 0) {
        resultArea.textContent = 'Please run lexical analysis first.';
        return;
    }

    try {
        const syntaxAnalyzer = new SyntaxAnalyzer(currentTokens);
        const result = syntaxAnalyzer.analyze();

        const output = syntaxAnalyzer.formatOutput(result);
        resultArea.textContent = output;

        if (result.success) {
            semanticBtn.disabled = false;
        }

        syntaxBtn.disabled = true;

    } catch (error) {
        resultArea.textContent = `Error during syntax analysis:\n${error.message}`;
    }
});

semanticBtn.addEventListener('click', () => {
    if (currentTokens.length === 0) {
        resultArea.textContent = 'Please run lexical and syntax analysis first.';
        return;
    }

    try {
        const semanticAnalyzer = new SemanticAnalyzer(currentTokens);
        const result = semanticAnalyzer.analyze();

        const output = semanticAnalyzer.formatOutput(result);
        resultArea.textContent = output;

        semanticBtn.disabled = true;

    } catch (error) {
        resultArea.textContent = `Error during semantic analysis:\n${error.message}`;
    }
});

clearBtn.addEventListener('click', () => {
    sourceCode = '';
    codeArea.value = '';
    resultArea.textContent = '';
    fileInput.value = '';

    lexicalBtn.disabled = true;
    syntaxBtn.disabled = true;
    semanticBtn.disabled = true;

    lexicalAnalyzer = null;
    currentTokens = [];
});

codeArea.addEventListener('input', () => {
    sourceCode = codeArea.value;

    if (sourceCode.trim()) {
        lexicalBtn.disabled = false;
    } else {
        lexicalBtn.disabled = true;
    }

    syntaxBtn.disabled = true;
    semanticBtn.disabled = true;
    currentTokens = [];
    lexicalAnalyzer = null;
});
