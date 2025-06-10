# Fichier competences_data.py
# Liste des compétences par domaine pour le système de matching

DIGITAL_TELECOM_SKILLS = [
    # Développement web & mobile
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express',
    'Django', 'Flask', 'Ruby on Rails', 'PHP', 'Laravel', 'WordPress', 'Drupal', 'ASP.NET',
    'Java EE', 'Spring Boot', 'React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin',
    'Progressive Web Apps', 'Single Page Applications', 'API REST', 'GraphQL', 'WebSockets',
      "React Native", "Vue.js", "Angular", "Node.js", "Express",
    "Django", "Flask", "Kubernetes", "Docker", "CI/CD",
    "AWS", "Azure", "Google Cloud", "DevOps", "MLOps",
    "TensorFlow", "PyTorch", "SQL", "NoSQL", "MongoDB",
    "GraphQL", "REST API", "Microservices", "Agile", "Scrum",
    "5G", "IoT", "Réseau", "Télécommunications", "Cybersécurité",
    "Blockchain", "Data Science", "Big Data", "Hadoop", "Spark"
       # Exemple d'ajout pour le domaine DIGITAL

    # Compétences existantes
    "Java", "Python",
    # Nouvelles compétences plus précises
   

    'SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'SQLite', 'MongoDB', 'Redis', 'Cassandra',
    'Elasticsearch', 'DynamoDB', 'Firebase', 'Neo4j', 'MariaDB', 'SQL Server',

    # DevOps & Cloud
    'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Travis CI', 'CircleCI',
    'AWS', 'Azure', 'Google Cloud', 'Heroku', 'DigitalOcean', 'Terraform', 'Ansible',
    'Puppet', 'Chef', 'Prometheus', 'Grafana', 'ELK Stack', 'Serverless', 'Microservices',
    'CI/CD', 'Infrastructure as Code',

    # Design & UX
    'UI Design', 'UX Design', 'Responsive Design', 'Mobile First', 'Wireframing', 'Mockups',
    'Prototyping', 'User Testing', 'A/B Testing', 'Figma', 'Sketch', 'Adobe XD', 'InVision',

    # Data & IA
    'Data Science', 'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'NLP',
    'Computer Vision', 'Big Data', 'Hadoop', 'Spark', 'TensorFlow', 'PyTorch', 'Keras',
    'Scikit-learn', 'Pandas', 'NumPy', 'R', 'Data Mining', 'Predictive Analytics',
    'Business Intelligence', 'Tableau', 'Power BI', 'Data Visualization',

    # Télécoms & Réseaux
    'Réseaux Télécoms', '5G', '4G', 'LTE', 'Fibre Optique', 'ADSL', 'FTTH', 'MPLS',
    'Réseaux IP', 'TCP/IP', 'BGP', 'OSPF', 'VLAN', 'SDN', 'SD-WAN', 'VoIP', 'SIP',
    'Architectures Réseau', 'Wi-Fi', 'Bluetooth', 'LoRaWAN', 'Zigbee', 'RFID', 'NFC',
    'Routeurs', 'Commutateurs', 'Cisco', 'Juniper', 'Huawei', 'Ubiquiti',

    # Cybersécurité
    'Cybersécurité', 'Sécurité Informatique', 'Sécurité Réseau', 'Sécurité Web',
    'Sécurité Cloud', 'Cryptographie', 'VPN', 'Firewall', 'WAF', 'SIEM', 'SOC',
    'Pentest', 'Test d\'Intrusion', 'Analyse de Vulnérabilités', 'Gestion des Identités',
    'Authentification', 'SSO', 'MFA', 'OAuth', 'SAML', 'PKI', 'ISO 27001', 'GDPR', 'RGPD',

    # Management IT
    'Gestion de Projet IT', 'ITIL', 'COBIT', 'Scrum', 'Agile', 'Kanban', 'Lean IT',
    'DevSecOps', 'SRE', 'Gestion des Services IT', 'Gouvernance IT', 'Audit IT',
    'Plan de Reprise d\'Activité', 'Continuité d\'Activité', 'Gestion des Risques IT',

    # Stratégie & Innovation
    'Transformation Digitale', 'Stratégie Digitale', 'E-commerce', 'Marketing Digital',
    'Innovation Technologique', 'Blockchain', 'IoT', 'Internet des Objets', 'Smart City',
    'Digital Workplace', 'Industry 4.0', 'Intelligence Artificielle Appliquée'
]

