const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

console.log("Buscando links de impresión en src...");
walkDir(path.resolve(__dirname, '../src'), (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('/print/') || content.includes('print/')) {
            console.log(`- Encontrado en: ${filePath}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('print') && (line.includes('href') || line.includes('window.open') || line.includes('router.push'))) {
                    console.log(`  Línea ${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
});
