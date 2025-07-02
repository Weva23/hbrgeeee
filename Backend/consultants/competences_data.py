# competences_data_fixed.py - BASE DE COMPÉTENCES ENRICHIE POUR CONSULTANTS
# Version corrigée et complètement enrichie pour extraction intelligente

# ==========================================
# DIGITAL & TÉLÉCOMMUNICATIONS - ENRICHI
# ==========================================

DIGITAL_TELECOM_SKILLS = [
    # === DÉVELOPPEMENT WEB & MOBILE ===
    
    # Langages fondamentaux
    'HTML', 'HTML5', 'CSS', 'CSS3', 'JavaScript', 'TypeScript', 'ECMAScript',
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'Dart',
    
    # Langages backend
    'Python', 'Java', 'C++', 'C#', 'C', 'ASP.NET', '.NET Core', '.NET Framework',
    'Node.js', 'Deno', 'Express.js', 'Fastify', 'Koa.js',
    
    # Frameworks frontend
    'React', 'React.js', 'ReactJS', 'Angular', 'AngularJS', 'Vue.js', 'Vue', 'VueJS',
    'Svelte', 'SvelteKit', 'Next.js', 'Nuxt.js', 'Gatsby', 'Ember.js',
    'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design', 'Chakra UI',
    
    # Frameworks backend
    'Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado',
    'Spring Boot', 'Spring Framework', 'Spring MVC', 'Hibernate',
    'Laravel', 'Symfony', 'CodeIgniter', 'CakePHP',
    'Ruby on Rails', 'Sinatra',
    'ASP.NET MVC', 'ASP.NET Web API',
    
    # Mobile
    'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Cordova', 'PhoneGap',
    'Swift', 'Objective-C', 'Kotlin', 'Java Android', 'Android SDK',
    'iOS Development', 'Android Development',
    
    # === BASES DE DONNÉES ===
    
    # Relationnelles
    'SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'Oracle Database', 'SQL Server', 'Microsoft SQL Server',
    'SQLite', 'MariaDB', 'DB2', 'Sybase', 'Firebird',
    
    # NoSQL
    'MongoDB', 'Redis', 'Cassandra', 'CouchDB', 'Neo4j', 'ArangoDB',
    'Elasticsearch', 'Solr', 'DynamoDB', 'Firebase Firestore',
    
    # Data warehousing
    'Data Warehouse', 'OLAP', 'OLTP', 'ETL', 'Data Modeling',
    'Amazon Redshift', 'Google BigQuery', 'Snowflake',
    
    # === CLOUD & DEVOPS ===
    
    # Cloud platforms
    'AWS', 'Amazon Web Services', 'Azure', 'Microsoft Azure', 'Google Cloud Platform', 'GCP',
    'Digital Ocean', 'Heroku', 'Linode', 'Vultr', 'OVH Cloud',
    
    # Services AWS
    'EC2', 'S3', 'RDS', 'Lambda', 'CloudFormation', 'EKS', 'ECS', 'API Gateway',
    'CloudWatch', 'IAM', 'VPC', 'Route 53', 'CloudFront', 'SQS', 'SNS',
    
    # Services Azure
    'Azure VM', 'Azure Storage', 'Azure SQL', 'Azure Functions', 'Azure DevOps',
    'Azure Kubernetes Service', 'Azure Container Instances',
    
    # Services GCP
    'Compute Engine', 'Cloud Storage', 'Cloud SQL', 'Cloud Functions', 'GKE',
    'BigQuery', 'Cloud Pub/Sub', 'Cloud Build',
    
    # Conteneurisation
    'Docker', 'Kubernetes', 'Podman', 'Containerd', 'Docker Compose',
    'Kubernetes Operators', 'Helm', 'Istio', 'Envoy',
    
    # CI/CD
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'Azure DevOps', 'Travis CI',
    'CircleCI', 'Bamboo', 'TeamCity', 'ArgoCD', 'Tekton',
    
    # Infrastructure as Code
    'Terraform', 'Ansible', 'Puppet', 'Chef', 'CloudFormation',
    'ARM Templates', 'Pulumi', 'Vagrant',
    
    # Monitoring & Observability
    'Prometheus', 'Grafana', 'ELK Stack', 'Kibana', 'Logstash',
    'Jaeger', 'Zipkin', 'New Relic', 'DataDog', 'Splunk',
    
    # === DATA SCIENCE & IA ===
    
    # Machine Learning
    'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'AI',
    'Neural Networks', 'Computer Vision', 'Natural Language Processing', 'NLP',
    'Reinforcement Learning', 'Supervised Learning', 'Unsupervised Learning',
    
    # Frameworks ML/AI
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'XGBoost', 'LightGBM',
    'OpenCV', 'NLTK', 'spaCy', 'Transformers', 'Hugging Face',
    
    # Data Science
    'Data Science', 'Data Analysis', 'Data Mining', 'Statistical Analysis',
    'Predictive Analytics', 'Business Intelligence', 'Data Visualization',
    
    # Outils Data
    'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Tableau',
    'Power BI', 'Jupyter', 'R', 'RStudio', 'MATLAB', 'Octave',
    
    # Big Data
    'Big Data', 'Hadoop', 'Spark', 'Apache Kafka', 'Apache Storm',
    'Apache Flink', 'Hive', 'Pig', 'HBase', 'HDFS',
    
    # === CYBERSÉCURITÉ ===
    
    # Sécurité générale
    'Cybersécurité', 'Sécurité informatique', 'Information Security', 'InfoSec',
    'Sécurité des systèmes', 'Sécurité réseau', 'Sécurité web', 'Sécurité cloud',
    
    # Outils sécurité
    'Firewall', 'IDS', 'IPS', 'SIEM', 'SOC', 'WAF', 'DLP',
    'Antivirus', 'EDR', 'XDR', 'SOAR',
    
    # Tests sécurité
    'Penetration Testing', 'Pentest', 'Vulnerability Assessment', 'Ethical Hacking',
    'Bug Bounty', 'Security Audit', 'Code Review',
    
    # Cryptographie
    'Cryptographie', 'PKI', 'SSL/TLS', 'VPN', 'Encryption', 'Digital Certificates',
    'Hash Functions', 'Digital Signatures',
    
    # Conformité
    'ISO 27001', 'ISO 27002', 'NIST', 'GDPR', 'RGPD', 'PCI DSS',
    'SOX', 'HIPAA', 'Compliance', 'Risk Management',
    
    # === TÉLÉCOMMUNICATIONS ===
    
    # Réseaux
    'Réseaux informatiques', 'TCP/IP', 'OSI Model', 'Network Protocols',
    'Routing', 'Switching', 'VLAN', 'VPN', 'MPLS', 'BGP', 'OSPF',
    
    # Technologies télécom
    '5G', '4G', 'LTE', '3G', 'GSM', 'UMTS', 'CDMA', 'WiMAX',
    'VoIP', 'SIP', 'RTP', 'Asterisk', 'FreePBX',
    
    # Infrastructure télécom
    'Fibre optique', 'ADSL', 'VDSL', 'FTTH', 'Cable', 'Satellite',
    'Antennes', 'BTS', 'NodeB', 'eNodeB', 'gNodeB',
    
    # Équipements réseau
    'Cisco', 'Juniper', 'Huawei', 'Nokia', 'Ericsson', 'Alcatel-Lucent',
    'Routeurs', 'Commutateurs', 'Switches', 'Routers',
    
    # Sans fil
    'Wi-Fi', 'Bluetooth', 'Zigbee', 'LoRaWAN', 'NFC', 'RFID',
    '802.11', 'WPA', 'WEP', 'Wireless Security',
    
    # === MÉTHODES & GESTION ===
    
    # Méthodologies
    'Agile', 'Scrum', 'Kanban', 'Lean', 'Six Sigma', 'DevOps', 'GitOps',
    'ITIL', 'COBIT', 'PRINCE2', 'PMI', 'PMP',
    
    # Développement
    'TDD', 'BDD', 'DDD', 'Clean Code', 'SOLID', 'Design Patterns',
    'Microservices', 'API Design', 'RESTful APIs', 'GraphQL',
    
    # Gestion projet
    'Project Management', 'Gestion de projet', 'Planning', 'Estimation',
    'Risk Management', 'Change Management', 'Quality Assurance',
    
    # === SYSTÈMES & OS ===
    
    # Systèmes d'exploitation
    'Linux', 'Ubuntu', 'CentOS', 'Red Hat', 'RHEL', 'Debian', 'SUSE',
    'Windows Server', 'Windows', 'macOS', 'Unix', 'AIX', 'Solaris',
    
    # Administration système
    'System Administration', 'Server Management', 'Active Directory',
    'LDAP', 'DNS', 'DHCP', 'Backup', 'Disaster Recovery',
    
    # Virtualisation
    'VMware', 'VirtualBox', 'Hyper-V', 'KVM', 'Xen', 'Proxmox',
    'vSphere', 'vCenter', 'ESXi',
    
    # === OUTILS DE DÉVELOPPEMENT ===
    
    # Version control
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
    'Git Flow', 'GitHub Flow', 'Pull Requests', 'Code Review',
    
    # IDE & Éditeurs
    'Visual Studio Code', 'IntelliJ IDEA', 'Eclipse', 'Visual Studio',
    'PyCharm', 'WebStorm', 'Sublime Text', 'Atom', 'Vim', 'Emacs',
    
    # Testing
    'Unit Testing', 'Integration Testing', 'End-to-End Testing',
    'Jest', 'Mocha', 'Jasmine', 'Selenium', 'Cypress', 'Playwright',
    'JUnit', 'TestNG', 'pytest', 'RSpec',
    
    # === BLOCKCHAIN & ÉMERGENT ===
    
    # Blockchain
    'Blockchain', 'Bitcoin', 'Ethereum', 'Smart Contracts', 'DeFi',
    'Cryptocurrency', 'Web3', 'NFT', 'Solidity', 'Truffle', 'Hardhat',
    
    # IoT
    'Internet of Things', 'IoT', 'Embedded Systems', 'Arduino', 'Raspberry Pi',
    'Sensors', 'MQTT', 'CoAP', 'Edge Computing',
    
    # Réalité virtuelle/augmentée
    'Virtual Reality', 'VR', 'Augmented Reality', 'AR', 'Mixed Reality',
    'Unity', 'Unreal Engine', 'WebXR'
]

