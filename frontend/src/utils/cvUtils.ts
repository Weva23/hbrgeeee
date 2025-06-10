// Database of skills and utilities for CV processing
export const getSkillsDatabase = () => ({
  developpement: [
    // Langages de programmation
    "JavaScript", "TypeScript", "Java", "Python", "C#", "C++", "C", "Ruby", "Go", "Rust", "Swift",
    "Kotlin", "PHP", "Scala", "Clojure", "Haskell", "Erlang", "Elixir", "F#", "Dart", "Groovy",
    "Perl", "Lua", "R", "COBOL", "Assembly", "Fortran", "Ada", "Prolog", "Julia", "MATLAB",
    
    // Front-end
    "HTML5", "CSS3", "SASS/SCSS", "Less", "Stylus", "React", "Angular", "Vue.js", "Svelte",
    "Next.js", "Nuxt.js", "Gatsby", "jQuery", "Bootstrap", "Tailwind CSS", "Material UI",
    "Chakra UI", "Ant Design", "Semantic UI", "Bulma", "Foundation", "Ember.js", "Backbone.js",
    "Redux", "MobX", "Recoil", "Apollo Client", "React Query", "SWR", "Storybook", "Webpack", 
    "Rollup", "Parcel", "Vite", "esbuild", "Babel", "PostCSS", "Web Components",
    
    // Back-end
    "Node.js", "Express", "NestJS", "Fastify", "Koa", "Hapi", "Spring", "Spring Boot", "Django",
    "Flask", "FastAPI", "Laravel", "Symfony", "Ruby on Rails", "ASP.NET", "ASP.NET Core", ".NET",
    "Phoenix", "Actix", "Rocket", "Gin", "Echo", "Play", "Ktor", "Micronaut", "Quarkus", "JHipster",
    
    // Base de données
    "SQL", "MySQL", "PostgreSQL", "SQLite", "Oracle", "Microsoft SQL Server", "MongoDB", "Redis",
    "Cassandra", "Couchbase", "DynamoDB", "Firebase", "Firestore", "Supabase", "Elasticsearch",
    "Neo4j", "InfluxDB", "TimescaleDB", "CockroachDB", "MariaDB", "GraphQL", "Prisma", "TypeORM",
    "Sequelize", "Mongoose", "Hibernate", "JDBC", "JOOQ", "Dapper", "Entity Framework",
    
    // Mobile
    "React Native", "Flutter", "Ionic", "Xamarin", "Cordova", "PhoneGap", "Android SDK",
    "iOS Development", "SwiftUI", "UIKit", "Kotlin Multiplatform", "NativeScript",
    "Capacitor", "Expo", "Mobile UI/UX", "App Deployment", "App Store Connect", "Google Play Console",
    
    // DevOps
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud Platform", "Digital Ocean",
    "Heroku", "Netlify", "Vercel", "Jenkins", "GitLab CI/CD", "GitHub Actions", "CircleCI",
    "TravisCI", "Terraform", "Ansible", "Chef", "Puppet", "Prometheus", "Grafana", "ELK Stack",
    "Datadog", "New Relic", "Sentry", "Linux", "Unix", "Nginx", "Apache", "HAProxy",
    
    // Sécurité
    "Cybersecurity", "Ethical Hacking", "Penetration Testing", "OWASP", "Encryption",
    "Authentication", "Authorization", "OAuth", "OpenID Connect", "JWT", "SAML", "SSO",
    "Firewalls", "VPN", "IDS/IPS", "Security Auditing", "Vulnerability Assessment", "Network Security",
    
    // Data Science & AI
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Mining",
    "Big Data", "Data Warehousing", "Data Visualization", "TensorFlow", "PyTorch", "Keras",
    "scikit-learn", "Pandas", "NumPy", "Apache Spark", "Hadoop", "Tableau", "Power BI",
    "SPSS", "SAS", "Reinforcement Learning", "Generative AI", "LLMs", "Neural Networks",
    
    // Blockchain
    "Blockchain", "Smart Contracts", "Ethereum", "Solidity", "Web3.js", "ethers.js",
    "Truffle", "Hardhat", "Ganache", "Hyperledger", "NFTs", "DApps", "Cryptocurrency"
  ],
  
  methodologie: [
    "Agile", "Scrum", "Kanban", "Lean", "PRINCE2", "PMBOK", "Waterfall", "DevOps", "XP",
    "Feature Driven Development", "Test Driven Development", "Behavior Driven Development",
    "Domain Driven Design", "Event Storming", "UML", "ERD", "Design Thinking", "Six Sigma",
    "ITIL", "TOGAF", "CMMI", "Business Analysis", "Requirements Engineering", "SAFe"
  ],
  
  softSkills: [
    "Communication", "Leadership", "Travail d'équipe", "Résolution de problèmes",
    "Pensée critique", "Créativité", "Intelligence émotionnelle", "Adaptabilité",
    "Gestion du temps", "Négociation", "Présentation", "Résolution de conflits",
    "Mentorat", "Networking", "Prise de décision", "Culture d'entreprise"
  ],
  
  design: [
    "UI Design", "UX Design", "Graphic Design", "Wireframing", "Prototyping",
    "User Testing", "Responsive Design", "Figma", "Sketch", "Adobe XD", "InVision",
    "Photoshop", "Illustrator", "After Effects", "Zeplin", "Design Systems",
    "Information Architecture", "Interaction Design", "Visual Design", "Animation"
  ],
  
  langues: [
    "Anglais", "Français", "Espagnol", "Allemand", "Mandarin", "Arabe",
    "Russe", "Portugais", "Italien", "Japonais", "Hindi", "Coréen"
  ],
  
  industrie: [
    "Finance", "Santé", "E-commerce", "Éducation", "Immobilier", "Assurance",
    "Automobile", "Aéronautique", "Télécommunications", "Énergie", "Transport",
    "Logistique", "Médias", "Divertissement", "Jeux vidéo", "Agroalimentaire",
    "Pharmaceutique", "Chimie", "Textile", "Construction", "Défense"
  ],
  
  testing: [
    "Tests unitaires", "Tests d'intégration", "Tests end-to-end", "Tests fonctionnels",
    "Tests de performance", "Tests de sécurité", "Tests d'accessibilité", "JUnit",
    "Jest", "Mocha", "Chai", "Cypress", "Selenium", "Playwright", "TestCafe",
    "Postman", "SoapUI", "JMeter", "LoadRunner", "Gatling", "Robot Framework", "Cucumber"
  ],
  
  gestionProjet: [
    "JIRA", "Confluence", "Trello", "Asana", "Monday.com", "ClickUp", "Notion",
    "Basecamp", "Microsoft Project", "Project Management", "Program Management",
    "Portfolio Management", "Resource Management", "Risk Management", "Budgeting",
    "Stakeholder Management", "Change Management", "Issue Management"
  ]
});

