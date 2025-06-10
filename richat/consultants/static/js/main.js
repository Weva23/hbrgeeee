// Fichier: static/js/main.js

// Point d'entrée pour l'application React
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur une page de réinitialisation de mot de passe
    const path = window.location.pathname;

    if (path.startsWith('/reset-password/')) {
        // Extraire les paramètres uid et token de l'URL
        const segments = path.split('/');
        if (segments.length >= 4) {
            const uid = segments[2];
            const token = segments[3];

            // Stocker temporairement ces valeurs pour que l'application React les récupère
            window.resetPasswordParams = {
                uid: uid,
                token: token
            };

            console.log('Paramètres de réinitialisation détectés:', uid, token);
        }
    }

    console.log('Application chargée - en attente du chargement de React');
});

// Cette fonction sera appelée par React quand il sera chargé
window.onReactLoaded = function() {
    console.log('React est maintenant chargé');
};