# ==========================================
# FINANCE & BANQUE - ENRICHI
# ==========================================

FINANCE_BANKING_SKILLS = [
    # === FINANCE GÉNÉRALE ===
    
    # Fondamentaux
    'Finance', 'Banque', 'Banking', 'Financial Services', 'Finance d\'entreprise',
    'Corporate Finance', 'Personal Finance', 'Public Finance',
    
    # Comptabilité
    'Comptabilité', 'Accounting', 'Comptabilité générale', 'Comptabilité analytique',
    'Comptabilité de gestion', 'Cost Accounting', 'Management Accounting',
    
    # Analyse financière
    'Analyse financière', 'Financial Analysis', 'Analyse de crédit', 'Credit Analysis',
    'Évaluation d\'entreprise', 'Valuation', 'Due Diligence', 'Financial Modeling',
    
    # Reporting
    'Reporting financier', 'Financial Reporting', 'Consolidation', 'Consolidation comptable',
    'États financiers', 'Financial Statements', 'Bilan', 'Balance Sheet',
    'Compte de résultat', 'Income Statement', 'Tableau de flux', 'Cash Flow Statement',
    
    # === NORMES COMPTABLES ===
    
    # Normes internationales
    'IFRS', 'IAS', 'International Financial Reporting Standards',
    'US GAAP', 'Generally Accepted Accounting Principles',
    'OHADA', 'Plan Comptable OHADA', 'Syscohada',
    
    # Normes françaises
    'PCG', 'Plan Comptable Général', 'Normes françaises',
    'ANC', 'Autorité des Normes Comptables',
    
    # === CONTRÔLE & AUDIT ===
    
    # Audit
    'Audit', 'Audit financier', 'Financial Audit', 'Audit interne', 'Internal Audit',
    'Audit externe', 'External Audit', 'Audit opérationnel', 'Operational Audit',
    'Audit des systèmes d\'information', 'IT Audit',
    
    # Contrôle de gestion
    'Contrôle de gestion', 'Management Control', 'Controlling',
    'Tableaux de bord', 'Dashboards', 'KPI', 'Indicateurs de performance',
    'Budget', 'Budgeting', 'Prévisions', 'Forecasting',
    'Variance Analysis', 'Écarts budgétaires',
    
    # Contrôle interne
    'Contrôle interne', 'Internal Control', 'SOX', 'Sarbanes-Oxley',
    'COSO', 'Risk Assessment', 'Control Framework',
    
    # === GESTION DES RISQUES ===
    
    # Risk Management
    'Gestion des risques', 'Risk Management', 'Risque de crédit', 'Credit Risk',
    'Risque de marché', 'Market Risk', 'Risque opérationnel', 'Operational Risk',
    'Risque de liquidité', 'Liquidity Risk', 'Risque de taux', 'Interest Rate Risk',
    
    # Réglementation bancaire
    'Bâle III', 'Basel III', 'Bâle II', 'Basel II', 'Ratio de solvabilité',
    'Capital Requirements', 'Stress Testing', 'ICAAP', 'ILAAP',
    
    # Métriques risque
    'VaR', 'Value at Risk', 'Expected Shortfall', 'CVA', 'DVA',
    'PD', 'Probability of Default', 'LGD', 'Loss Given Default',
    'EAD', 'Exposure at Default',
    
    # === MARCHÉS FINANCIERS ===
    
    # Trading & Marchés
    'Trading', 'Marchés financiers', 'Financial Markets', 'Capital Markets',
    'Equity Markets', 'Fixed Income', 'Derivatives', 'Produits dérivés',
    'Options', 'Futures', 'Swaps', 'Forwards', 'CDS',
    
    # Investment Banking
    'Banque d\'investissement', 'Investment Banking', 'M&A', 'Fusions & Acquisitions',
    'IPO', 'Introduction en bourse', 'ECM', 'Equity Capital Markets',
    'DCM', 'Debt Capital Markets', 'Leveraged Finance',
    
    # Asset Management
    'Gestion d\'actifs', 'Asset Management', 'Portfolio Management',
    'Gestion de portefeuille', 'Fund Management', 'Investment Management',
    'OPCVM', 'Mutual Funds', 'ETF', 'Hedge Funds',
    
    # === BANQUE DE DÉTAIL ===
    
    # Services bancaires
    'Banque de détail', 'Retail Banking', 'Banque commerciale', 'Commercial Banking',
    'Crédit', 'Lending', 'Crédit à la consommation', 'Consumer Credit',
    'Crédit immobilier', 'Mortgage', 'Crédit aux entreprises', 'Corporate Lending',
    
    # Produits bancaires
    'Comptes bancaires', 'Bank Accounts', 'Cartes bancaires', 'Payment Cards',
    'Virements', 'Wire Transfers', 'Prélèvements', 'Direct Debits',
    'Épargne', 'Savings', 'Placements', 'Investments',
    
    # Services digitaux
    'Banque en ligne', 'Online Banking', 'Mobile Banking', 'Digital Banking',
    'Fintech', 'Néobanques', 'Neobanks', 'Open Banking', 'API Banking',
    
    # === FINANCE ISLAMIQUE ===
    
    # Principes
    'Finance islamique', 'Islamic Finance', 'Sharia Compliance',
    'Banque islamique', 'Islamic Banking',
    
    # Produits islamiques
    'Murabaha', 'Ijara', 'Mudaraba', 'Musharaka', 'Sukuk',
    'Takaful', 'Salam', 'Istisna',
    
    # === ASSURANCE ===
    
    # Types d\'assurance
    'Assurance', 'Insurance', 'Assurance vie', 'Life Insurance',
    'Assurance non-vie', 'Non-Life Insurance', 'Assurance dommages',
    'Assurance automobile', 'Auto Insurance', 'Assurance habitation',
    
    # Techniques assurantielles
    'Actuariat', 'Actuarial Science', 'Souscription', 'Underwriting',
    'Tarification', 'Pricing', 'Provisionnement', 'Reserving',
    'Réassurance', 'Reinsurance', 'Gestion des sinistres', 'Claims Management',
    
    # Réglementation assurance
    'Solvabilité II', 'Solvency II', 'ORSA', 'QRT',
    'Pilier I', 'Pilier II', 'Pilier III',
    
    # === FINTECH & INNOVATION ===
    
    # Technologies financières
    'Fintech', 'Regtech', 'Insurtech', 'Wealthtech', 'Proptech',
    'Blockchain finance', 'Cryptocurrency', 'Digital Currency',
    'Central Bank Digital Currency', 'CBDC',
    
    # Paiements digitaux
    'Paiement mobile', 'Mobile Payment', 'E-payment', 'Digital Wallet',
    'Contactless Payment', 'QR Code Payment', 'P2P Payment',
    'Cross-border Payment', 'Remittances',
    
    # Innovation
    'Robo-advisors', 'Algorithmic Trading', 'High-Frequency Trading',
    'Peer-to-Peer Lending', 'Crowdfunding', 'Crowdlending',
    'Buy Now Pay Later', 'BNPL',
    
    # === CONFORMITÉ & RÉGLEMENTATION ===
    
    # Lutte anti-blanchiment
    'AML', 'Anti-Money Laundering', 'Lutte anti-blanchiment',
    'KYC', 'Know Your Customer', 'CDD', 'Customer Due Diligence',
    'CTF', 'Counter Terrorist Financing', 'Sanctions', 'Embargos',
    
    # Réglementation
    'Compliance', 'Conformité', 'Réglementation bancaire',
    'MiFID II', 'DSP2', 'PSD2', 'GDPR', 'RGPD',
    'Dodd-Frank', 'Volcker Rule', 'EMIR', 'PRIIPS',
    
    # === OUTILS & TECHNOLOGIES ===
    
    # ERP & Logiciels
    'SAP', 'SAP FI', 'SAP CO', 'Oracle Financials', 'PeopleSoft',
    'Sage', 'Cegid', 'QuickBooks', 'Xero',
    
    # Outils spécialisés
    'Bloomberg', 'Reuters', 'Factset', 'Morningstar',
    'SAS', 'R', 'MATLAB', 'Python Finance', 'VBA',
    'SQL Finance', 'Excel VBA', 'Power BI Finance',
    
    # Trading systems
    'Trading Systems', 'OMS', 'Order Management System',
    'Portfolio Management System', 'Risk Management System',
    'FIX Protocol', 'SWIFT',
    
    # === FISCALITÉ ===
    
    # Fiscalité des entreprises
    'Fiscalité', 'Taxation', 'Impôt sur les sociétés', 'Corporate Tax',
    'TVA', 'VAT', 'Fiscalité internationale', 'Transfer Pricing',
    'Optimisation fiscale', 'Tax Planning',
    
    # Fiscalité des particuliers
    'Impôt sur le revenu', 'Income Tax', 'Patrimoine', 'Wealth Management',
    'Succession', 'Estate Planning', 'Donation', 'Gift Tax'
]

