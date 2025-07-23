import re
import time
import csv
import traceback
from bs4 import BeautifulSoup
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

class MarchesPublicsScraperFinal:
    def _init_(self):
        self.scraped_count = 0
        self.wardip_count = 0
        self.total_offers = 0

    def clean_text(self, text):
        if not text:
            return ""
        text = str(text)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[\n\r\t]+', ' ', text)
        text = text.replace('"', "'").replace('\n', ' ').replace('\r', ' ')
        return text.strip()

    def setup_chrome_driver(self):
        try:
            options = Options()
            options.add_argument("--start-maximized")
            options.add_argument("--disable-infobars")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-notifications")
            options.add_argument("--disable-popup-blocking")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            # Mettre en commentaire pour voir le navigateur
            options.add_argument("--headless")
            options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            driver.implicitly_wait(10)
            
            print("✅ Driver Chrome configuré avec succès")
            return driver
        except Exception as e:
            print(f"❌ Erreur configuration driver: {e}")
            raise

    def click_voir_plus_button(self, driver):
        """Cliquer sur le bouton 'Voir plus'"""
        try:
            # Sélecteurs pour le bouton "Voir plus"
            button_selectors = [
                "//button[.//span[contains(text(), 'Voir plus')]]",
                "//button[contains(., 'Voir plus')]",
                "//button[contains(@class, 'bg-white') and contains(@class, 'text-customGreen')]",
                "//div[contains(@class, 'justify-end')]//button",
                "//button[contains(text(), 'Voir plus')]"
            ]
            
            for selector in button_selectors:
                try:
                    buttons = driver.find_elements(By.XPATH, selector)
                    for button in buttons:
                        if button.is_displayed() and button.is_enabled():
                            button_text = button.text.strip()
                            if 'voir plus' in button_text.lower():
                                print(f"🎯 Clic sur: '{button_text}'")
                                
                                # Scroll vers le bouton
                                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", button)
                                time.sleep(1)
                                
                                # Cliquer
                                try:
                                    button.click()
                                    return True
                                except:
                                    driver.execute_script("arguments[0].click();", button)
                                    return True
                except Exception:
                    continue
            
            return False
            
        except Exception as e:
            print(f"❌ Erreur clic 'Voir plus': {e}")
            return False

    def load_all_offers(self, driver, max_attempts=100):
        """Charger toutes les offres disponibles"""
        print("\n🔄 Chargement de TOUTES les offres disponibles...")
        
        last_count = 0
        no_change_count = 0
        
        for attempt in range(1, max_attempts + 1):
            try:
                # Compter les offres actuelles
                offer_cards = driver.find_elements(By.CSS_SELECTOR, 
                    "div.w-full.bg-white.rounded-lg.shadow-lg")
                current_count = len(offer_cards)
                
                print(f"📊 Tentative {attempt}: {current_count} offres chargées")
                
                if current_count == last_count:
                    no_change_count += 1
                    if no_change_count >= 3:
                        print("🔍 Tentative de clic sur 'Voir plus'...")
                        
                        if self.click_voir_plus_button(driver):
                            time.sleep(5)  # Attendre le chargement
                            no_change_count = 0  # Reset
                        else:
                            print("⚠ Plus de bouton 'Voir plus' disponible")
                            break
                else:
                    no_change_count = 0
                    last_count = current_count
                    print(f"✅ +{current_count - last_count} nouvelles offres chargées")
                
                # Scroll pour s'assurer que tout est visible
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                # Arrêter si on a chargé beaucoup d'offres (sécurité)
                if current_count > 5000:
                    print(f"🛑 Limite de sécurité atteinte: {current_count} offres")
                    break
                
            except Exception as e:
                print(f"⚠ Erreur tentative {attempt}: {e}")
                time.sleep(2)
                continue
        
        final_offers = driver.find_elements(By.CSS_SELECTOR, 
            "div.w-full.bg-white.rounded-lg.shadow-lg")
        print(f"🎯 Chargement terminé: {len(final_offers)} offres au total")
        return len(final_offers)

    def extract_offer_data(self, offer_element):
        """Extraire les données d'une offre (méthode validée)"""
        try:
            element_html = offer_element.get_attribute('outerHTML')
            soup = BeautifulSoup(element_html, 'html.parser')
            
            data = {
                "titre": "N/A",
                "date_de_publication": "N/A", 
                "client": "N/A",
                "type_d_appel_d_offre": "N/A",
                "date_limite": "N/A",
                "documents": "N/A",
                "lien_site": "N/A",
                "statut": "N/A"
            }
            
            # Extraire le texte complet
            all_text = soup.get_text()
            clean_all_text = self.clean_text(all_text)
            
            # 1. Titre et lien
            title_selectors = ["h2 a", "h2.text-sm a", "a[href*='/marchespublics/']", ".line-clamp-2"]
            for selector in title_selectors:
                try:
                    title_elem = soup.select_one(selector)
                    if title_elem:
                        title_text = self.clean_text(title_elem.get_text())
                        if title_text and len(title_text) > 5:
                            data["titre"] = title_text
                            
                            # Récupérer le lien
                            if title_elem.name == 'a':
                                href = title_elem.get('href')
                            else:
                                link_parent = title_elem.find_parent('a')
                                href = link_parent.get('href') if link_parent else None
                            
                            if href:
                                if href.startswith('/'):
                                    data["lien_site"] = f"https://marchespublics.gov.mr{href}"
                                else:
                                    data["lien_site"] = href
                            break
                except Exception:
                    continue
            
            # 2. Client avec regex
            client_patterns = [
                r'Autorité contractante\s*:?\s*([^\n\r]+?)(?=Type|Date|$)',
                r'Autorité contractante\s*:?\s*(.+?)(?=\s+Type|\s+Date|\n|$)',
            ]
            
            for pattern in client_patterns:
                match = re.search(pattern, clean_all_text, re.IGNORECASE | re.DOTALL)
                if match:
                    client = self.clean_text(match.group(1))
                    if len(client) > 3 and len(client) < 200:
                        data["client"] = client
                        break
            
            # 3. Type de marché
            type_patterns = [
                r'Type de marché\s*:?\s*([^\n\r]+?)(?=Date|Appel|$)',
                r'Type de marché\s*:?\s*(.+?)(?=\s+Date|\s+Appel|\n|$)',
            ]
            
            for pattern in type_patterns:
                match = re.search(pattern, clean_all_text, re.IGNORECASE | re.DOTALL)
                if match:
                    market_type = self.clean_text(match.group(1))
                    if len(market_type) > 2 and len(market_type) < 100:
                        data["type_d_appel_d_offre"] = market_type
                        break
            
            # 4. Date de publication
            date_patterns = [
                r'Date de publication\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})'
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, clean_all_text, re.IGNORECASE)
                if match:
                    data["date_de_publication"] = match.group(1)
                    break
            
            # 5. Statut
            status_selectors = [
                "span.absolute.top-0.rounded-md",
                "span[class*='absolute'][class*='top-0']",
                "span[class*='bg-gray-100']"
            ]
            
            for selector in status_selectors:
                status_elem = soup.select_one(selector)
                if status_elem and status_elem.get_text().strip():
                    data["statut"] = self.clean_text(status_elem.get_text())
                    break
            
            # 6. Documents (type d'appel)
            appel_selectors = ["span.bg-green-50", "span[class*='bg-green']"]
            for selector in appel_selectors:
                appel_elem = soup.select_one(selector)
                if appel_elem and appel_elem.get_text().strip():
                    appel_text = self.clean_text(appel_elem.get_text())
                    if len(appel_text) > 5:
                        data["documents"] = appel_text
                        break
            
            return data
            
        except Exception as e:
            return None

    def is_wardip_client(self, client_text):
        """Vérifier si le client est WARDIP"""
        if not client_text or client_text == "N/A":
            return False
        
        client_lower = client_text.lower()
        wardip_variations = [
            'wardip',
            'ward ip',
            'programme régional d\'intégration numérique',
            'programme regional d integration numerique',
            'west africa regional digital integration',
            'intégration numérique en afrique de l\'ouest',
            'wardip',
            'digital integration'
        ]
        
        return any(variation in client_lower for variation in wardip_variations)

    def scrape_all_and_filter_wardip(self):
        """Fonction principale - scraper tout et filtrer WARDIP"""
        print("🚀 SCRAPING COMPLET - Filtrage WARDIP")
        print("🎯 Objectif: Récupérer TOUTES les offres et identifier WARDIP\n")
        
        # Créer les dossiers
        output_dir = Path.cwd() / 'scraped_data'
        output_dir.mkdir(exist_ok=True)
        
        ALL_OFFERS_FILE = output_dir / 'toutes_les_offres_completes.csv'
        WARDIP_FILE = output_dir / 'offres_wardip_filtrees.csv'

        driver = None
        
        try:
            driver = self.setup_chrome_driver()
            
            # Headers CSV
            headers = [
                "titre", "date_de_publication", "client", "type_d_appel_d_offre",
                "date_limite", "documents", "lien_site", "statut"
            ]
            
            # Ouvrir les fichiers CSV
            all_offers_file = open(ALL_OFFERS_FILE, 'w', newline='', encoding='utf-8-sig')
            wardip_file = open(WARDIP_FILE, 'w', newline='', encoding='utf-8-sig')
            
            all_writer = csv.DictWriter(all_offers_file, fieldnames=headers)
            wardip_writer = csv.DictWriter(wardip_file, fieldnames=headers)
            
            all_writer.writeheader()
            wardip_writer.writeheader()
            
            print(f"📄 Fichiers CSV créés:")
            print(f"   - Toutes les offres: {ALL_OFFERS_FILE}")
            print(f"   - Offres WARDIP: {WARDIP_FILE}")

            # Accès au site
            url = "https://marchespublics.gov.mr/marchespublics"
            print(f"🌐 Connexion à {url}...")
            
            driver.get(url)
            print("✅ Page chargée avec succès")
            time.sleep(5)
            
            # Charger TOUTES les offres
            total_loaded = self.load_all_offers(driver)
            
            if total_loaded == 0:
                print("❌ Aucune offre trouvée")
                return
            
            # Extraire toutes les offres
            print(f"📊 Extraction de {total_loaded} offres...")
            offer_cards = driver.find_elements(By.CSS_SELECTOR, 
                "div.w-full.bg-white.rounded-lg.shadow-lg")
            
            print(f"🔍 {len(offer_cards)} cartes d'offres trouvées pour traitement")
            
            for i, offer_card in enumerate(offer_cards, 1):
                try:
                    data = self.extract_offer_data(offer_card)
                    
                    if data and (data["titre"] != "N/A" or data["client"] != "N/A"):
                        # Sauvegarder toutes les offres
                        all_writer.writerow(data)
                        all_offers_file.flush()
                        self.total_offers += 1
                        
                        # Vérifier si c'est WARDIP
                        if self.is_wardip_client(data["client"]):
                            wardip_writer.writerow(data)
                            wardip_file.flush()
                            self.wardip_count += 1
                            
                            print(f"\n🎯 WARDIP TROUVÉ #{self.wardip_count}:")
                            print(f"   📋 {data['titre'][:80]}...")
                            print(f"   🏢 {data['client']}")
                            print(f"   🏷 {data['type_d_appel_d_offre']}")
                            print(f"   📅 {data['date_de_publication']}")
                            print(f"   📊 {data['statut']}")
                            print(f"   🔗 {data['lien_site']}")
                        
                        # Progression
                        if self.total_offers % 100 == 0:
                            print(f"📊 Progression: {self.total_offers}/{len(offer_cards)} offres traitées - {self.wardip_count} WARDIP trouvées")
                
                except Exception as e:
                    continue
            
            # Fermer les fichiers
            all_offers_file.close()
            wardip_file.close()
            
            print(f"\n🎉 SCRAPING TERMINÉ AVEC SUCCÈS!")
            print(f"" + "="*60)
            print(f"📊 STATISTIQUES FINALES:")
            print(f"   ✅ Total offres récupérées: {self.total_offers}")
            print(f"   🎯 Offres WARDIP trouvées: {self.wardip_count}")
            if self.total_offers > 0:
                print(f"   📈 Taux WARDIP: {(self.wardip_count/self.total_offers*100):.2f}%")
            print(f"" + "="*60)
            print(f"📁 FICHIERS GÉNÉRÉS:")
            print(f"   📄 {ALL_OFFERS_FILE} ({self.total_offers} offres)")
            print(f"   🎯 {WARDIP_FILE} ({self.wardip_count} offres WARDIP)")
            print(f"" + "="*60)
            
            if self.wardip_count > 0:
                print(f"🎉 FÉLICITATIONS! {self.wardip_count} offres WARDIP ont été trouvées!")
            else:
                print(f"ℹ Aucune offre WARDIP trouvée dans les {self.total_offers} offres analysées.")
            
        except Exception as e:
            print(f"❌ Erreur globale: {e}")
            traceback.print_exc()
        finally:
            try:
                if 'all_offers_file' in locals():
                    all_offers_file.close()
                if 'wardip_file' in locals():
                    wardip_file.close()
            except:
                pass
            
            if driver:
                driver.quit()
                print("🔒 Driver fermé proprement")

def main():
    """Fonction principale"""
    scraper = MarchesPublicsScraperFinal()
    scraper.scrape_all_and_filter_wardip()

# ... [le reste du code] ...

if __name__ == "__main__":
    main()