export const extractSkillsFromCV = (cvContent: string, fileName: string, domainePrincipal: string) => {
  const skillsDatabase = getSkillsDatabase();
  const extractedSkills = new Set<string>();
  const lowerCvContent = cvContent.toLowerCase();
  
  // Fonction pour générer un "fingerprint" linguistique du CV
  const generateContentFingerprint = () => {
    const technicalTerms = new Set<string>();
    
    // Analyser le contenu du CV pour détecter les termes techniques
    const words = lowerCvContent.split(/\s+/);
    const potentialSkills = Object.values(skillsDatabase).flat();
    
    words.forEach(word => {
      if (word.length > 3) { // Ignorer les mots trop courts
        // Rechercher des correspondances approximatives
        potentialSkills.forEach(skill => {
          if (skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase())) {
            technicalTerms.add(skill);
          }
        });
      }
    });
    
    return Array.from(technicalTerms);
  };
  
  // Obtenir l'empreinte du contenu
  const contentFingerprint = generateContentFingerprint();
  
  // Déterminer les catégories principales en fonction du domaine et du contenu
  let mainCategories: string[] = [];
  
  switch (domainePrincipal) {
    case "developpement":
      mainCategories = ["developpement", "testing", "methodologie"];
      if (lowerCvContent.includes("devops") || lowerCvContent.includes("cloud") || lowerCvContent.includes("aws")) {
        mainCategories.push("gestionProjet");
      }
      break;
    case "datascience":
      mainCategories = ["developpement", "industrie"];
      break;
    case "design":
      mainCategories = ["design", "softSkills"];
      break;
    default:
      mainCategories = ["methodologie", "gestionProjet", "softSkills"];
      // Détecter d'autres domaines potentiels
      if (lowerCvContent.includes("développ") || lowerCvContent.includes("code") || lowerCvContent.includes("program")) {
        mainCategories.push("developpement");
      }
      if (lowerCvContent.includes("test") || lowerCvContent.includes("qualité")) {
        mainCategories.push("testing");
      }
      break;
  }
  
  // Nombre de base de compétences à extraire
  let baseSkillCount = 15 + Math.floor(Math.random() * 25); // Entre 15 et 40 compétences
  
  // Extraire les compétences des catégories principales en priorité
  mainCategories.forEach(category => {
    if (skillsDatabase[category as keyof typeof skillsDatabase]) {
      const categorySkills = skillsDatabase[category as keyof typeof skillsDatabase];
      const shuffledCategorySkills = [...categorySkills].sort(() => Math.random() - 0.5);
      
      // Prendre un nombre aléatoire de compétences de cette catégorie
      const skillsToTake = Math.min(
        Math.ceil(baseSkillCount * (0.4 + Math.random() * 0.3)), // 40-70% des compétences de base
        shuffledCategorySkills.length
      );
      
      // Filtrer pour trouver des correspondances approximatives avec le contenu du CV
      const relevantSkills = shuffledCategorySkills.filter(skill => {
        return contentFingerprint.some(term => 
          skill.toLowerCase().includes(term.toLowerCase()) || 
          term.toLowerCase().includes(skill.toLowerCase())
        );
      });
      
      // Prendre d'abord les compétences pertinentes
      relevantSkills.slice(0, skillsToTake / 2).forEach(skill => extractedSkills.add(skill));
      
      // Compléter avec des compétences aléatoires si nécessaire
      if (extractedSkills.size < skillsToTake) {
        shuffledCategorySkills.slice(0, skillsToTake - extractedSkills.size).forEach(skill => {
          if (!extractedSkills.has(skill)) extractedSkills.add(skill);
        });
      }
    }
  });
  
  // Ajouter des compétences "supplémentaires" d'autres catégories
  const otherCategories = Object.keys(skillsDatabase).filter(cat => !mainCategories.includes(cat));
  otherCategories.forEach(category => {
    if (skillsDatabase[category as keyof typeof skillsDatabase] && extractedSkills.size < baseSkillCount) {
      const categorySkills = skillsDatabase[category as keyof typeof skillsDatabase];
      const shuffledCategorySkills = [...categorySkills].sort(() => Math.random() - 0.5);
      
      // Prendre beaucoup moins de compétences des autres catégories
      const skillsToTake = Math.min(
        Math.ceil(baseSkillCount * 0.2), // Max 20% des compétences de base
        shuffledCategorySkills.length
      );
      
      shuffledCategorySkills.slice(0, skillsToTake).forEach(skill => {
        if (!extractedSkills.has(skill)) extractedSkills.add(skill);
      });
    }
  });
  
  // Ajouter des compétences personnalisées basées sur le nom du fichier
  const fileNameLower = fileName.toLowerCase();
  const customSkillsByFileName = new Map([
    ["java", ["Java", "Spring Boot", "Hibernate", "Maven"]],
    ["python", ["Python", "Django", "Flask", "NumPy", "Pandas"]],
    ["web", ["HTML5", "CSS3", "JavaScript", "Responsive Design", "SEO"]],
    ["react", ["React", "Redux", "React Router", "Next.js", "Webpack"]],
    ["angular", ["Angular", "TypeScript", "RxJS", "NgRx", "Angular Material"]],
    ["vue", ["Vue.js", "Vuex", "Vue Router", "Nuxt.js"]],
    ["node", ["Node.js", "Express", "NPM", "Serverless", "REST API"]],
    ["mobile", ["React Native", "Flutter", "Swift", "Kotlin", "Mobile UI/UX"]],
    ["cloud", ["AWS", "Azure", "GCP", "Serverless", "Microservices"]],
    ["devops", ["Docker", "Kubernetes", "CI/CD", "Jenkins", "GitLab CI", "Infrastructure as Code"]],
    ["data", ["Data Analysis", "SQL", "NoSQL", "Big Data", "ETL", "Data Warehousing"]],
    ["ai", ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Neural Networks"]],
    ["security", ["Cybersecurity", "Penetration Testing", "OWASP", "Security Auditing"]],
    ["finance", ["Financial Analysis", "Banking Systems", "Trading Platforms", "Payment Processing"]],
    ["healthcare", ["Healthcare IT", "Medical Systems", "HIPAA Compliance", "EHR Systems"]],
    ["ecommerce", ["E-commerce Platforms", "Payment Gateways", "Inventory Management", "Shopify", "WooCommerce"]],
    ["marketing", ["Digital Marketing", "SEO", "SEM", "Content Strategy", "Social Media Marketing"]]
  ]);
  
  for (const [keyword, skills] of customSkillsByFileName.entries()) {
    if (fileNameLower.includes(keyword)) {
      skills.forEach(skill => extractedSkills.add(skill));
    }
  }
  
  return Array.from(extractedSkills).sort();
};