# ==========================================
# ÉNERGIE & TRANSITION ÉNERGÉTIQUE - ENRICHI
# ==========================================

ENERGY_TRANSITION_SKILLS = [
    # === ÉNERGIES FOSSILES ===
    
    # Pétrole
    'Pétrole', 'Oil', 'Crude Oil', 'Pétrole brut', 'Exploration pétrolière',
    'Oil Exploration', 'Production pétrolière', 'Oil Production',
    'Forage pétrolier', 'Drilling', 'Offshore drilling', 'Onshore drilling',
    
    # Gaz naturel
    'Gaz naturel', 'Natural Gas', 'Gaz', 'LNG', 'GNL', 'Gaz naturel liquéfié',
    'Liquefied Natural Gas', 'Pipeline gaz', 'Gas Pipeline',
    'Distribution de gaz', 'Gas Distribution',
    
    # Raffinage et pétrochimie
    'Raffinage', 'Refining', 'Pétrochimie', 'Petrochemicals',
    'Produits pétroliers', 'Petroleum Products', 'Carburants', 'Fuels',
    'Essence', 'Gasoline', 'Diesel', 'Kérosène', 'Jet Fuel',
    
    # Technologies upstream
    'Upstream', 'Midstream', 'Downstream', 'Sismique', 'Seismic',
    'Géologie pétrolière', 'Petroleum Geology', 'Réservoir', 'Reservoir',
    'Enhanced Oil Recovery', 'EOR', 'Fracturation hydraulique', 'Fracking',
    
    # === ÉNERGIES RENOUVELABLES ===
    
    # Solaire
    'Énergie solaire', 'Solar Energy', 'Photovoltaïque', 'Photovoltaic', 'PV',
    'Panneaux solaires', 'Solar Panels', 'Cellules photovoltaïques',
    'Solaire thermique', 'Solar Thermal', 'CSP', 'Concentrated Solar Power',
    
    # Éolien
    'Énergie éolienne', 'Wind Energy', 'Éolien terrestre', 'Onshore Wind',
    'Éolien offshore', 'Offshore Wind', 'Éoliennes', 'Wind Turbines',
    'Parc éolien', 'Wind Farm', 'Aérodynamique', 'Aerodynamics',
    
    # Hydraulique
    'Énergie hydraulique', 'Hydroelectric Power', 'Hydroélectricité',
    'Barrages', 'Dams', 'Turbines hydrauliques', 'Hydro Turbines',
    'Petite hydraulique', 'Small Hydro', 'Pompage-turbinage', 'Pumped Storage',
    
    # Autres renouvelables
    'Géothermie', 'Geothermal Energy', 'Biomasse', 'Biomass', 'Bioénergie',
    'Biogaz', 'Biogas', 'Biofuels', 'Biocarburants', 'Méthanisation',
    'Énergies marines', 'Marine Energy', 'Hydrolien', 'Tidal Energy',
    'Houlomoteur', 'Wave Energy',
    
    # === ÉLECTRICITÉ ===
    
    # Production électrique
    'Production d\'électricité', 'Electricity Generation', 'Centrales électriques',
    'Power Plants', 'Centrales thermiques', 'Thermal Power Plants',
    'Centrales nucléaires', 'Nuclear Power Plants', 'Cogénération', 'Cogeneration',
    
    # Transport et distribution
    'Transport d\'électricité', 'Electricity Transmission', 'Distribution électrique',
    'Electricity Distribution', 'Réseaux électriques', 'Power Grid',
    'Lignes haute tension', 'High Voltage Lines', 'Postes de transformation',
    'Substations', 'Transformateurs', 'Transformers',
    
    # Réseaux intelligents
    'Smart Grid', 'Réseaux intelligents', 'Compteurs intelligents', 'Smart Meters',
    'Microgrids', 'Micro-réseaux', 'Grid Integration', 'Intégration réseau',
    'Load Balancing', 'Équilibrage de charge', 'Demand Response',
    
    # === TRANSITION ÉNERGÉTIQUE ===
    
    # Concepts généraux
    'Transition énergétique', 'Energy Transition', 'Transformation énergétique',
    'Décarbonation', 'Decarbonization', 'Décarbonisation',
    'Neutralité carbone', 'Carbon Neutrality', 'Net Zero', 'Zéro émission nette',
    
    # Mix énergétique
    'Mix énergétique', 'Energy Mix', 'Bouquet énergétique',
    'Diversification énergétique', 'Energy Diversification',
    'Sécurité énergétique', 'Energy Security',
    
    # Efficacité énergétique
    'Efficacité énergétique', 'Energy Efficiency', 'Économies d\'énergie',
    'Energy Savings', 'Sobriété énergétique', 'Energy Sobriety',
    'Performance énergétique', 'Energy Performance',
    
    # === HYDROGÈNE ===
    
    # Types d\'hydrogène
    'Hydrogène', 'Hydrogen', 'Hydrogène vert', 'Green Hydrogen',
    'Hydrogène bleu', 'Blue Hydrogen', 'Hydrogène gris', 'Grey Hydrogen',
    'Hydrogène rose', 'Pink Hydrogen',
    
    # Technologies hydrogène
    'Électrolyse', 'Electrolysis', 'Piles à combustible', 'Fuel Cells',
    'Stockage hydrogène', 'Hydrogen Storage', 'Transport hydrogène',
    'Power-to-Gas', 'Power-to-X', 'Méthanation', 'Methanation',
    
    # === STOCKAGE D\'ÉNERGIE ===
    
    # Technologies de stockage
    'Stockage d\'énergie', 'Energy Storage', 'Batteries', 'Battery Storage',
    'Lithium-ion', 'Lithium-Ion Batteries', 'Batteries sodium', 'Sodium Batteries',
    'BESS', 'Battery Energy Storage System',
    
    # Stockage mécanique
    'STEP', 'Station de Transfert d\'Énergie par Pompage', 'Pumped Hydro Storage',
    'Air comprimé', 'Compressed Air Energy Storage', 'CAES',
    'Volants d\'inertie', 'Flywheel Energy Storage',
    
    # === MOBILITÉ DURABLE ===
    
    # Véhicules électriques
    'Mobilité électrique', 'Electric Mobility', 'Véhicules électriques',
    'Electric Vehicles', 'EV', 'Voitures électriques', 'Electric Cars',
    'Bornes de recharge', 'Charging Stations', 'Recharge rapide', 'Fast Charging',
    
    # Infrastructure mobilité
    'Infrastructure de recharge', 'Charging Infrastructure',
    'Vehicle-to-Grid', 'V2G', 'Vehicle-to-Home', 'V2H',
    'Smart Charging', 'Recharge intelligente',
    
    # Carburants alternatifs
    'Biocarburants', 'Biofuels', 'Biodiesel', 'Bioéthanol', 'Bioethanol',
    'GNV', 'Gaz Naturel Véhicule', 'Compressed Natural Gas', 'CNG',
    'BioGNV', 'Hydrogène mobilité', 'Hydrogen Mobility',
    
    # === CARBONE & ENVIRONNEMENT ===
    
    # Marché carbone
    'Marché carbone', 'Carbon Market', 'Échange de quotas', 'Emissions Trading',
    'ETS', 'EU ETS', 'Quotas carbone', 'Carbon Allowances',
    'Crédits carbone', 'Carbon Credits', 'Compensation carbone', 'Carbon Offsetting',
    
    # Mesure carbone
    'Empreinte carbone', 'Carbon Footprint', 'Bilan carbone', 'Carbon Assessment',
    'Analyse cycle de vie', 'Life Cycle Assessment', 'LCA',
    'Scope 1', 'Scope 2', 'Scope 3', 'GES', 'Gaz à effet de serre',
    'Greenhouse Gas', 'GHG', 'CO2', 'Méthane', 'Methane',
    
    # Capture carbone
    'Capture carbone', 'Carbon Capture', 'CCS', 'Carbon Capture and Storage',
    'CCUS', 'Carbon Capture Utilization and Storage',
    'Direct Air Capture', 'DAC',
    
    # === RÉGLEMENTATION ÉNERGIE ===
    
    # Politique énergétique
    'Politique énergétique', 'Energy Policy', 'Régulation énergétique',
    'Energy Regulation', 'Tarifs réglementés', 'Regulated Tariffs',
    'Subventions énergétiques', 'Energy Subsidies',
    
    # Accords internationaux
    'Accords de Paris', 'Paris Agreement', 'COP21', 'COP26', 'COP28',
    'GIEC', 'IPCC', 'Protocole de Kyoto', 'Kyoto Protocol',
    'NDC', 'Nationally Determined Contributions',
    
    # Normes et certifications
    'ISO 50001', 'ISO 14001', 'Certification énergétique',
    'Energy Certification', 'Audit énergétique', 'Energy Audit',
    'Green Building', 'Bâtiments verts', 'LEED', 'BREEAM', 'HQE',
    
    # === TECHNOLOGIES ÉMERGENTES ===
    
    # Fusion nucléaire
    'Fusion nucléaire', 'Nuclear Fusion', 'ITER', 'Tokamak',
    'Énergie de fusion', 'Fusion Energy',
    
    # Nouvelles technologies
    'Pérovskites', 'Perovskite Solar Cells', 'Solaire spatial', 'Space Solar',
    'Kites énergétiques', 'Energy Kites', 'Éolien en altitude',
    'High Altitude Wind Power',
    
    # === INDUSTRIE PÉTROLIÈRE MAURITANIENNE ===
    
    # Contexte mauritanien
    'Pétrole Mauritanie', 'GTA', 'Gaz Tortue Ahmeyim', 'Bir Allah',
    'Chinguetti', 'Tiof', 'Banda', 'Tevet', 'Pelican',
    'Kosmos Energy', 'BP Mauritanie', 'Total Mauritanie',
    
    # Offshore mauritanien
    'Offshore Mauritanie', 'FPSO Mauritanie', 'Exploration offshore',
    'Blocs pétroliers mauritaniens', 'Licences pétrolières',
    
    # === MINING & EXTRACTIVES ===
    
    # Ressources minérales énergétiques
    'Uranium', 'Mines d\'uranium', 'Uranium Mining', 'Lithium', 'Lithium Mining',
    'Cobalt', 'Cobalt Mining', 'Terres rares', 'Rare Earth Elements',
    'Graphite', 'Graphite Mining', 'Vanadium', 'Nickel énergétique'
]

