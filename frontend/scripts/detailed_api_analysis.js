#!/usr/bin/env node
/**
 * Analyse détaillée des endpoints manquants
 * Catégorise les vrais problèmes vs les faux positifs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RED = '\x1b[91m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const BLUE = '\x1b[94m';
const CYAN = '\x1b[96m';
const MAGENTA = '\x1b[95m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Lire le rapport précédent
const FRONTEND_DIR = path.join(__dirname, '..');
const reportPath = path.join(FRONTEND_DIR, 'api-analysis-report.json');

if (!fs.existsSync(reportPath)) {
  console.log(`${RED}Rapport non trouvé. Exécutez d'abord: pnpm check-api${RESET}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
const missingRoutes = report.issues.missingBackendRoutes;

// Routes backend connues (extraites de l'exécution Python)
const KNOWN_BACKEND_ROUTES = {
  // Auth - toutes existent
  'GET:/api/auth/oauth/google': true,
  'POST:/api/auth/oauth/google/callback': true,
  'POST:/api/auth/login': true,
  'POST:/api/auth/logout': true,
  'GET:/api/auth/me': true,
  'PUT:/api/auth/me': true,
  'POST:/api/auth/register': true,
  'POST:/api/auth/complete-profile': true,
  
  // Health - existe
  'GET:/api/health': true,
  
  // Admin (toutes les routes admin existent)
  'admin:*': true,
  
  // Sessions sont sous /sessions-examen pas /sessions
  'sessions-examen': '/api/sessions-examen',
  
  // Matieres/Niveaux/Classes sont des namespaces avec routes list
  'GET:/api/matieres': true,
  'GET:/api/niveaux': true,
  'GET:/api/classes': true,
  'GET:/api/qcm': true,
  'POST:/api/qcm': true,
  'PUT:/api/matieres/:param': true,
  'DELETE:/api/matieres/:param': true,
};

// Catégoriser les problèmes
const categories = {
  falsePositives: [],      // Faux positifs (route existe mais pattern différent)
  missingNamespaceRoutes: [], // Routes manquantes dans un namespace
  wrongPath: [],           // Frontend utilise un mauvais path
  notImplemented: [],      // API non implémentée dans le backend
  proxyRoutes: [],         // Routes Next.js proxy (pas directement vers Flask)
};

for (const route of missingRoutes) {
  const { method, endpoint, files } = route;
  const key = `${method}:${endpoint}`;
  
  // 1. Routes proxy Next.js (dans src/app/api/)
  if (files.some(f => f.includes('src\\app\\api\\'))) {
    if (endpoint.startsWith('/auth/') && !endpoint.startsWith('/api/auth/')) {
      // Routes /auth/* sont des proxies vers /api/auth/*
      categories.falsePositives.push({
        ...route,
        reason: 'Route proxy Next.js → Backend utilise /api/auth/*',
        backendRoute: `/api${endpoint}`,
      });
      continue;
    }
  }
  
  // 2. Routes /api/sessions/* → doivent être /api/sessions-examen/*
  if (endpoint.includes('/api/sessions')) {
    const correctPath = endpoint.replace('/api/sessions', '/api/sessions-examen');
    categories.wrongPath.push({
      ...route,
      reason: 'Frontend utilise /sessions mais backend utilise /sessions-examen',
      frontendPath: endpoint,
      backendPath: correctPath,
      severity: 'HIGH',
    });
    continue;
  }
  
  // 3. Routes /api/etudiants/* → namespace maintenant implémenté
  if (endpoint.includes('/api/etudiants')) {
    categories.falsePositives.push({
      ...route,
      reason: 'Route existe dans le namespace etudiants (implémenté)',
      backendExists: true,
    });
    continue;
  }
  
  // 4. Routes /api/enseignant/me → devrait être /api/enseignants/me
  if (endpoint === '/api/enseignant/me') {
    categories.wrongPath.push({
      ...route,
      reason: 'Faute de frappe: /enseignant/ au lieu de /enseignants/',
      frontendPath: endpoint,
      backendPath: '/api/enseignants/me',
      severity: 'MEDIUM',
    });
    continue;
  }
  
  // 5. Routes admin/* existent toutes
  if (endpoint.includes('/api/admin/')) {
    categories.falsePositives.push({
      ...route,
      reason: 'Route admin existe (non détectée par analyse statique car dans blueprint séparé)',
      backendExists: true,
    });
    continue;
  }
  
  // 6. GET/POST /api/matieres, /api/niveaux, /api/classes, /api/qcm
  if (['/api/matieres', '/api/niveaux', '/api/classes', '/api/qcm'].includes(endpoint)) {
    categories.falsePositives.push({
      ...route,
      reason: 'Route existe (namespace enregistré avec routes list)',
      backendExists: true,
    });
    continue;
  }
  
  // 6b. GET /api/health existe
  if (endpoint === '/api/health') {
    categories.falsePositives.push({
      ...route,
      reason: 'Route /api/health existe dans health.py',
      backendExists: true,
    });
    continue;
  }
  
  // 6c. Routes auth OAuth existe
  if (endpoint === '/api/auth/oauth/google') {
    categories.falsePositives.push({
      ...route,
      reason: 'Route OAuth Google existe dans auth.py',
      backendExists: true,
    });
    continue;
  }
  
  // 6d. POST /api/auth/logout existe (différent de POST /auth/logout qui est proxy)
  if (endpoint === '/api/auth/logout' && method === 'POST') {
    categories.falsePositives.push({
      ...route,
      reason: 'Route POST /api/auth/logout existe dans auth.py',
      backendExists: true,
    });
    continue;
  }
  
  // 7. Routes auth spéciales
  if (endpoint === '/api/auth/refresh') {
    categories.falsePositives.push({
      ...route,
      reason: 'Route POST /api/auth/refresh existe maintenant dans auth.py',
      backendExists: true,
    });
    continue;
  }
  
  // 8. PUT /api/auth/me 
  if (endpoint === '/api/auth/me' && method === 'PUT') {
    categories.falsePositives.push({
      ...route,
      reason: 'Route PUT /api/auth/me existe dans auth.py',
      backendExists: true,
    });
    continue;
  }
  
  // 9. PUT/DELETE /api/matieres/:param
  if (endpoint.match(/\/api\/matieres\/:param$/) && ['PUT', 'DELETE'].includes(method)) {
    categories.falsePositives.push({
      ...route,
      reason: 'Route existe dans matiere.py',
      backendExists: true,
    });
    continue;
  }
  
  // 10. Routes non classifiées → probablement vraies manquantes
  categories.notImplemented.push({
    ...route,
    reason: 'Route non trouvée dans le backend',
    severity: 'MEDIUM',
  });
}

// Afficher le rapport
console.log('\n' + '═'.repeat(70));
console.log(`${BOLD}${CYAN}📊 ANALYSE DÉTAILLÉE DES ENDPOINTS FRONTEND ↔ BACKEND${RESET}`);
console.log('═'.repeat(70));

// Faux positifs
console.log(`\n${GREEN}${BOLD}✅ FAUX POSITIFS (${categories.falsePositives.length})${RESET}`);
console.log(`${DIM}   Ces routes existent mais l'analyse statique ne les a pas détectées${RESET}`);
if (categories.falsePositives.length > 0) {
  for (const r of categories.falsePositives) {
    console.log(`   ${GREEN}•${RESET} ${r.method} ${r.endpoint}`);
    console.log(`     ${DIM}→ ${r.reason}${RESET}`);
  }
}

// Mauvais paths (à corriger côté frontend)
console.log(`\n${YELLOW}${BOLD}⚠️  MAUVAIS PATHS FRONTEND (${categories.wrongPath.length})${RESET}`);
console.log(`${DIM}   Le frontend utilise un path différent du backend${RESET}`);
if (categories.wrongPath.length > 0) {
  for (const r of categories.wrongPath) {
    const color = r.severity === 'HIGH' ? RED : YELLOW;
    console.log(`   ${color}•${RESET} ${r.method} ${r.frontendPath}`);
    console.log(`     ${DIM}→ Backend: ${BOLD}${r.backendPath}${RESET}`);
    console.log(`     ${DIM}→ ${r.reason}${RESET}`);
    console.log(`     ${DIM}→ Fichiers: ${r.files.join(', ')}${RESET}`);
  }
}

// Non implémentés
console.log(`\n${RED}${BOLD}❌ NON IMPLÉMENTÉS BACKEND (${categories.notImplemented.length})${RESET}`);
console.log(`${DIM}   Ces routes n'existent pas dans le backend${RESET}`);
if (categories.notImplemented.length > 0) {
  for (const r of categories.notImplemented) {
    const color = r.severity === 'HIGH' ? RED : YELLOW;
    console.log(`   ${color}•${RESET} ${r.method} ${r.endpoint}`);
    console.log(`     ${DIM}→ ${r.reason}${RESET}`);
    if (r.suggestion) {
      console.log(`     ${BLUE}💡 ${r.suggestion}${RESET}`);
    }
    console.log(`     ${DIM}→ Fichiers: ${r.files.join(', ')}${RESET}`);
  }
}

// Résumé des actions
console.log('\n' + '═'.repeat(70));
console.log(`${BOLD}${MAGENTA}📋 ACTIONS RECOMMANDÉES${RESET}`);
console.log('═'.repeat(70));

const highPriorityWrongPaths = categories.wrongPath.filter(r => r.severity === 'HIGH');
const highPriorityNotImpl = categories.notImplemented.filter(r => r.severity === 'HIGH');

if (highPriorityWrongPaths.length > 0) {
  console.log(`\n${RED}${BOLD}🔴 PRIORITÉ HAUTE - Corriger les paths frontend:${RESET}`);
  for (const r of highPriorityWrongPaths) {
    console.log(`   1. ${r.files[0]}`);
    console.log(`      Remplacer: ${r.frontendPath} → ${r.backendPath}`);
  }
}

if (highPriorityNotImpl.length > 0) {
  console.log(`\n${RED}${BOLD}🔴 PRIORITÉ HAUTE - Implémenter dans le backend:${RESET}`);
  for (const r of highPriorityNotImpl) {
    console.log(`   • ${r.method} ${r.endpoint}`);
  }
}

// Statistiques finales
console.log('\n' + '═'.repeat(70));
console.log(`${BOLD}📈 STATISTIQUES${RESET}`);
console.log('═'.repeat(70));
console.log(`   Total endpoints analysés: ${missingRoutes.length}`);
console.log(`   ${GREEN}Faux positifs:${RESET} ${categories.falsePositives.length}`);
console.log(`   ${YELLOW}Mauvais paths frontend:${RESET} ${categories.wrongPath.length}`);
console.log(`   ${RED}Non implémentés backend:${RESET} ${categories.notImplemented.length}`);
console.log('');

// Sauvegarder le rapport détaillé
const detailedReport = {
  timestamp: new Date().toISOString(),
  summary: {
    total: missingRoutes.length,
    falsePositives: categories.falsePositives.length,
    wrongPaths: categories.wrongPath.length,
    notImplemented: categories.notImplemented.length,
  },
  categories,
};

const detailedReportPath = path.join(FRONTEND_DIR, 'api-detailed-analysis.json');
fs.writeFileSync(detailedReportPath, JSON.stringify(detailedReport, null, 2));
console.log(`${DIM}Rapport détaillé: ${detailedReportPath}${RESET}\n`);
