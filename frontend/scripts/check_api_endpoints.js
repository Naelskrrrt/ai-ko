#!/usr/bin/env node
/**
 * Script d'analyse statique des endpoints API
 * Analyse le code source du backend pour détecter les routes disponibles
 * et les compare avec les endpoints utilisés par le frontend.
 * 
 * Usage:
 *   node scripts/check_api_endpoints.js
 *   pnpm check-api
 * 
 * Options:
 *   --verbose          Afficher les détails
 *   --fix-suggestions  Afficher des suggestions de correction
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour l'affichage
const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const BLUE = '\x1b[94m';
const CYAN = '\x1b[96m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Parse arguments
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const verbose = hasFlag('verbose');
const showSuggestions = hasFlag('fix-suggestions');

// Chemins
const FRONTEND_DIR = path.join(__dirname, '..');
const BACKEND_DIR = path.join(__dirname, '..', '..', 'backend');

/**
 * Affichage helpers
 */
function printSection(title) {
  console.log(`\n${BOLD}${CYAN}━━━ ${title} ━━━${RESET}`);
}

function printSuccess(msg) {
  console.log(`${GREEN}  ✓ ${msg}${RESET}`);
}

function printError(msg) {
  console.log(`${RED}  ✗ ${msg}${RESET}`);
}

function printWarning(msg) {
  console.log(`${YELLOW}  ⚠ ${msg}${RESET}`);
}

function printInfo(msg) {
  console.log(`${BLUE}  ℹ ${msg}${RESET}`);
}

/**
 * Analyse les fichiers Python du backend pour trouver les routes
 */