# ==========================================
# INDUSTRIE & MINES - ENRICHI
# ==========================================

INDUSTRY_MINING_SKILLS = [
    # === EXPLOITATION MINIÈRE ===
    
    # Types d\'exploitation
    'Exploitation minière', 'Mining', 'Mine à ciel ouvert', 'Open Pit Mining',
    'Mine souterraine', 'Underground Mining', 'Exploitation alluvionnaire',
    'Placer Mining', 'Carrières', 'Quarrying',
    
    # Géologie minière
    'Géologie minière', 'Mining Geology', 'Prospection minière', 'Mineral Exploration',
    'Exploration minière', 'Géophysique minière', 'Mining Geophysics',
    'Géochimie', 'Geochemistry', 'Cartographie géologique', 'Geological Mapping',
    
    # Forage et échantillonnage
    'Forage minier', 'Mining Drilling', 'Forage de reconnaissance',
    'Exploration Drilling', 'Échantillonnage', 'Sampling',
    'Carottes de forage', 'Drill Cores', 'Logging géologique',
    
    # Modélisation et estimation
    'Modélisation géologique', 'Geological Modeling', 'Modélisation 3D',
    'Estimation de ressources', 'Resource Estimation',
    'Classification des réserves', 'Reserve Classification',
    'JORC Code', 'NI 43-101', 'Codes miniers',
    
    # === MÉTAUX ET MINERAIS ===
    
    # Métaux précieux
    'Or', 'Gold', 'Argent', 'Silver', 'Platine', 'Platinum',
    'Palladium', 'Métaux précieux', 'Precious Metals',
    'Orpaillage', 'Artisanal Gold Mining',
    
    # Métaux de base
    'Cuivre', 'Copper', 'Zinc', 'Plomb', 'Lead', 'Nickel',
    'Aluminium', 'Bauxite', 'Étain', 'Tin', 'Métaux de base', 'Base Metals',
    
    # Fer et acier
    'Fer', 'Iron', 'Minerai de fer', 'Iron Ore', 'Hématite', 'Hematite',
    'Magnétite', 'Magnetite', 'Taconite', 'Pellets de fer',
    
    # Minerais industriels
    'Phosphate', 'Phosphates', 'Potasse', 'Potash', 'Sel', 'Salt',
    'Gypse', 'Gypsum', 'Calcaire', 'Limestone', 'Argile', 'Clay',
    
    # Métaux critiques
    'Terres rares', 'Rare Earth Elements', 'REE', 'Lithium', 'Cobalt',
    'Graphite', 'Tantale', 'Tantalum', 'Niobium', 'Césium',
    
    # Minerais énergétiques
    'Uranium', 'Charbon', 'Coal', 'Lignite', 'Anthracite',
    'Tourbe', 'Peat', 'Schistes bitumineux', 'Oil Shale',
    
    # === TRAITEMENT DES MINERAIS ===
    
    # Préparation mécanique
    'Concassage', 'Crushing', 'Broyage', 'Grinding', 'Criblage', 'Screening',
    'Classification', 'Séparation granulométrique', 'Size Separation',
    'Lavage', 'Washing', 'Débourbage', 'Desliming',
    
    # Concentration
    'Concentration des minerais', 'Mineral Processing', 'Enrichissement',
    'Beneficiation', 'Séparation magnétique', 'Magnetic Separation',
    'Séparation électrostatique', 'Electrostatic Separation',
    'Séparation densimétrique', 'Dense Media Separation',
    
    # Flottation
    'Flottation', 'Flotation', 'Mousse de flottation', 'Flotation Foam',
    'Réactifs de flottation', 'Flotation Reagents', 'Collecteurs',
    'Moussants', 'Déprimants', 'Activants',
    
    # Lixiviation
    'Lixiviation', 'Leaching', 'Lixiviation en tas', 'Heap Leaching',
    'Lixiviation in situ', 'In-Situ Leaching', 'Cyanuration', 'Cyanide Leaching',
    'Lixiviation acide', 'Acid Leaching', 'Biolixiviation', 'Bioleaching',
    
    # === MÉTALLURGIE ===
    
    # Pyrométallurgie
    'Pyrométallurgie', 'Pyrometallurgy', 'Fusion', 'Smelting',
    'Grillage', 'Roasting', 'Calcination', 'Réduction',
    'Haut fourneau', 'Blast Furnace', 'Four électrique', 'Electric Furnace',
    
    # Hydrométallurgie
    'Hydrométallurgie', 'Hydrometallurgy', 'Extraction liquide-liquide',
    'Solvent Extraction', 'Électrolyse', 'Electrolysis',
    'Précipitation', 'Precipitation', 'Cémentation',
    
    # Électrométallurgie
    'Électrométallurgie', 'Electrometallurgy', 'Électrolyse',
    'Électroraffinatge', 'Electrorefining', 'Électroextraction',
    'Électrowinning', 'Galvanoplastie', 'Electroplating',
    
    # === INDUSTRIE LOURDE ===
    
    # Sidérurgie
    'Sidérurgie', 'Steel Industry', 'Aciérie', 'Steel Mill',
    'Production d\'acier', 'Steel Production', 'Laminoir', 'Rolling Mill',
    'Coulée continue', 'Continuous Casting', 'Trempe', 'Quenching',
    
    # Métallurgie de l\'aluminium
    'Aluminium', 'Aluminum', 'Électrolyse aluminium', 'Aluminum Smelting',
    'Bauxite', 'Alumine', 'Alumina', 'Procédé Bayer', 'Bayer Process',
    'Procédé Hall-Héroult', 'Hall-Héroult Process',
    
    # Fonderie
    'Fonderie', 'Foundry', 'Moulage', 'Casting', 'Coulée', 'Pouring',
    'Forge', 'Forging', 'Estampage', 'Stamping', 'Matricage',
    
    # === MANUFACTURING ===
    
    # Production industrielle
    'Production industrielle', 'Industrial Production', 'Manufacturing',
    'Fabrication', 'Assemblage', 'Assembly', 'Usinage', 'Machining',
    'Tournage', 'Turning', 'Fraisage', 'Milling', 'Perçage', 'Drilling',
    
    # Industrie 4.0
    'Industrie 4.0', 'Industry 4.0', 'Usine intelligente', 'Smart Factory',
    'Usine du futur', 'Factory of the Future', 'Fabrication additive',
    'Additive Manufacturing', 'Impression 3D', '3D Printing',
    
    # Automatisation
    'Automatisation industrielle', 'Industrial Automation', 'Robotique industrielle',
    'Industrial Robotics', 'Cobots', 'Collaborative Robots',
    'Systèmes automatisés', 'Automated Systems',
    
    # IoT industriel
    'IoT industriel', 'Industrial IoT', 'IIoT', 'Capteurs industriels',
    'Industrial Sensors', 'Monitoring industriel', 'Industrial Monitoring',
    'Maintenance prédictive', 'Predictive Maintenance',
    
    # === QUALITÉ INDUSTRIELLE ===
    
    # Systèmes qualité
    'Qualité industrielle', 'Industrial Quality', 'Contrôle qualité',
    'Quality Control', 'Assurance qualité', 'Quality Assurance',
    'Management de la qualité', 'Quality Management',
    
    # Normes ISO
    'ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001',
    'OHSAS 18001', 'Certification ISO', 'Audit qualité',
    
    # Méthodes d\'amélioration
    'Lean Manufacturing', 'Lean Production', 'Six Sigma', 'Kaizen',
    '5S', 'TPM', 'Total Productive Maintenance', 'TQM',
    'Total Quality Management', 'Amélioration continue',
    
    # Outils qualité
    'Contrôle statistique', 'Statistical Process Control', 'SPC',
    'Plans d\'expérience', 'Design of Experiments', 'DOE',
    'AMDEC', 'FMEA', 'Ishikawa', 'Pareto',
    
    # === MAINTENANCE INDUSTRIELLE ===
    
    # Types de maintenance
    'Maintenance industrielle', 'Industrial Maintenance', 'Maintenance préventive',
    'Preventive Maintenance', 'Maintenance corrective', 'Corrective Maintenance',
    'Maintenance prédictive', 'Predictive Maintenance',
    'Maintenance conditionnelle', 'Condition-Based Maintenance',
    
    # Outils maintenance
    'GMAO', 'CMMS', 'Computerized Maintenance Management System',
    'Planification maintenance', 'Maintenance Planning',
    'Ordonnancement maintenance', 'Maintenance Scheduling',
    
    # Technologies maintenance
    'Analyse vibratoire', 'Vibration Analysis', 'Thermographie',
    'Thermography', 'Analyse d\'huile', 'Oil Analysis',
    'Ultrasons', 'Ultrasonic Testing', 'Courants de Foucault',
    
    # === SÉCURITÉ INDUSTRIELLE ===
    
    # QHSE
    'QHSE', 'Qualité Hygiène Sécurité Environnement', 'HSE',
    'Health Safety Environment', 'Sécurité industrielle', 'Industrial Safety',
    'Sécurité au travail', 'Occupational Safety', 'Hygiène industrielle',
    
    # Prévention des risques
    'Prévention des risques', 'Risk Prevention', 'Analyse des risques',
    'Risk Analysis', 'Évaluation des risques', 'Risk Assessment',
    'Document unique', 'HAZOP', 'What-if Analysis',
    
    # Gestion des urgences
    'Plans d\'urgence', 'Emergency Plans', 'Gestion de crise',
    'Crisis Management', 'Évacuation', 'Evacuation',
    'Premiers secours', 'First Aid', 'EPI', 'Personal Protective Equipment',
    
    # Normes sécurité
    'ATEX', 'Explosive Atmospheres', 'Machines', 'Machine Safety',
    'Équipements de protection', 'Protection Equipment',
    'Signalisation sécurité', 'Safety Signage',
    
    # === ENVIRONNEMENT INDUSTRIEL ===
    
    # Pollution industrielle
    'Pollution industrielle', 'Industrial Pollution', 'Émissions industrielles',
    'Industrial Emissions', 'Traitement des effluents', 'Effluent Treatment',
    'Traitement des eaux usées', 'Wastewater Treatment',
    
    # Gestion des déchets
    'Gestion des déchets', 'Waste Management', 'Déchets industriels',
    'Industrial Waste', 'Valorisation des déchets', 'Waste Valorization',
    'Recyclage', 'Recycling', 'Économie circulaire', 'Circular Economy',
    
    # Dépollution
    'Dépollution', 'Decontamination', 'Réhabilitation de sites',
    'Site Remediation', 'Sols pollués', 'Contaminated Soils',
    'Fermeture de mine', 'Mine Closure', 'Réaménagement minier',
    
    # === CHIMIE INDUSTRIELLE ===
    
    # Procédés chimiques
    'Industrie chimique', 'Chemical Industry', 'Chimie industrielle',
    'Industrial Chemistry', 'Génie chimique', 'Chemical Engineering',
    'Procédés chimiques', 'Chemical Processes', 'Réacteurs chimiques',
    
    # Pétrochimie
    'Pétrochimie', 'Petrochemicals', 'Raffinage', 'Refining',
    'Craquage', 'Cracking', 'Reformage', 'Reforming',
    'Distillation', 'Distillation', 'Polymérisation',
    
    # Matériaux
    'Polymères', 'Polymers', 'Plastiques', 'Plastics', 'Résines', 'Resins',
    'Élastomères', 'Elastomers', 'Composites', 'Composite Materials',
    'Céramiques', 'Ceramics', 'Matériaux avancés', 'Advanced Materials',
    
    # === ÉNERGIE INDUSTRIELLE ===
    
    # Utilités industrielles
    'Utilités industrielles', 'Industrial Utilities', 'Vapeur industrielle',
    'Industrial Steam', 'Air comprimé', 'Compressed Air',
    'Froid industriel', 'Industrial Refrigeration', 'Eau industrielle',
    
    # Efficacité énergétique
    'Efficacité énergétique industrielle', 'Industrial Energy Efficiency',
    'Audit énergétique industriel', 'Industrial Energy Audit',
    'Cogénération', 'Cogeneration', 'Récupération de chaleur',
    'Heat Recovery', 'Trigénération', 'Trigeneration',
    
    # === INGÉNIERIE INDUSTRIELLE ===
    
    # Conception industrielle
    'Ingénierie industrielle', 'Industrial Engineering', 'Conception industrielle',
    'Industrial Design', 'Études techniques', 'Technical Studies',
    'Dimensionnement', 'Sizing', 'Calcul de structures',
    
    # Outils de conception
    'CAO', 'CAD', 'Computer-Aided Design', 'FAO', 'CAM',
    'Computer-Aided Manufacturing', 'Simulation industrielle',
    'Industrial Simulation', 'Modélisation 3D', '3D Modeling',
    
    # Construction industrielle
    'Construction industrielle', 'Industrial Construction', 'Génie civil industriel',
    'Industrial Civil Engineering', 'Charpente métallique', 'Steel Structure',
    'Béton industriel', 'Industrial Concrete', 'Tuyauterie', 'Piping',
    
    # === CONTEXTE MAURITANIEN ===
    
    # Mines en Mauritanie
    'Mines Mauritanie', 'SNIM', 'Société Nationale Industrielle et Minière',
    'Fer Zouerate', 'Guelbs', 'Kedia', 'F\'dérik', 'Zouerate',
    'Minerai de fer mauritanien', 'Train du désert',
    
    # Or en Mauritanie
    'Or Mauritanie', 'Tasiast', 'Kinross', 'Akjoujt', 'Guelb Moghrein',
    'CMAP', 'Compagnie Minière d\'Akjoujt et Agence',
    
    # Autres minerais
    'Gypse Mauritanie', 'Sel Mauritanie', 'Phosphate Mauritanie',
    'Cuivre Akjoujt', 'Mines artisanales Mauritanie',
    
    # Infrastructure minière
    'Port minéralier Nouadhibou', 'Chemin de fer minier',
    'Infrastructure minière mauritanienne',
    'Zones franches minières'
]

