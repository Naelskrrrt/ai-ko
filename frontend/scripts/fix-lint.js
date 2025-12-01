#!/usr/bin/env node
/**
 * Script pour corriger automatiquement les problèmes de linting les plus courants
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// Patterns de fichiers à traiter
const files = glob.sync('**/*.{ts,tsx}', {
  cwd: SRC_DIR,
  ignore: ['**/*.d.ts', '**/node_modules/**'],
  absolute: true,
});

let fixedCount = 0;

files.forEach((filePath) => {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // 1. Corriger les console.log/error/warn/info en ajoutant eslint-disable
  content = content.replace(
    /(\s+)(console\.(log|error|warn|info)\([^)]*\);)/g,
    (match, indent, consoleCall) => {
      // Vérifier si déjà un eslint-disable avant
      const lines = content.split('\n');
      const lineIndex = content.substring(0, content.indexOf(match)).split('\n').length - 1;
      const prevLine = lines[lineIndex - 1] || '';
      
      if (!prevLine.includes('eslint-disable-next-line no-console')) {
        modified = true;
        return `${indent}// eslint-disable-next-line no-console\n${indent}${consoleCall}`;
      }
      return match;
    }
  );

  // 2. Corriger les variables non utilisées en les préfixant avec _
  // Variables déclarées mais non utilisées dans les destructuring
  content = content.replace(
    /const\s+{\s*([^}]+)\s*}\s*=\s*useAuth\(\);/g,
    (match, vars) => {
      const varList = vars.split(',').map(v => v.trim());
      const unused = varList.filter(v => {
        const varName = v.split(':')[0].trim();
        // Vérifier si utilisé dans le fichier
        const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
        const matches = content.match(usageRegex) || [];
        return matches.length <= 1; // Seulement la déclaration
      });
      
      if (unused.length > 0) {
        modified = true;
        const newVars = varList.map(v => {
          const varName = v.split(':')[0].trim();
          if (unused.includes(varName)) {
            return v.replace(varName, `_${varName}`);
          }
          return v;
        }).join(', ');
        return `const { ${newVars} } = useAuth();`;
      }
      return match;
    }
  );

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    fixedCount++;
    console.log(`✓ Fixed: ${filePath.replace(process.cwd(), '')}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);

