@echo off
title Service de Notification des Interactions
cd /d C:\Users\Lenovo2\Downloads\Visualisation_appels_offres0d1\matching\hbrgeeee\Backend\consultants

:: Vérification de l'environnement
if not exist "manage.py" (
    echo Fichier manage.py introuvable
    pause
    exit /b 1
)

:: Démarrer le service
echo Démarrage du service de notification...
echo Appuyez sur Ctrl+C pour arrêter

call venv\Scripts\activate.bat
python manage.py collection 

:: En cas d'arrêt inattendu
echo Le service de notification s'est arrêté
timeout /t 3 >nul