export const determineExpertiseLevel = (skills: string[], cvContent: string): string => {
  // Mots-clés qui indiquent un niveau d'expertise
  const expertKeywords = ["expert", "senior", "lead", "10+ ans", "architect", "chef", "director", "head of"];
  const intermediateKeywords = ["confirmé", "intermédiaire", "5 ans", "3 ans", "middle", "expérimenté"];
  const juniorKeywords = ["junior", "débutant", "stagiaire", "apprenti", "1 an", "étudiant"];
  
  const lowerCvContent = cvContent.toLowerCase();
  
  // Vérifier explicitement les années d'expérience
  const experienceRegex = /(\d+)[\s-]*(ans|an|années|year|years).*expérience/i;
  const experienceMatch = lowerCvContent.match(experienceRegex);
  let yearsOfExperience = 0;
  
  if (experienceMatch && experienceMatch[1]) {
    yearsOfExperience = parseInt(experienceMatch[1], 10);
  }
  
  // Calculer un score d'expertise
  let expertScore = 0;
  
  // Points basés sur les années d'expérience
  if (yearsOfExperience >= 8) {
    expertScore += 3;
  } else if (yearsOfExperience >= 4) {
    expertScore += 2;
  } else if (yearsOfExperience >= 2) {
    expertScore += 1;
  }
  
  // Points basés sur les mots-clés d'expertise dans le CV
  expertScore += expertKeywords.filter(keyword => lowerCvContent.includes(keyword)).length * 1.5;
  expertScore += intermediateKeywords.filter(keyword => lowerCvContent.includes(keyword)).length * 0.5;
  expertScore -= juniorKeywords.filter(keyword => lowerCvContent.includes(keyword)).length * 1.5;
  
  // Points basés sur le nombre et la variété des compétences
  expertScore += skills.length > 25 ? 2 : (skills.length > 15 ? 1 : 0);
  
  // Vérifier la présence de compétences avancées
  const advancedSkills = [
    "Architecture", "Leadership", "Stratégie", "Management", "CI/CD", "DevOps", 
    "Cloud", "Microservices", "Machine Learning", "Deep Learning", "NLP", 
    "Big Data", "Hadoop", "Spark", "Kubernetes", "Infrastructure as Code"
  ];
  
  const hasAdvancedSkills = skills.some(skill => 
    advancedSkills.some(advSkill => skill.toLowerCase().includes(advSkill.toLowerCase()))
  );
  
  if (hasAdvancedSkills) {
    expertScore += 1.5;
  }
  
  // Déterminer le niveau final
  if (expertScore >= 4) {
    return "Expert";
  } else if (expertScore >= 1.5) {
    return "Intermédiaire";
  } else {
    return "Débutant";
  }
};

