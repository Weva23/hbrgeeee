from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model
from .email_service import send_password_reset_email
import logging

# Configurer le logging
logger = logging.getLogger(__name__)

User = get_user_model()


@api_view(['POST'])
def request_password_reset(request):
    """
    Endpoint pour demander la réinitialisation du mot de passe

    Body: {"email": "user@example.com"}
    """
    email = request.data.get('email')

    if not email:
        return Response({"error": "Email requis"}, status=400)

    try:
        # Récupérer l'utilisateur par email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Pour des raisons de sécurité, nous simulons une réponse positive même si l'utilisateur n'existe pas
            logger.info(f"Demande de réinitialisation pour un compte inexistant: {email}")
            return Response(
                {"message": "Si l'adresse email est associée à un compte, un email de réinitialisation a été envoyé."})

        # Générer un token pour la réinitialisation du mot de passe
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Obtenir l'URL du frontend depuis le header de la requête ou utiliser une valeur par défaut
        frontend_origin = request.headers.get('Origin', 'http://localhost:5173')
        reset_url = f"{frontend_origin}/reset-password/{uid}/{token}"

        logger.info(f"URL de réinitialisation générée: {reset_url}")
        logger.info(f"Pour l'utilisateur: {user.username} (ID: {user.id})")

        # Envoyer l'email de réinitialisation
        result = send_password_reset_email(user, reset_url)
        if result:
            logger.info(f"Email de réinitialisation envoyé avec succès à {user.email}")
            return Response({"message": "Email de réinitialisation envoyé avec succès."})
        else:
            logger.error(f"Échec de l'envoi d'email à {user.email}")
            return Response({"error": "Problème lors de l'envoi de l'email."}, status=500)

    except Exception as e:
        logger.error(f"Erreur lors de la demande de réinitialisation: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({"error": "Une erreur s'est produite lors de la demande de réinitialisation."}, status=500)


@api_view(['POST'])
def reset_password(request):
    """
    Endpoint pour réinitialiser le mot de passe avec le token

    Body: {
        "uid": "base64encoded_user_id",
        "token": "reset_token",
        "new_password": "new_password"
    }
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    logger.info(f"Tentative de réinitialisation de mot de passe - UID: {uid}, Token fourni: {token is not None}")

    if not all([uid, token, new_password]):
        return Response({"error": "Tous les champs sont requis"}, status=400)

    if len(new_password) < 8:
        return Response({"error": "Le mot de passe doit contenir au moins 8 caractères"}, status=400)

    try:
        # Décoder l'ID utilisateur depuis base64
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            logger.info(f"Utilisateur trouvé: {user.username} (ID: {user.id})")
        except Exception as e:
            logger.error(f"Erreur lors du décodage de l'UID ou utilisateur non trouvé: {str(e)}")
            return Response({"error": "Lien de réinitialisation invalide"}, status=400)

        # Vérifier si le token est valide
        if not default_token_generator.check_token(user, token):
            logger.warning(f"Token invalide pour l'utilisateur {user.id}")
            return Response({"error": "Le lien de réinitialisation est invalide ou a expiré"}, status=400)

        # Réinitialiser le mot de passe
        user.set_password(new_password)
        user.save()
        logger.info(f"Mot de passe réinitialisé avec succès pour {user.email}")

        return Response({"message": "Mot de passe réinitialisé avec succès"})
    except User.DoesNotExist:
        logger.warning(f"Tentative de réinitialisation pour un utilisateur inexistant: {uid}")
        return Response({"error": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Erreur lors de la réinitialisation du mot de passe: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({"error": "Une erreur s'est produite lors de la réinitialisation du mot de passe"}, status=500)


@api_view(['POST'])
def validate_reset_token(request):
    """
    Endpoint pour valider un token de réinitialisation sans changer le mot de passe

    Body: {
        "uid": "base64encoded_user_id",
        "token": "reset_token"
    }
    """
    uid = request.data.get('uid')
    token = request.data.get('token')

    logger.info(f"Tentative de validation de token - UID: {uid}, Token fourni: {token is not None}")

    if not all([uid, token]):
        return Response({"error": "UID et token requis"}, status=400)

    try:
        # Décoder l'ID utilisateur depuis base64
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            logger.info(f"Validation de token - Utilisateur trouvé: {user.username} (ID: {user.id})")
        except Exception as e:
            logger.error(f"Validation de token - Erreur lors du décodage de l'UID ou utilisateur non trouvé: {str(e)}")
            return Response({"valid": False, "error": "Lien de réinitialisation invalide"})

        # Vérifier si le token est valide
        if default_token_generator.check_token(user, token):
            logger.info(f"Token validé pour l'utilisateur {user.email}")
            return Response({"valid": True, "user_email": user.email})
        else:
            logger.warning(f"Token invalide pour l'utilisateur {user.email}")
            return Response({"valid": False, "error": "Token invalide ou expiré"})
    except User.DoesNotExist:
        logger.warning(f"Validation de token pour un utilisateur inexistant: {uid}")
        return Response({"valid": False, "error": "Utilisateur non trouvé"})
    except Exception as e:
        logger.error(f"Erreur lors de la validation du token: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({"valid": False, "error": "Erreur de validation du token"})