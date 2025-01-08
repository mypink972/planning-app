#!/bin/bash

# Installer les dépendances Electron
npm install --save-dev electron electron-builder concurrently wait-on

# Mettre à jour package.json avec les scripts nécessaires
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json"));
package.main = "electron/main.js";
package.scripts = {
  ...package.scripts,
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
  "electron:build": "npm run build && electron-builder",
  "electron:make": "npm run build && electron-builder -m"
};
fs.writeFileSync("package.json", JSON.stringify(package, null, 2));
'

# Créer le dossier pour l'icône
mkdir -p build

# Télécharger une icône par défaut (à remplacer plus tard)
curl -o build/icon.png https://raw.githubusercontent.com/electron/electron/main/default_app/icon.png

# Convertir l'icône en format .icns pour macOS
sips -s format icns build/icon.png --out build/icon.icns

echo "Installation terminée. Vous pouvez maintenant exécuter :"
echo "npm run electron:dev    # Pour le développement"
echo "npm run electron:make   # Pour créer l'application"