export const generateSimulatedCvContent = (fileName: string, firstName: string, lastName: string) => {
  const lowerFileName = fileName.toLowerCase();
  let cvTemplate = "";
  
  // Ajouter des variations basées sur des éléments aléatoires et le nom du fichier
  const seed = Date.now() % 10000; // Un nombre semi-aléatoire basé sur l'heure actuelle
  const random = (max: number) => Math.floor((seed * 9301 + 49297) % 233280) / 233280 * max;
  
  // Déterminer le domaine principal en fonction du nom du fichier
  let domainePrincipal = "general";
  
  if (lowerFileName.includes("dev") || lowerFileName.includes("cod") || lowerFileName.includes("prog")) {
    domainePrincipal = "developpement";
    const devSpecialties = ["Frontend", "Backend", "Full Stack", "Mobile", "DevOps", "Architecture", "Systèmes embarqués"];
    const frameworks = ["React", "Angular", "Vue.js", "Spring", "Django", ".NET", "Laravel"];
    const years = 3 + Math.floor(random(15));
    const specialty = devSpecialties[Math.floor(random(devSpecialties.length))];
    const framework = frameworks[Math.floor(random(frameworks.length))];
    
    cvTemplate = `
      ${lastName.toUpperCase()} ${firstName}
      Développeur ${specialty} - ${years} ans d'expérience
      
      EXPÉRIENCE PROFESSIONNELLE
      Senior Developer chez ${random(10) > 5 ? 'TechGlobal' : 'CodeWizards'} (${2023-years}-2023)
      - Développement d'applications complexes pour des clients internationaux
      - Implémentation de solutions ${framework} et architecture de systèmes
      - Gestion d'équipe de ${1+Math.floor(random(8))} développeurs
      ${random(10) > 5 ? '- Migration de systèmes legacy vers des architectures modernes' : '- Optimisation des performances et refactoring de code'}
      ${random(10) > 7 ? '- Mise en place de CI/CD et automatisation des déploiements' : '- Participation à la définition technique des projets'}
      
      ${random(10) > 5 ? 'Lead Developer' : 'Technical Consultant'} chez ${random(10) > 5 ? 'InnoSoft' : 'Digital Solutions'} (${2023-years-3}-${2023-years})
      - Conception et développement d'API et services backend
      - ${random(10) > 5 ? 'Intégration de systèmes hétérogènes' : 'Développement d\'interfaces utilisateur modernes'}
      - ${random(10) > 5 ? 'Formation des équipes junior' : 'Gestion de la relation client technique'}
      
      FORMATION
      ${random(10) > 7 ? 'Master' : 'Ingénieur'} en Informatique - ${random(10) > 5 ? 'Université de Paris' : 'École Polytechnique'} (${2000+Math.floor(random(15))})
    `;
  } else if (lowerFileName.includes("data") || lowerFileName.includes("science") || lowerFileName.includes("analy")) {
    domainePrincipal = "datascience";
    const dataSpecialties = ["Data Scientist", "Data Engineer", "ML Engineer", "Data Analyst", "Business Intelligence"];
    const tools = ["Python", "R", "TensorFlow", "PyTorch", "Hadoop", "Spark"];
    const years = 2 + Math.floor(random(10));
    const specialty = dataSpecialties[Math.floor(random(dataSpecialties.length))];
    const tool = tools[Math.floor(random(tools.length))];
    
    cvTemplate = `
      ${lastName.toUpperCase()} ${firstName}
      ${specialty} - ${years} ans d'expérience
      
      EXPÉRIENCE PROFESSIONNELLE
      Senior ${specialty} chez ${random(10) > 5 ? 'DataInsights' : 'AnalyticsPro'} (${2023-years}-2023)
      - Analyse et modélisation de données massives pour prédiction et classification
      - Développement de modèles de machine learning pour ${random(10) > 5 ? 'détection de fraude' : 'segmentation client'}
      - Utilisation avancée de ${tool} et écosystème data
      ${random(10) > 5 ? '- Conception de pipelines ETL et data engineering' : '- Visualisation avancée de données complexes'}
      
      ${random(10) > 5 ? 'Data Analyst' : 'BI Specialist'} chez ${random(10) > 5 ? 'InsightCorp' : 'DataViz'} (${2023-years-3}-${2023-years})
      - Création de tableaux de bord et rapports analytiques
      - ${random(10) > 5 ? 'Extraction et transformation de données complexes' : 'Analyse prédictive et segmentation'}
      
      FORMATION
      ${random(10) > 7 ? 'Master' : 'Ingénieur'} en ${random(10) > 5 ? 'Science des Données' : 'Mathématiques Appliquées'} - ${random(10) > 5 ? 'ENSAE' : 'École des Mines'} (${2000+Math.floor(random(15))})
    `;
  } else if (lowerFileName.includes("design") || lowerFileName.includes("ui") || lowerFileName.includes("ux")) {
    domainePrincipal = "design";
    const designSpecialties = ["UI Designer", "UX Designer", "Product Designer", "Web Designer", "Interaction Designer"];
    const tools = ["Figma", "Sketch", "Adobe XD", "Adobe Creative Suite", "InVision"];
    const years = 2 + Math.floor(random(12));
    const specialty = designSpecialties[Math.floor(random(designSpecialties.length))];
    const tool = tools[Math.floor(random(tools.length))];
    
    cvTemplate = `
      ${lastName.toUpperCase()} ${firstName}
      ${specialty} - ${years} ans d'expérience
      
      EXPÉRIENCE PROFESSIONNELLE
      Senior ${specialty} chez ${random(10) > 5 ? 'DesignStudio' : 'CreativeMinds'} (${2023-years}-2023)
      - Conception d'interfaces utilisateur et expérience utilisateur pour applications web et mobile
      - Direction artistique et création d'identités visuelles
      - Expertise en ${tool} et méthodologies de design thinking
      ${random(10) > 5 ? '- Animation d\'ateliers de co-création avec les clients' : '- Prototypage haute fidélité et tests utilisateurs'}
      
      ${random(10) > 5 ? 'UI Designer' : 'Web Designer'} chez ${random(10) > 5 ? 'PixelPerfect' : 'WebAgency'} (${2023-years-2}-${2023-years})
      - Création de maquettes et prototypes interactifs
      - ${random(10) > 5 ? 'Collaboration avec les équipes de développement' : 'Design systems et composants réutilisables'}
      
      FORMATION
      ${random(10) > 7 ? 'Bachelor' : 'Master'} en ${random(10) > 5 ? 'Design Numérique' : 'Arts Graphiques'} - ${random(10) > 5 ? 'ESAG Penninghen' : 'Gobelins'} (${2000+Math.floor(random(15))})
    `;
  } else {
    // CV générique avec plus de variations
    const genericRoles = [
      "Chef de Projet", "Consultant", "Business Analyst", "Product Owner", 
      "Responsable Marketing", "Responsable Commercial", "Chargé de Communication",
      "Gestionnaire de Contenu", "Responsable Qualité", "Coordinateur de Projets"
    ];
    const companies = [
      "Global Solutions", "Innovate Corp", "Consult & Co", "Business Experts", 
      "Strategy Partners", "Future Group", "Elite Consulting", 
      "NextGen Solutions", "Prime Advisors", "Smart Business"
    ];
    const years = 3 + Math.floor(random(15));
    const role = genericRoles[Math.floor(random(genericRoles.length))];
    const company = companies[Math.floor(random(companies.length))];
    
    cvTemplate = `
      ${lastName.toUpperCase()} ${firstName}
      ${role} - ${years} ans d'expérience
      
      EXPÉRIENCE PROFESSIONNELLE
      ${role} Senior chez ${company} (${2023-years}-2023)
      - Gestion de projets stratégiques et coordination des équipes
      - ${random(10) > 5 ? 'Analyse des besoins clients et définition des solutions' : 'Pilotage de la transformation digitale des clients'}
      - ${random(10) > 5 ? 'Élaboration et suivi des plans d\'action' : 'Conseil et accompagnement des décideurs'}
      ${random(10) > 5 ? '- Conduite du changement et formation des utilisateurs' : '- Optimisation des processus métier'}
      
      ${random(10) > 5 ? 'Consultant Junior' : 'Analyste'} chez ${random(10) > 5 ? 'Tech Advisors' : 'Business Solutions'} (${2023-years-4}-${2023-years})
      - ${random(10) > 5 ? 'Support aux équipes projet et analyses fonctionnelles' : 'Études de marché et veille concurrentielle'}
      - ${random(10) > 5 ? 'Rédaction de spécifications et documentation' : 'Participation aux ateliers client et recueil des besoins'}
      
      FORMATION
      ${random(10) > 6 ? 'Master' : random(10) > 3 ? 'MBA' : 'Bachelor'} en ${random(10) > 5 ? 'Management' : 'Gestion de Projet'} - ${random(10) > 5 ? 'HEC Paris' : 'ESSEC'} (${2000+Math.floor(random(15))})
    `;
  }
  
  // Ajouter une section compétences techniques qui variera selon le domaine principal
  cvTemplate += `\n\nCOMPÉTENCES TECHNIQUES\n`;
  
  // Ajouter des langues parlées
  const langues = ["Français (natif)", "Anglais (courant)"];
  if (random(10) > 6) langues.push("Espagnol (intermédiaire)");
  if (random(10) > 8) langues.push("Allemand (notions)");
  if (random(10) > 9) langues.push(random(10) > 5 ? "Italien (intermédiaire)" : "Portugais (notions)");
  
  cvTemplate += `\nLANGUES\n${langues.join(", ")}`;
  
  // Ajouter des éléments de personnalisation supplémentaires basés sur le fichier
  if (lowerFileName.includes("junior") || lowerFileName.includes("stage") || lowerFileName.includes("internship")) {
    cvTemplate = cvTemplate.replace(/Senior/g, "Junior");
    cvTemplate = cvTemplate.replace(/\d+-\d+ ans d'expérience/g, "1-2 ans d'expérience");
  } else if (lowerFileName.includes("senior") || lowerFileName.includes("expert") || lowerFileName.includes("lead")) {
    cvTemplate = cvTemplate.replace(/Junior/g, "Senior");
    if (!cvTemplate.includes("Senior")) {
      cvTemplate = cvTemplate.replace(/\d+ ans d'expérience/g, `${7 + Math.floor(random(10))} ans d'expérience`);
    }
  }
  
  return {
    content: cvTemplate,
    domainePrincipal: domainePrincipal
  };
};