# ==========================================
# DICTIONNAIRE PRINCIPAL ENRICHI
# ==========================================

ALL_SKILLS = {
    'DIGITAL': DIGITAL_TELECOM_SKILLS,
    'FINANCE': FINANCE_BANKING_SKILLS,
    'ENERGIE': ENERGY_TRANSITION_SKILLS,
    'INDUSTRIE': INDUSTRY_MINING_SKILLS
}

# ==========================================
# MÉTADONNÉES ET STATISTIQUES
# ==========================================

COMPETENCES_METADATA = {
    'version': '2.0_ENRICHED_FIXED',
    'last_updated': '2024-12-19',
    'total_domains': len(ALL_SKILLS),
    'total_skills': sum(len(skills) for skills in ALL_SKILLS.values()),
    'skills_per_domain': {domain: len(skills) for domain, skills in ALL_SKILLS.items()},
    'features': [
        'Compétences techniques détaillées',
        'Variantes et synonymes inclus',
        'Technologies émergentes',
        'Contexte mauritanien spécialisé',
        'Normes et certifications',
        'Outils et logiciels métier',
        'Méthologies et frameworks',
        'Correspondances multilingues (FR/EN)'
    ],
    'extraction_optimizations': [
        'Patterns de recherche exacte et partielle',
        'Déduplication intelligente des variantes',
        'Correspondance contextuelle',
        'Scoring par pertinence',
        'Catégorisation automatique'
    ]
}