function analyzeBackendRoutes() {
  const routes = new Map(); // path -> { methods, file, namespace, registered }
  const namespaces = new Map(); // namespace name -> { file, prefix }
  const blueprints = new Map(); // blueprint name -> { file, prefix, registered }
  
  const apiDir = path.join(BACKEND_DIR, 'app', 'api');
  const initFile = path.join(BACKEND_DIR, 'app', '__init__.py');
  
  if (!fs.existsSync(apiDir)) {
    printError(`Répertoire backend non trouvé: ${apiDir}`);
    return { routes, namespaces, blueprints, error: true };
  }
  
  // 1. Analyser __init__.py pour trouver les blueprints enregistrés
  if (fs.existsSync(initFile)) {
    const initContent = fs.readFileSync(initFile, 'utf-8');
    
    // Trouver les imports de blueprints
    const importMatches = initContent.matchAll(/from\s+app\.api\.(\w+)\s+import\s+(\w+)\s+as\s+(\w+)/g);
    for (const match of importMatches) {
      blueprints.set(match[3], { 
        module: match[1], 
        importName: match[2],
        registered: false 
      });
    }
    
    // Trouver les register_blueprint
    const registerMatches = initContent.matchAll(/app\.register_blueprint\((\w+)(?:,\s*url_prefix=['"](\/[^'"]*)['"]\s*)?\)/g);
    for (const match of registerMatches) {
      const bpName = match[1];
      const prefix = match[2] || '';
      if (blueprints.has(bpName)) {
        blueprints.get(bpName).registered = true;
        blueprints.get(bpName).prefix = prefix;
      }
    }
  }
  
  // 2. Analyser chaque fichier Python dans app/api/
  const pyFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.py') && f !== '__init__.py');
  
  for (const pyFile of pyFiles) {
    const filePath = path.join(apiDir, pyFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const moduleName = pyFile.replace('.py', '');
    
    // Trouver les Namespace flask_restx
    const nsMatch = content.match(/api\s*=\s*Namespace\s*\(\s*['"]([\w-]+)['"]/);
    if (nsMatch) {
      namespaces.set(moduleName, { 
        name: nsMatch[1], 
        file: pyFile,
        registered: false,
        prefix: null
      });
    }
    
    // Trouver les Blueprint
    const bpMatch = content.match(/bp\s*=\s*Blueprint\s*\(\s*['"](\w+)['"].*?url_prefix\s*=\s*['"](\/[^'"]*)['"]/s);
    if (bpMatch) {
      const existingBp = [...blueprints.values()].find(b => b.module === moduleName);
      if (existingBp) {
        existingBp.definedPrefix = bpMatch[2];
      }
    }
    
    // Trouver les routes @api.route ou @bp.route
    const routeRegex = /@(?:api|bp)\.route\s*\(\s*['"]([^'"]+)['"]/g;
    let routeMatch;
    while ((routeMatch = routeRegex.exec(content)) !== null) {
      const routePath = routeMatch[1];
      
      // Trouver les méthodes (chercher dans les lignes suivantes)
      const afterRoute = content.slice(routeMatch.index);
      const classMatch = afterRoute.match(/class\s+\w+.*?(?=class\s|\Z)/s);
      const classContent = classMatch ? classMatch[0] : afterRoute.slice(0, 500);
      
      const methods = [];
      if (classContent.match(/def\s+get\s*\(/i)) methods.push('GET');
      if (classContent.match(/def\s+post\s*\(/i)) methods.push('POST');
      if (classContent.match(/def\s+put\s*\(/i)) methods.push('PUT');
      if (classContent.match(/def\s+patch\s*\(/i)) methods.push('PATCH');
      if (classContent.match(/def\s+delete\s*\(/i)) methods.push('DELETE');
      
      if (methods.length === 0) methods.push('GET');
      
      routes.set(`${moduleName}:${routePath}`, {
        path: routePath,
        methods,
        file: pyFile,
        namespace: nsMatch ? nsMatch[1] : null,
        module: moduleName,
      });
    }
  }
  
  // 3. Analyser les fichiers qui créent des Api et add_namespace
  for (const pyFile of pyFiles) {
    const filePath = path.join(apiDir, pyFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Trouver les add_namespace
    const nsAddRegex = /api\.add_namespace\s*\(\s*(\w+)\s*,\s*path\s*=\s*['"](\/[^'"]*)['"]/g;
    let nsAddMatch;
    while ((nsAddMatch = nsAddRegex.exec(content)) !== null) {
      const nsVarName = nsAddMatch[1];
      const nsPath = nsAddMatch[2];
      
      // Trouver l'import correspondant
      const importMatch = content.match(new RegExp(`from\\s+app\\.api\\.(\\w+)\\s+import\\s+api\\s+as\\s+${nsVarName}`));
      if (importMatch) {
        const sourceModule = importMatch[1];
        if (namespaces.has(sourceModule)) {
          namespaces.get(sourceModule).registered = true;
          namespaces.get(sourceModule).prefix = nsPath;
          namespaces.get(sourceModule).registeredIn = pyFile;
        }
      }
    }
  }
  
  return { routes, namespaces, blueprints };
}

/**
 * Analyse les fichiers TypeScript du frontend pour trouver les appels API
 */
function analyzeFrontendAPICalls() {
  const apiCalls = new Map(); // endpoint -> { methods, files }
  
  const srcDir = path.join(FRONTEND_DIR, 'src');
  
  if (!fs.existsSync(srcDir)) {
    printError(`Répertoire frontend src non trouvé: ${srcDir}`);
    return { apiCalls, error: true };
  }
  
  // Trouver tous les fichiers TS/TSX
  function findTsFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findTsFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    return files;
  }
  
  const tsFiles = findTsFiles(srcDir);
  
  // Map des baseURL par fichier service
  const serviceBaseUrls = new Map();
  
  // Premier passage: trouver les baseURL
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Pattern: baseURL: `${API_URL}/api/quelquechose`
    const baseMatch = content.match(/baseURL:\s*`\$\{[^}]+\}(\/api[^`]*)`/);
    if (baseMatch) {
      serviceBaseUrls.set(file, baseMatch[1]);
    }
  }
  
  // Deuxième passage: trouver les appels API
  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(FRONTEND_DIR, file);
    const baseUrl = serviceBaseUrls.get(file) || '';
    
    // Pattern pour axios: .get("/path"), .post("/path"), etc.
    const axiosPattern = /\.(get|post|put|patch|delete)\s*[<(]\s*(?:[^,)]+,\s*)?[`'"](\/[^`'"]*)[`'"]/gi;
    
    let match;
    while ((match = axiosPattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      let endpoint = match[2];
      
      // Construire l'endpoint complet
      if (!endpoint.startsWith('/api') && baseUrl) {
        endpoint = baseUrl + endpoint;
      }
      
      // Normaliser l'endpoint (remplacer les variables)
      const normalizedEndpoint = endpoint
        .replace(/\$\{[^}]+\}/g, ':param')
        .replace(/\/:[^/]+/g, '/:param');
      
      const key = `${method}:${normalizedEndpoint}`;
      
      if (!apiCalls.has(key)) {
        apiCalls.set(key, {
          method,
          endpoint: normalizedEndpoint,
          originalEndpoints: new Set(),
          files: new Set(),
        });
      }
      
      apiCalls.get(key).originalEndpoints.add(endpoint);
      apiCalls.get(key).files.add(relativePath);
    }
    
    // Pattern pour fetch avec API_URL
    const fetchPattern = /fetch\s*\(\s*`\$\{[^}]+\}(\/api[^`]*)`/g;
    while ((match = fetchPattern.exec(content)) !== null) {
      let endpoint = match[1];
      
      // Chercher la méthode
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(content.length, match.index + match[0].length + 200);
      const context = content.slice(contextStart, contextEnd);
      
      let method = 'GET';
      if (context.includes("method: 'POST'") || context.includes('method: "POST"')) method = 'POST';
      if (context.includes("method: 'PUT'") || context.includes('method: "PUT"')) method = 'PUT';
      if (context.includes("method: 'DELETE'") || context.includes('method: "DELETE"')) method = 'DELETE';
      if (context.includes("method: 'PATCH'") || context.includes('method: "PATCH"')) method = 'PATCH';
      
      const normalizedEndpoint = endpoint
        .replace(/\$\{[^}]+\}/g, ':param');
      
      const key = `${method}:${normalizedEndpoint}`;
      
      if (!apiCalls.has(key)) {
        apiCalls.set(key, {
          method,
          endpoint: normalizedEndpoint,
          originalEndpoints: new Set(),
          files: new Set(),
        });
      }
      
      apiCalls.get(key).originalEndpoints.add(endpoint);
      apiCalls.get(key).files.add(relativePath);
    }
  }
  
  return { apiCalls };
}

/**
 * Compare les routes backend et les appels frontend
 */
function compareRoutesAndCalls(backendAnalysis, frontendAnalysis) {
  const issues = {
    missingBackendRoutes: [], // Routes appelées par frontend mais pas dans backend
    unregisteredNamespaces: [], // Namespaces définis mais pas enregistrés
    unregisteredBlueprints: [], // Blueprints définis mais pas enregistrés
  };
  
  const { routes, namespaces, blueprints } = backendAnalysis;
  const { apiCalls } = frontendAnalysis;
  
  // Construire la liste des routes backend complètes
  const backendEndpoints = new Map();
  
  for (const [key, route] of routes) {
    const ns = namespaces.get(route.module);
    if (ns && ns.registered && ns.prefix) {
      const fullPath = `/api${ns.prefix}${route.path}`;
      for (const method of route.methods) {
        const normalizedPath = fullPath
          .replace(/<string:[^>]+>/g, ':param')
          .replace(/<int:[^>]+>/g, ':param')
          .replace(/<[^>]+>/g, ':param');
        
        backendEndpoints.set(`${method}:${normalizedPath}`, {
          ...route,
          fullPath,
          normalizedPath,
          method,
        });
      }
    }
  }
  
  // Vérifier les namespaces non enregistrés
  for (const [module, ns] of namespaces) {
    if (!ns.registered) {
      issues.unregisteredNamespaces.push({
        module,
        namespace: ns.name,
        file: ns.file,
      });
    }
  }
  
  // Vérifier les blueprints non enregistrés
  for (const [name, bp] of blueprints) {
    if (!bp.registered) {
      issues.unregisteredBlueprints.push({
        name,
        module: bp.module,
      });
    }
  }
  
  // Vérifier les appels frontend
  for (const [key, call] of apiCalls) {
    const { method, endpoint } = call;
    
    // Chercher une correspondance dans le backend
    let found = false;
    
    for (const [bKey, bRoute] of backendEndpoints) {
      // Comparer les méthodes et les paths normalisés
      if (method === bRoute.method && endpoint === bRoute.normalizedPath) {
        found = true;
        break;
      }
      
      // Comparaison plus flexible avec params
      const frontendParts = endpoint.split('/').filter(Boolean);
      const backendParts = bRoute.normalizedPath.split('/').filter(Boolean);
      
      if (frontendParts.length === backendParts.length && method === bRoute.method) {
        let matches = true;
        for (let i = 0; i < frontendParts.length; i++) {
          const fp = frontendParts[i];
          const bp = backendParts[i];
          if (fp !== bp && fp !== ':param' && bp !== ':param') {
            matches = false;
            break;
          }
        }
        if (matches) {
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      issues.missingBackendRoutes.push({
        method,
        endpoint,
        files: [...call.files],
      });
    }
  }
  
  return issues;
}

/**
 * Génère un rapport
 */
function generateReport(backendAnalysis, frontendAnalysis, issues) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      backendRoutes: backendAnalysis.routes.size,
      backendNamespaces: backendAnalysis.namespaces.size,
      frontendAPICalls: frontendAnalysis.apiCalls.size,
      issues: {
        missingBackendRoutes: issues.missingBackendRoutes.length,
        unregisteredNamespaces: issues.unregisteredNamespaces.length,
        unregisteredBlueprints: issues.unregisteredBlueprints.length,
      },
    },
    issues,
    backendNamespaces: Object.fromEntries(backendAnalysis.namespaces),
    backendRoutes: Object.fromEntries(backendAnalysis.routes),
    frontendAPICalls: Object.fromEntries(
      [...frontendAnalysis.apiCalls.entries()].map(([k, v]) => [
        k, 
        { ...v, files: [...v.files], originalEndpoints: [...v.originalEndpoints] }
      ])
    ),
  };
  
  const reportPath = path.join(FRONTEND_DIR, 'api-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return reportPath;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log(`${BOLD}🔍 ANALYSE STATIQUE DES ENDPOINTS API${RESET}`);
  console.log('═'.repeat(60));
  
  // Vérifier que le backend existe
  if (!fs.existsSync(BACKEND_DIR)) {
    printError(`Backend non trouvé: ${BACKEND_DIR}`);
    process.exit(1);
  }
  
  printInfo(`Backend: ${BACKEND_DIR}`);
  printInfo(`Frontend: ${FRONTEND_DIR}`);
  
  // 1. Analyser le backend
  printSection('Analyse du code Backend');
  const backendAnalysis = analyzeBackendRoutes();
  
  if (backendAnalysis.error) {
    process.exit(1);
  }
  
  printSuccess(`${backendAnalysis.routes.size} routes trouvées`);
  printSuccess(`${backendAnalysis.namespaces.size} namespaces trouvés`);
  printSuccess(`${backendAnalysis.blueprints.size} blueprints trouvés`);
  
  if (verbose) {
    console.log(`\n  ${DIM}Namespaces:${RESET}`);
    for (const [module, ns] of backendAnalysis.namespaces) {
      const status = ns.registered 
        ? `${GREEN}✓ enregistré${RESET} (${ns.prefix})`
        : `${RED}✗ NON ENREGISTRÉ${RESET}`;
      console.log(`    - ${ns.name} (${module}): ${status}`);
    }
  }
  
  // 2. Analyser le frontend
  printSection('Analyse du code Frontend');
  const frontendAnalysis = analyzeFrontendAPICalls();
  
  if (frontendAnalysis.error) {
    process.exit(1);
  }
  
  printSuccess(`${frontendAnalysis.apiCalls.size} appels API distincts trouvés`);
  
  if (verbose) {
    console.log(`\n  ${DIM}Appels API:${RESET}`);
    for (const [key, call] of frontendAnalysis.apiCalls) {
      console.log(`    - ${call.method} ${call.endpoint}`);
    }
  }
  
  // 3. Comparer
  printSection('Analyse des incohérences');
  const issues = compareRoutesAndCalls(backendAnalysis, frontendAnalysis);
  
  let hasErrors = false;
  
  // Namespaces non enregistrés
  if (issues.unregisteredNamespaces.length > 0) {
    hasErrors = true;
    printError(`${issues.unregisteredNamespaces.length} namespace(s) non enregistré(s):`);
    for (const ns of issues.unregisteredNamespaces) {
      console.log(`${RED}    • ${ns.namespace} (${ns.file})${RESET}`);
      if (showSuggestions) {
        console.log(`${DIM}      → Ajoutez: api.add_namespace(${ns.module.replace(/_/g, '_')}_ns, path='/${ns.namespace}')${RESET}`);
      }
    }
  } else {
    printSuccess('Tous les namespaces sont enregistrés');
  }
  
  // Routes manquantes dans le backend
  if (issues.missingBackendRoutes.length > 0) {
    printWarning(`${issues.missingBackendRoutes.length} endpoint(s) potentiellement manquant(s) dans le backend:`);
    for (const route of issues.missingBackendRoutes) {
      console.log(`${YELLOW}    • ${route.method} ${route.endpoint}${RESET}`);
      if (verbose) {
        console.log(`${DIM}      Utilisé dans: ${route.files.join(', ')}${RESET}`);
      }
    }
  } else {
    printSuccess('Tous les endpoints frontend ont une route backend correspondante');
  }
  
  // Générer le rapport
  const reportPath = generateReport(backendAnalysis, frontendAnalysis, issues);
  
  // Résumé
  console.log('\n' + '═'.repeat(60));
  console.log(`${BOLD}📊 RÉSUMÉ${RESET}`);
  console.log('═'.repeat(60));
  
  console.log(`  Routes backend analysées: ${backendAnalysis.routes.size}`);
  console.log(`  Appels API frontend: ${frontendAnalysis.apiCalls.size}`);
  console.log(`  Namespaces non enregistrés: ${issues.unregisteredNamespaces.length}`);
  console.log(`  Endpoints potentiellement manquants: ${issues.missingBackendRoutes.length}`);
  console.log(`\n  Rapport détaillé: ${reportPath}`);
  
  console.log('\n' + '═'.repeat(60));
  
  if (hasErrors) {
    console.log(`${RED}${BOLD}❌ PROBLÈMES DÉTECTÉS - CORRECTIONS REQUISES${RESET}`);
    console.log('═'.repeat(60) + '\n');
    process.exit(1);
  } else if (issues.missingBackendRoutes.length > 0) {
    console.log(`${YELLOW}${BOLD}⚠️  WARNINGS - VÉRIFICATION RECOMMANDÉE${RESET}`);
    console.log('═'.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.log(`${GREEN}${BOLD}✅ AUCUN PROBLÈME DÉTECTÉ${RESET}`);
    console.log('═'.repeat(60) + '\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`${RED}Erreur inattendue: ${err.message}${RESET}`);
  console.error(err.stack);
  process.exit(1);
});
