#!/bin/zsh

# Charger l'environnement zsh
source ~/.zshrc 2>/dev/null

# Définir le PATH
export PATH="/usr/local/bin:$PATH"

# Aller dans le dossier du projet
cd ~/Desktop/project

# Créer un fichier de log
exec 1> ~/Desktop/project/launcher.log 2>&1

# Afficher les informations de débogage
echo "=== Démarrage de l'application ==="
echo "Date: $(date)"
echo "Node path: $(which node)"
echo "npm path: $(which npm)"
echo "Current directory: $(pwd)"
echo "========================"

# Exécuter le script principal
./start.sh