# ==========================================
# FONCTIONS UTILITAIRES
# ==========================================

def get_all_skills_flat():
    """Retourne toutes les compétences dans une liste plate"""
    all_skills_flat = []
    for domain_skills in ALL_SKILLS.values():
        all_skills_flat.extend(domain_skills)
    return all_skills_flat

def get_skills_by_domain(domain_name):
    """Retourne les compétences d'un domaine spécifique"""
    return ALL_SKILLS.get(domain_name.upper(), [])

def search_skills(query, domain=None):
    """Recherche de compétences par mot-clé"""
    query_lower = query.lower()
    found_skills = []
    
    domains_to_search = [domain.upper()] if domain else ALL_SKILLS.keys()
    
    for domain_name in domains_to_search:
        if domain_name in ALL_SKILLS:
            for skill in ALL_SKILLS[domain_name]:
                if query_lower in skill.lower():
                    found_skills.append({'skill': skill, 'domain': domain_name})
    
    return found_skills

def get_domain_stats():
    """Statistiques par domaine"""
    stats = {}
    for domain, skills in ALL_SKILLS.items():
        stats[domain] = {
            'count': len(skills),
            'sample_skills': skills[:5],  # 5 premiers exemples
            'categories': _get_domain_categories(domain, skills)
        }
    return stats

