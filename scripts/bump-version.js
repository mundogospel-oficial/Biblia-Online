import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Recria o __dirname que é necessário para o ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O restante da sua lógica continua igual
const versionFile = path.join(__dirname, '..', 'public', 'version.json');
const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

const parts = data.version.split('.');
const minor = parseInt(parts[1] || '0') + 1;
data.version = `${parts[0]}.${minor}`;

fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + '\n');
console.log(`Version bumped to ${data.version}`);
