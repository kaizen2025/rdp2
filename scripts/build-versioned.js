// scripts/build-versioned.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

function main() {
    try {
        console.log('🚀 Démarrage du build versionné...');

        // 1. Lire et parser package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const currentVersion = packageJson.version;
        console.log(`- Version actuelle : ${currentVersion}`);

        // 2. Incrémenter la version (patch)
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;
        packageJson.version = newVersion;
        console.log(`- Nouvelle version : ${newVersion}`);

        // 3. Réécrire package.json avec la nouvelle version
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
        console.log('✅ package.json mis à jour.');

        // 4. Lancer la commande de build simplifiée
        console.log('\n🔨 Lancement de la compilation React et du packaging Electron...');
        execSync('npm run build:exe', { stdio: 'inherit' });

        console.log('\n🎉 Build versionné terminé avec succès !');
        console.log(`   Exécutable généré dans le dossier /dist avec la version ${newVersion}.`);
        console.log('   N\'oubliez pas de copier le .exe et le fichier latest.yml sur votre serveur de mise à jour.');

    } catch (error) {
        console.error('\n❌ Une erreur est survenue lors du build versionné :');
        console.error(error.message);
        process.exit(1);
    }
}

main();