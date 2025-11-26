#!/usr/bin/env node
/**
 * Script pour démarrer ngrok pour le backend (port 5000)
 * Usage: node scripts/ngrok-backend.js
 */

import ngrok from '@ngrok/ngrok';

const PORT = 5000;

async function startNgrok() {
  try {
    console.log(`🌐 Démarrage de ngrok pour le backend (port ${PORT})...\n`);
    console.log('⚠️  Assurez-vous que le backend est démarré sur le port 5000\n');
    
    // Démarrer le tunnel
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken_from_env: true, // Utilise NGROK_AUTHTOKEN depuis l'environnement
    });

    console.log('✅ Tunnel ngrok créé avec succès!\n');
    console.log(`📋 URL publique: ${listener.url()}`);
    console.log(`🔗 Forwarding: ${listener.url()} -> http://localhost:${PORT}\n`);
    console.log('⚠️  Appuyez sur Ctrl+C pour arrêter le tunnel\n');

    // Gérer l'arrêt propre
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Arrêt du tunnel ngrok...');
      await listener.close();
      console.log('✅ Tunnel fermé');
      process.exit(0);
    });

    // Garder le processus actif
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de ngrok:', error.message);
    console.error('\n💡 Solutions possibles:');
    console.error('   1. Installez ngrok globalement: npm install -g ngrok');
    console.error('   2. Configurez NGROK_AUTHTOKEN dans votre .env');
    console.error('   3. Ou utilisez les scripts PowerShell/Bash fournis');
    process.exit(1);
  }
}

startNgrok();




