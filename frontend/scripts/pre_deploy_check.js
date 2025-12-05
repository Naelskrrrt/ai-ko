#!/usr/bin/env node
/**
 * Script de vérification pré-déploiement pour le frontend Next.js
 * Vérifie que le code est compatible avec un déploiement production.
 * 
 * Usage:
 *   node scripts/pre_deploy_check.js
 *   pnpm pre-deploy-check
 * 
 * Options:
 *   --skip-build     Ignorer le build Next.js
 *   --skip-api       Ignorer la vérification des endpoints API
 *   --api-url=URL    URL de l'API backend pour les tests
 *   --production     Tester avec l'URL de production
 * 
 * Ce script doit passer AVANT tout push vers main.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

// Couleurs pour l'affichage
const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printError(msg) {
  console.log(`${RED}❌ ERREUR: ${msg}${RESET}`);
}

function printWarning(msg) {
  console.log(`${YELLOW}⚠️  WARNING: ${msg}${RESET}`);
}

function printSuccess(msg) {
  console.log(`${GREEN}✅ ${msg}${RESET}`);
}

function printInfo(msg) {
  console.log(`   ${msg}`);
}

let allPassed = true;
let hasErrors = false;

/**
 * Exécute une commande et retourne le résultat
 */
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 120000, // 2 minutes par défaut
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message 
    };
  }
}

/**
 * Vérifie les erreurs TypeScript
 */
function checkTypeScript() {
  console.log('\n📄 Vérification TypeScript...');
  
  const result = runCommand('pnpm tsc --noEmit', { silent: true });
  
  if (result.success) {
    printSuccess('Pas d\'erreurs TypeScript');
    return true;
  } else {
    hasErrors = true;
    printError('Erreurs TypeScript détectées:');
    // Afficher les 10 premières lignes d'erreur
    const lines = (result.error || result.output).split('\n').slice(0, 10);
    lines.forEach(line => printInfo(line));
    if ((result.error || result.output).split('\n').length > 10) {
      printInfo('... (plus d\'erreurs, exécutez `pnpm tsc --noEmit` pour voir tout)');
    }
    return false;
  }
}

/**
 * Vérifie les erreurs ESLint
 */
function checkESLint() {
  console.log('\n📄 Vérification ESLint...');
  
  const result = runCommand('pnpm lint', { silent: true });
  
  if (result.success) {
    printSuccess('Pas d\'erreurs ESLint bloquantes');
    return true;
  } else {
    // ESLint peut retourner des warnings sans erreurs
    const output = result.error || result.output || '';
    const errorCount = (output.match(/error/gi) || []).length;
    const warningCount = (output.match(/warning/gi) || []).length;
    
    if (errorCount > 0) {
      hasErrors = true;
      printError(`${errorCount} erreur(s) ESLint détectée(s)`);
      const lines = output.split('\n').filter(l => l.includes('error')).slice(0, 5);
      lines.forEach(line => printInfo(line.trim()));
      return false;
    } else if (warningCount > 0) {
      printWarning(`${warningCount} warning(s) ESLint (non bloquants)`);
      return true;
    }
    
    printSuccess('Pas d\'erreurs ESLint');
    return true;
  }
}

/**
 * Vérifie le build Next.js
 */
function checkBuild() {
  console.log('\n📄 Vérification du build Next.js...');
  printInfo('(Cela peut prendre 1-2 minutes...)');
  
  const result = runCommand('pnpm build', { silent: true, timeout: 300000 }); // 5 minutes
  
  if (result.success) {
    printSuccess('Build Next.js réussi');
    return true;
  } else {
    hasErrors = true;
    printError('Build Next.js échoué:');
    const output = result.error || result.output || '';
    // Chercher les erreurs spécifiques
    const lines = output.split('\n')
      .filter(l => l.includes('Error') || l.includes('error') || l.includes('failed'))
      .slice(0, 10);
    lines.forEach(line => printInfo(line.trim()));
    return false;
  }
}

/**
 * Vérifie les variables d'environnement requises
 */
function checkEnvVariables() {
  console.log('\n📄 Vérification des variables d\'environnement...');
  
  const envExample = path.join(__dirname, '..', '.env.example');
  const envLocal = path.join(__dirname, '..', '.env.local');
  const envFile = path.join(__dirname, '..', '.env');
  
  // Vérifier que les fichiers .env ne sont pas dans git
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.env.local') && !gitignore.includes('.env*')) {
      printWarning('.env.local devrait être dans .gitignore');
    }
  }
  
  // Vérifier les variables NEXT_PUBLIC requises
  const requiredPublicVars = [
    'NEXT_PUBLIC_API_URL'
  ];
  
  let envContent = '';
  if (fs.existsSync(envLocal)) {
    envContent = fs.readFileSync(envLocal, 'utf-8');
  } else if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf-8');
  }
  
  const missingVars = requiredPublicVars.filter(v => !envContent.includes(v));
  
  if (missingVars.length > 0) {
    printWarning(`Variables potentiellement manquantes: ${missingVars.join(', ')}`);
    printInfo('Assurez-vous qu\'elles sont configurées sur Railway/Vercel');
  } else {
    printSuccess('Variables d\'environnement configurées');
  }
  
  return true;
}