FINANCE_BANKING_SKILLS = [
    # Banque & Finance générale
    'Finance', 'Banque', 'Comptabilité', 'Audit Financier', 'Contrôle de Gestion',
    'Analyse Financière', 'Reporting Financier', 'IFRS', 'US GAAP', 'Consolidation',
    'Fiscalité', 'Trésorerie', 'Cash Management', 'KYC', 'AML', 'Conformité Bancaire',

    # Banque d'investissement & Marchés
    'Banque d\'Investissement', 'Marchés Financiers', 'Trading', 'Sales', 'Structuration',
    'Produits Dérivés', 'Fixed Income', 'Equity', 'Forex', 'Commodities', 'Obligations',
    'Actions', 'ETF', 'Warrants', 'Options', 'Futures', 'Swaps', 'Repo', 'Prime Brokerage',
    'Investment Banking', 'ECM', 'DCM', 'M&A', 'IPO', 'LBO', 'Private Equity',

    # Banque de détail & Services
    'Banque de Détail', 'Banque Privée', 'Gestion de Patrimoine', 'Wealth Management',
    'Private Banking', 'Asset Management', 'Gestion d\'Actifs', 'Gestion de Portefeuille',
    'Banque en Ligne', 'Mobile Banking', 'Credit Scoring', 'Crédit à la Consommation',
    'Crédit Immobilier', 'Affacturage', 'Leasing', 'Microcrédit', 'Microfinance',

    # Assurance
    'Assurance', 'Assurance Vie', 'Assurance Non-Vie', 'Assurance Auto', 'Assurance Habitation',
    'Assurance Santé', 'Prévoyance', 'Réassurance', 'Actuariat', 'Souscription', 'Claims',
    'Indemnisation', 'Tarification', 'Insurance', 'Life Insurance', 'P&C Insurance',

    # Risques & Régulation
    'Gestion des Risques', 'Risk Management', 'Risque de Crédit', 'Risque de Marché',
    'Risque Opérationnel', 'Risque de Liquidité', 'Bâle III', 'Solvabilité II', 'MIFID II',
    'Stress Test', 'VaR', 'Expected Shortfall', 'ALM', 'Asset Liability Management',
    'Surveillance Prudentielle', 'Régulation Bancaire', 'Supervision Bancaire',

    # Fintech & Innovation financière
    'Fintech', 'Blockchain', 'Crypto-monnaie', 'Bitcoin', 'Ethereum', 'Smart Contracts',
    'Tokenisation', 'Stablecoins', 'DeFi', 'Finance Décentralisée', 'Open Banking', 'PSD2',
    'Paiement Mobile', 'E-paiement', 'Wallets Electroniques', 'Instant Payment', 'SEPA',
    'SWIFT', 'API Bancaires', 'Robo-Advisors', 'Crowdfunding', 'Crowdlending', 'P2P Lending',

    # Inclusion financière & Finance durable
    'Inclusion Financière', 'Finance Inclusive', 'Finance Durable', 'ESG',
    'Investissement Responsable', 'ISR', 'Green Bonds', 'Climate Finance',
    'Finance Islamique', 'Sukuk', 'Microfinance', 'Éducation Financière',
    'Bancarisation', 'Financial Inclusion', 'Mobile Money', 'Transfer d\'Argent',

    # Économie & Politique monétaire
    'Macroéconomie', 'Politique Monétaire', 'Banque Centrale', 'Taux Directeurs',
    'Inflation', 'Déflation', 'PIB', 'Balance des Paiements', 'Zone Euro', 'Zone CFA',
    'Stabilité Financière', 'Analyse Économique', 'Conjoncture Économique'
]

