
import requests
import os
from django.conf import settings


class KDriveClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or settings.KDRIVE_API_KEY
        self.base_url = "https://api.infomaniak.com/2/drive"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }

    def upload_file(self, file, filename, folder_id=None):
        """
        Upload un fichier sur kDrive
        """
        # Si folder_id n'est pas spécifié, utiliser le dossier par défaut
        folder_id = folder_id or settings.KDRIVE_DEFAULT_FOLDER_ID

        url = f"{self.base_url}/folders/{folder_id}/files"
        files = {'file': (filename, file)}

        response = requests.post(url, headers=self.headers, files=files)

        if response.status_code in (200, 201):
            data = response.json()
            return {
                'id': data.get('id'),
                'url': data.get('direct_download_url'),
                'name': data.get('name')
            }
        else:
            raise Exception(f"Error uploading file: {response.text}")

    def get_file(self, file_id):
        """
        Récupère les informations d'un fichier
        """
        url = f"{self.base_url}/files/{file_id}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error getting file: {response.text}")

    def delete_file(self, file_id):
        """
        Supprime un fichier
        """
        url = f"{self.base_url}/files/{file_id}"
        response = requests.delete(url, headers=self.headers)

        if response.status_code != 204:
            raise Exception(f"Error deleting file: {response.text}")

        return True