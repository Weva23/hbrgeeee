from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

# Configurer le logging
logger = logging.getLogger(__name__)

def send_registration_email(consultant):
    """
    Envoie un email de bienvenue à un consultant nouvellement inscrit

    Args:
        consultant: L'instance du modèle Consultant qui vient de s'inscrire
    """
    try:
        # Créer le sujet de l'email
        subject = 'Bienvenue chez Richat Partners - Confirmation d\'inscription'

        # Préparer le contexte pour le template
        context = {
            'first_name': consultant.prenom,
            'last_name': consultant.nom,
            'email': consultant.email,
            'expertise': consultant.expertise,
            'start_date': consultant.date_debut_dispo.strftime('%d/%m/%Y') if consultant.date_debut_dispo else "",
            'end_date': consultant.date_fin_dispo.strftime('%d/%m/%Y') if consultant.date_fin_dispo else "",
            'now': {'year': consultant.date_debut_dispo.year if consultant.date_debut_dispo else 2025},  # Ajout de l'année pour le template
        }

        # Rendre le template HTML
        html_message = render_to_string('emails/registration_confirmation.html', context)

        # Version texte de l'email
        plain_message = strip_tags(html_message)

        # Adresse email de l'expéditeur - Vérifier la configuration
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@richat-partners.com')

        # Adresse email du destinataire
        # S'assurer que l'email du consultant est bien défini
        if not consultant.email and hasattr(consultant, 'user') and consultant.user:
            recipient_email = consultant.user.email
        else:
            recipient_email = consultant.email

        recipient_list = [recipient_email]

        # Journalisation des informations avant envoi
        logger.info(f"Tentative d'envoi d'email à {recipient_email} depuis {from_email}")
        logger.info(f"Sujet: {subject}")

        # Vérifier la configuration SMTP
        smtp_host = getattr(settings, 'EMAIL_HOST', None)
        smtp_port = getattr(settings, 'EMAIL_PORT', None)
        logger.info(f"Configuration SMTP - Host: {smtp_host}, Port: {smtp_port}")

        # Envoyer l'email
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Résultat de l'envoi: {result}")
        return result > 0
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email à {consultant.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # Ne pas propager l'erreur pour éviter de bloquer l'inscription
        return False


def send_password_reset_email(user, reset_url):
    """
    Envoie un email de réinitialisation de mot de passe

    Args:
        user: L'instance du modèle User pour qui réinitialiser le mot de passe
        reset_url: L'URL de réinitialisation à inclure dans l'email
    """
    try:
        # Créer le sujet de l'email
        subject = 'Richat Partners - Réinitialisation de votre mot de passe'

        # Préparer le contexte pour le template
        from datetime import datetime
        context = {
            'user': user,
            'reset_url': reset_url,
            'valid_hours': 24,  # Durée de validité du lien en heures
            'now': {'year': datetime.now().year},  # Ajout de l'année pour le template
        }

        # Rendre le template HTML
        html_message = render_to_string('emails/password_reset.html', context)

        # Version texte de l'email
        plain_message = strip_tags(html_message)

        # Adresse email de l'expéditeur - Vérifier la configuration
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@richat-partners.com')

        # Adresse email du destinataire
        recipient_list = [user.email]

        # Journalisation des informations avant envoi
        logger.info(f"Tentative d'envoi d'email de réinitialisation à {user.email}")
        logger.info(f"URL de réinitialisation: {reset_url}")

        # Vérifier la configuration SMTP
        smtp_host = getattr(settings, 'EMAIL_HOST', None)
        smtp_port = getattr(settings, 'EMAIL_PORT', None)
        logger.info(f"Configuration SMTP - Host: {smtp_host}, Port: {smtp_port}")

        # Envoyer l'email
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Résultat de l'envoi de l'email de réinitialisation: {result}")
        return result > 0
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de réinitialisation à {user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # Nous retournons False plutôt que de propager l'erreur
        return False


def send_validation_email(consultant):
    """Envoie un email au consultant pour l'informer que son compte a été validé"""
    try:
        subject = "Compte validé - Plateforme RICHAT"
        message = f"""
        Bonjour {consultant.prenom} {consultant.nom},

        Nous avons le plaisir de vous informer que votre compte consultant sur la plateforme RICHAT a été validé par un administrateur.

        Vous pouvez désormais vous connecter à l'adresse suivante : http://localhost:3000/consultant/login

        Cordialement,
        L'équipe RICHAT
        """

        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [consultant.email]

        send_mail(subject, message, from_email, recipient_list)
        logger.info(f"Email de validation envoyé à {consultant.email}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de validation: {e}")
        return False


def send_matching_suggestion_email(consultant, appel_offre, score):
    """
    Envoie une notification par email à un consultant lorsqu'un matching adapté est trouvé
    """
    try:
        # Vérifier que le consultant a un email
        if not consultant.email:
            logger.error(f"Impossible d'envoyer la notification: pas d'email pour le consultant {consultant.id}")
            return False

        # Formater le score pour l'affichage
        score_formatted = round(float(score))

        # Préparer le sujet et le contenu de l'email
        subject = f"Nouvelle opportunité de mission compatible ({score_formatted}% de matching)"
        message = f"""
        Bonjour {consultant.prenom} {consultant.nom},

        Nous avons identifié une nouvelle mission qui correspond à votre profil à {score_formatted}%.

        Détails de la mission:
        - Projet: {appel_offre.nom_projet}
        - Client: {appel_offre.client}
        - Période: du {appel_offre.date_debut} au {appel_offre.date_fin}

        Vous pouvez consulter votre espace consultant pour plus de détails.
        Si cette mission vous intéresse, contactez-nous rapidement pour nous faire part de votre disponibilité.

        Cordialement,
        L'équipe Richat Partners
        """

        # Envoyer l'email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[consultant.email],
            fail_silently=False
        )

        logger.info(
            f"Notification de matching envoyée au consultant {consultant.id} ({consultant.email}) pour la mission {appel_offre.nom_projet}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de la notification de matching: {str(e)}")
        return False


def send_mission_notification(consultant, appel_offre):
    """
    Envoie une notification par email au consultant pour une mission validée
    """
    try:
        # Préparer les données du message
        subject = f"[RICHAT] Mission confirmée : {appel_offre.nom_projet}"
        
        message = f"""
        Bonjour {consultant.prenom} {consultant.nom},
        
        Félicitations ! Votre profil a été sélectionné pour la mission suivante :
        
        Mission : {appel_offre.nom_projet}
        Client : {appel_offre.client}
        Période : du {appel_offre.date_debut.strftime('%d/%m/%Y')} au {appel_offre.date_fin.strftime('%d/%m/%Y')}
        
        Description de la mission :
        {appel_offre.description}
        
        Consultez la plateforme pour plus de détails dans la section "Mes Missions".
        
        Cordialement,
        L'équipe RICHAT
        """
        
        # Envoyer l'email
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [consultant.email],
            fail_silently=False,
        )
        
        logger.info(f"Email de notification de mission envoyé à {consultant.email}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de notification de mission: {str(e)}")
        return False