ENERGY_TRANSITION_SKILLS = [
    # Pétrole & Gaz
    'Pétrole', 'Gaz Naturel', 'Hydrocarbures', 'Exploration Pétrolière', 'Production Pétrolière',
    'Forage', 'Offshore', 'Onshore', 'Sismique', 'Géologie Pétrolière', 'Réservoir',
    'Transport d\'Hydrocarbures', 'Pipelines', 'GNL', 'Gaz Naturel Liquéfié', 'Raffinage',
    'Pétrochimie', 'Distribution Pétrolière', 'Stations-Service', 'Trading Pétrole',
    'Stockage Hydrocarbures', 'Downstream', 'Midstream', 'Upstream', 'FPSO',

    # Électricité & Réseaux
    'Électricité', 'Production d\'Électricité', 'Transport d\'Électricité', 'Distribution Électrique',
    'Réseaux Électriques', 'Lignes Haute Tension', 'Postes de Transformation', 'Smart Grid',
    'Réseaux Intelligents', 'Microgrids', 'Dispatch', 'Gestion de Réseau', 'Équilibrage',
    'Interconnexions', 'Marché de l\'Électricité', 'Trading Électricité', 'Utilities',

    # Énergies Renouvelables
    'Énergies Renouvelables', 'Énergie Solaire', 'Photovoltaïque', 'PV', 'Solaire Thermique',
    'CSP', 'Énergie Éolienne', 'Éolien Terrestre', 'Éolien Offshore', 'Hydroélectricité',
    'Barrages Hydroélectriques', 'Biomasse', 'Bioénergie', 'Biogaz', 'Géothermie',
    'Énergies Marines', 'Hydrolien', 'Houlomoteur', 'Marémoteur', 'Tidal Energy',

    # Transition Énergétique
    'Transition Énergétique', 'Décarbonation', 'Neutralité Carbone', 'Net Zero',
    'Mix Énergétique', 'Efficacité Énergétique', 'Sobriété Énergétique', 'Performance Énergétique',
    'Audit Énergétique', 'CPE', 'Contrat Performance Énergétique', 'Bâtiments Basse Consommation',
    'BEPOS', 'Rénovation Énergétique', 'Économies d\'Énergie',

    # Hydrogène & Nouveaux Vecteurs
    'Hydrogène', 'Hydrogène Vert', 'Hydrogène Bleu', 'Électrolyse', 'Piles à Combustible',
    'Power-to-Gas', 'Power-to-X', 'Méthanation', 'Ammoniac', 'Méthanol', 'Stockage d\'Énergie',
    'Batteries', 'BESS', 'Lithium-ion', 'STEP', 'Air Comprimé', 'CAES',

    # Mobilité Durable
    'Mobilité Électrique', 'Véhicules Électriques', 'EV', 'Bornes de Recharge', 'Recharge Rapide',
    'V2G', 'Vehicle-to-Grid', 'Biofuels', 'Biocarburants', 'Biodiesel', 'Bioéthanol',
    'GNV', 'Gaz Naturel Véhicule', 'BioGNV', 'Hydrogène Mobilité', 'FCEV',

    # Carbone & Environnement
    'Marché Carbone', 'ETS', 'Quotas Carbone', 'Crédits Carbone', 'Compensation Carbone',
    'Capture Carbone', 'CCS', 'CCUS', 'Empreinte Carbone', 'Bilan Carbone', 'GES',
    'Gaz à Effet de Serre', 'CO2', 'Méthane', 'Pollution Atmosphérique', 'Qualité de l\'Air',

    # Politique & Régulation Énergétique
    'Politique Énergétique', 'Régulation Énergétique', 'Tarifs Réglementés', 'Subventions',
    'Feed-in Tariff', 'CRE', 'Autorités de Régulation', 'Accords de Paris', 'COP21',
    'GIEC', 'IPCC', 'Taxonomie Verte', 'ESG', 'Finance Verte', 'Green Bonds',

    # Management & Stratégie Énergie
    'Stratégie Énergétique', 'Management de l\'Énergie', 'ISO 50001', 'Gestion Énergétique',
    'Plans Climat', 'PCAET', 'Conseil Énergie', 'Due Diligence Énergétique',
    'Développement Projets Énergétiques', 'O&M', 'Exploitation Maintenance',
    'Asset Management Énergie', 'Trading Énergie'
]