def _get_domain_categories(domain, skills):
    """Catégories identifiées par domaine"""
    categories = {
        'DIGITAL': ['Développement', 'Bases de données', 'Cloud/DevOps', 'Data Science', 'Cybersécurité', 'Télécoms'],
        'FINANCE': ['Finance générale', 'Banque', 'Assurance', 'Audit', 'Fintech', 'Conformité'],
        'ENERGIE': ['Fossiles', 'Renouvelables', 'Électricité', 'Transition', 'Carbone', 'Mobilité'],
        'INDUSTRIE': ['Mining', 'Métallurgie', 'Manufacturing', 'Qualité', 'Sécurité', 'Environnement']
    }
    return categories.get(domain, [])

# ==========================================
# VALIDATION ET EXPORT
# ==========================================

def validate_competences_data():
    """Validation de la cohérence des données"""
    validation_results = {
        'total_skills': sum(len(skills) for skills in ALL_SKILLS.values()),
        'domains': list(ALL_SKILLS.keys()),
        'duplicates_found': [],
        'empty_domains': [],
        'validation_passed': True
    }
    
    # Vérifier domaines vides
    for domain, skills in ALL_SKILLS.items():
        if not skills:
            validation_results['empty_domains'].append(domain)
            validation_results['validation_passed'] = False
    
    # Vérifier doublons globaux (optionnel)
    all_skills_flat = get_all_skills_flat()
    seen_skills = set()
    for skill in all_skills_flat:
        skill_normalized = skill.lower().strip()
        if skill_normalized in seen_skills:
            validation_results['duplicates_found'].append(skill)
        else:
            seen_skills.add(skill_normalized)
    
    return validation_results

# ==========================================
# EXPORT POUR LE SYSTÈME D'EXTRACTION
# ==========================================

# Variables exportées pour CVProcessor
__all__ = [
    'ALL_SKILLS',
    'DIGITAL_TELECOM_SKILLS',
    'FINANCE_BANKING_SKILLS', 
    'ENERGY_TRANSITION_SKILLS',
    'INDUSTRY_MINING_SKILLS',
    'COMPETENCES_METADATA',
    'get_all_skills_flat',
    'get_skills_by_domain',
    'search_skills',
    'get_domain_stats',
    'validate_competences_data'
]

# Message de confirmation
