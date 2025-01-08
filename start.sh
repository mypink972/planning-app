#!/bin/bash

# Chemin vers le dossier du projet
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Chemins absolus vers les exécutables
NODE="/usr/local/bin/node"
NPM="/usr/local/bin/npm"

# Fonction pour tuer les processus en arrière-plan
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null
    fi
    exit 0
}

# Attraper le signal d'interruption
trap cleanup SIGINT SIGTERM

# Aller dans le dossier du projet
cd "$PROJECT_DIR"

# Installer les dépendances du serveur si nécessaire
if [ ! -d "server/node_modules" ]; then
    echo "Installation des dépendances du serveur..."
    cd server && "$NPM" install && cd ..
fi

# Installer les dépendances principales si nécessaire
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances principales..."
    "$NPM" install
fi

# Démarrer le serveur mail en arrière-plan
echo "Démarrage du serveur mail..."
cd server && "$NODE" index.js &
SERVER_PID=$!

# Vérifier que le serveur mail démarre correctement
sleep 2
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Erreur: Le serveur mail n'a pas démarré correctement"
    cleanup
    exit 1
fi

# Retourner au dossier principal
cd "$PROJECT_DIR"

# Démarrer le serveur de développement Vite
echo "Démarrage du serveur de développement..."
"$NPM" run dev &
VITE_PID=$!

# Fonction pour vérifier si le serveur Vite est prêt
check_vite() {
    local max_attempts=30
    local attempt=1
    
    echo "Attente du démarrage du serveur Vite..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:5173 > /dev/null; then
            echo "Serveur Vite démarré avec succès !"
            return 0
        fi
        echo "Tentative $attempt/$max_attempts..."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "Erreur: Le serveur Vite n'a pas démarré après $max_attempts secondes"
    return 1
}

# Attendre que le serveur Vite soit prêt
if ! check_vite; then
    cleanup
    exit 1
fi

# Attendre 2 secondes supplémentaires pour être sûr
sleep 2

# Ouvrir le navigateur
echo "Ouverture du navigateur..."
open "http://localhost:5173"

# Attendre que l'un des processus se termine
wait $SERVER_PID $VITE_PID