INDUSTRY_MINING_SKILLS = [
    # Mines & Géologie
    'Exploitation Minière', 'Mine à Ciel Ouvert', 'Mine Souterraine', 'Géologie Minière',
    'Prospection Minière', 'Exploration Minière', 'Forage Minier', 'Échantillonnage',
    'Modélisation Géologique', 'Estimation de Ressources', 'Classification des Réserves',
    'JORC', 'NI 43-101', 'Métaux Précieux', 'Métaux de Base', 'Or', 'Argent', 'Cuivre',
    'Fer', 'Bauxite', 'Zinc', 'Nickel', 'Cobalt', 'Lithium', 'Terres Rares', 'Uranium',
    'Diamants', 'Charbon', 'Phosphate',

    # Extraction & Traitement
    'Extraction Minière', 'Dynamitage', 'Abattage', 'Chargement', 'Transport Minier',
    'Concassage', 'Broyage', 'Concentration', 'Flottation', 'Lixiviation', 'Cyanuration',
    'Métallurgie Extractive', 'Hydrométallurgie', 'Pyrométallurgie', 'Électrométallurgie',
    'Traitement des Minerais', 'Enrichissement', 'Séparation', 'Filtration', 'Fonderie',
    'Affinage', 'Traitement des Rejets', 'Gestion des Stériles', 'Remblayage',

    # Industrie Lourde
    'Sidérurgie', 'Métallurgie', 'Aluminium', 'Aciérie', 'Fonderie', 'Forge', 'Laminage',
    'Extrusion', 'Moulage', 'Usinage', 'Fabrication Métallique', 'Soudage', 'Chaudronnerie',
    'Construction Navale', 'Construction Ferroviaire', 'Industrie Lourde', 'Machinerie',
    'Équipements Industriels', 'Turbines', 'Moteurs', 'Compresseurs', 'Pompes',

    # Manufacturing & Production
    'Production Industrielle', 'Manufacturing', 'Industrie 4.0', 'Usine Intelligente',
    'IoT Industriel', 'IIoT', 'Automatisation Industrielle', 'Robotique Industrielle',
    'Systèmes de Production', 'Ligne de Production', 'Assemblage', 'Fabrication',
    'Just-in-Time', 'Lean Manufacturing', 'Six Sigma', 'TQM', 'Qualité Industrielle',
    'Contrôle Qualité', 'Assurance Qualité', 'Maintenance Industrielle',
    'Maintenance Prédictive', 'GMAO',

    # Chimie & Matériaux
    'Industrie Chimique', 'Chimie Industrielle', 'Pétrochimie', 'Formulation',
    'Polymères', 'Plastiques', 'Élastomères', 'Composites', 'Céramiques',
    'Matériaux Avancés', 'Nanomatériaux', 'Revêtements', 'Adhésifs', 'Peintures',
    'Engrais', 'Agrochimie', 'Pharmaceutique',

    # Énergie & Utilités Industrielles
    'Énergie Industrielle', 'Vapeur Industrielle', 'Air Comprimé', 'Froid Industriel',
    'Eau Industrielle', 'Traitement des Eaux', 'Effluents Industriels', 'Gaz Industriels',
    'Cogénération', 'Récupération Chaleur', 'Isolation Industrielle', 'Efficacité Énergétique',

    # Environnement & Durabilité Industrielle
    'Environnement Industriel', 'Pollution Industrielle', 'Traitement des Émissions',
    'Dépollution', 'Réhabilitation de Sites', 'Fermeture de Mine', 'Mine Responsable',
    'Économie Circulaire', 'Recyclage', 'Valorisation Déchets', 'Sous-produits',
    'Mining ESG', 'RSE Industrielle', 'Écologie Industrielle',

    # Ingénierie & Conception
    'Ingénierie Industrielle', 'Conception Industrielle', 'Design Industriel',
    'CAO', 'FAO', 'Maquette Numérique', 'BIM', 'Simulation Industrielle',
    'Prototypage', 'Études Techniques', 'Dimensionnement', 'Plans Industriels',
    'Schémas P&ID', 'Génie Civil Industriel', 'Construction Industrielle',

    # Management & Stratégie Industrielle
    'Stratégie Industrielle', 'Direction Industrielle', 'Optimisation Industrielle',
    'Amélioration Continue', 'Productivité', 'Performance Industrielle', 'KPI Industriels',
    'Gestion de Production', 'Planification Industrielle', 'MRP', 'ERP Industriel',
    'Supply Chain Industrielle', 'Logistique Industrielle', 'Achats Industriels',

    # Réglementation & Sécurité
    'Réglementation Minière', 'Code Minier', 'Permis d\'Exploitation', 'Licences Minières',
    'Réglementation ICPE', 'Réglementation SEVESO', 'HAZOP', 'Sécurité Industrielle',
    'QHSE', 'Sécurité des Procédés', 'Prévention des Risques', 'Gestion des Risques',
    'Plans d\'Urgence', 'Hygiène Industrielle', 'Santé au Travail'
]

# Dictionnaire contenant toutes les compétences par domaine
ALL_SKILLS = {
    'DIGITAL': DIGITAL_TELECOM_SKILLS,
    'FINANCE': FINANCE_BANKING_SKILLS,
    'ENERGIE': ENERGY_TRANSITION_SKILLS,
    'INDUSTRIE': INDUSTRY_MINING_SKILLS
}