/**
 * Vérifie la configuration Next.js
 */
function checkNextConfig() {
  console.log('\n📄 Vérification de next.config.js...');
  
  const configPath = path.join(__dirname, '..', 'next.config.js');
  const configMjsPath = path.join(__dirname, '..', 'next.config.mjs');
  const configTsPath = path.join(__dirname, '..', 'next.config.ts');
  
  let configFile = null;
  if (fs.existsSync(configPath)) configFile = configPath;
  else if (fs.existsSync(configMjsPath)) configFile = configMjsPath;
  else if (fs.existsSync(configTsPath)) configFile = configTsPath;
  
  if (!configFile) {
    printWarning('Fichier next.config non trouvé');
    return true;
  }
  
  const config = fs.readFileSync(configFile, 'utf-8');
  
  // Vérifications de production
  if (config.includes('output: "standalone"') || config.includes("output: 'standalone'")) {
    printSuccess('Mode standalone activé (bon pour Docker/Railway)');
  }
  
  // Vérifier les images distantes
  if (config.includes('remotePatterns') || config.includes('domains')) {
    printSuccess('Configuration des images distantes présente');
  }
  
  printSuccess('Configuration Next.js OK');
  return true;
}

/**
 * Vérifie les dépendances
 */
function checkDependencies() {
  console.log('\n📄 Vérification des dépendances...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
    printError('package.json non trouvé');
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  // Vérifier que les dépendances de prod ne sont pas dans devDependencies
  const criticalDeps = ['next', 'react', 'react-dom'];
  const missingDeps = criticalDeps.filter(d => !pkg.dependencies?.[d]);
  
  if (missingDeps.length > 0) {
    printError(`Dépendances critiques manquantes: ${missingDeps.join(', ')}`);
    return false;
  }
  
  printSuccess('Dépendances critiques présentes');
  return true;
}

/**
 * Analyse statique du code backend pour détecter les problèmes d'API
 */
function checkBackendCode() {
  console.log('\n📄 Analyse statique du code Backend...');
  
  const skipApi = hasFlag('skip-api');
  if (skipApi) {
    printWarning('Analyse Backend ignorée (--skip-api)');
    return { success: true, skipped: true };
  }
  
  const backendDir = path.join(__dirname, '..', '..', 'backend');
  
  if (!fs.existsSync(backendDir)) {
    printWarning(`Backend non trouvé: ${backendDir}`);
    return { success: true, skipped: true };
  }
  
  // Exécuter le script d'analyse
  const result = runCommand('node scripts/check_api_endpoints.js', { silent: true });
  
  if (result.success) {
    printSuccess('Analyse Backend: Aucun problème critique');
    return { success: true };
  } else {
    const output = result.output || result.error || '';
    
    // Vérifier s'il y a des namespaces non enregistrés (critique)
    if (output.includes('namespace(s) non enregistré')) {
      printError('Namespaces non enregistrés détectés dans le backend');
      printInfo('Exécutez: pnpm check-api --verbose pour plus de détails');
      return { success: false, critical: true };
    }
    
    // Warnings pour les endpoints manquants
    if (output.includes('potentiellement manquant')) {
      printWarning('Endpoints potentiellement manquants (vérification recommandée)');
      printInfo('Exécutez: pnpm check-api --verbose pour plus de détails');
      return { success: true, warnings: true };
    }
    
    printSuccess('Analyse Backend terminée');
    return { success: true };
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${BOLD}${CYAN}🔍 VÉRIFICATION PRÉ-DÉPLOIEMENT FRONTEND${RESET}`);
  console.log('='.repeat(60));
  
  // Changer vers le répertoire frontend
  const frontendDir = path.join(__dirname, '..');
  process.chdir(frontendDir);
  
  // Exécuter les vérifications
  checkDependencies();
  checkEnvVariables();
  checkNextConfig();
  
  const tsOk = checkTypeScript();
  const lintOk = checkESLint();
  
  // Analyse statique du code backend
  const backendResult = checkBackendCode();
  const backendOk = backendResult.success || backendResult.skipped;
  
  // Le build est optionnel car il prend du temps
  const skipBuild = hasFlag('skip-build');
  let buildOk = true;
  
  if (skipBuild) {
    console.log('\n📄 Build Next.js...');
    printWarning('Build ignoré (--skip-build)');
  } else {
    buildOk = checkBuild();
  }
  
  // Résultat final
  console.log('\n' + '='.repeat(60));
  
  if (!hasErrors && tsOk && lintOk && buildOk && backendOk) {
    if (backendResult.warnings) {
      printWarning('VÉRIFICATIONS PASSÉES (avec warnings backend) ⚠️');
      console.log('   Vérifiez les endpoints backend avant le déploiement.');
    } else {
      printSuccess('TOUTES LES VÉRIFICATIONS PASSÉES ✅');
      console.log('   Le frontend est prêt pour le déploiement.');
    }
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    printError('CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ ❌');
    console.log('   Corrigez les problèmes avant de push.');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  printError(`Erreur inattendue: ${err.message}`);
  process.exit(1);
}
