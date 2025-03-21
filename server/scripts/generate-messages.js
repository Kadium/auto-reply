const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Path to messages file
const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');

// Sample message templates
const messageTemplates = [
  {
    type: 'livraison',
    subjects: [
      'Où est mon colis ?',
      'Retard de livraison',
      'Colis non reçu',
      "Problème d'expédition",
      'Commande #123456 non livrée',
    ],
  },
  {
    type: 'localisation_colis',
    subjects: [
      'Localisation de mon colis',
      'Suivi de ma commande #3928',
      'Où se trouve mon colis expédié hier ?',
      'Statut de ma livraison en cours',
      'Tracking de mon colis urgent',
    ],
  },
  {
    type: 'information',
    subjects: [
      "Demande d'information sur vos produits",
      'Question sur vos services',
      'Besoin de plus de détails',
      'Demande de renseignements',
      'Question rapide',
    ],
  },
  {
    type: 'remboursement',
    subjects: [
      'Demande de remboursement',
      'Annulation de ma commande',
      'Retour produit',
      'Demande de remboursement',
      'Annulation de commande',
    ],
  },
  {
    type: 'support_technique',
    subjects: [
      'Site web qui ne fonctionne pas',
      "Problème avec l'application",
      'Problème technique',
      'Problème de connexion',
      "Message d'erreur",
    ],
  },
];

// Messages prédéfinis pour les demandes de localisation avec numéro de suivi
const predefinedLocationMessages = [
  "Bonjour, j'ai commandé un produit il y a 3 jours (commande #45920) et j'aimerais savoir où se trouve mon colis actuellement ? Mon numéro de suivi est TRK12345678.",
  'Pourriez-vous me dire où en est ma livraison avec le numéro de suivi FR123456789FR ?',
  'Je souhaite connaître la position exacte de mon colis avec le numéro de tracking 987654321234.',
  "Bonjour, j'attends une livraison importante et urgente. Pourriez-vous me dire où se trouve mon colis #12345 et quand il sera livré ?",
  'Quel est le statut de ma commande #23589 avec numéro de suivi BE9876543210BE ?',
];

// Messages prédéfinis pour les demandes de localisation sans numéro de suivi
const locationMessagesWithoutTracking = [
  "Bonjour, pourriez-vous me dire où se trouve ma commande ? Je l'ai passée il y a 5 jours et je n'ai toujours rien reçu.",
  "J'ai effectué un achat la semaine dernière et je voudrais savoir où en est mon colis. C'est assez urgent.",
  "Bonjour, savez-vous quand mon colis sera livré ? Je l'attends depuis plusieurs jours.",
  "Pouvez-vous me donner des informations sur la localisation de mon colis ? Je dois m'absenter bientôt.",
  "J'aimerais suivre mon colis, comment puis-je faire ? Je n'ai pas reçu d'email avec un numéro de suivi.",
];

// Sender names
const senders = [
  'Jean Dupont',
  'Sophie Martin',
  'Michel Bernard',
  'Émilie Dubois',
  'David Lambert',
  'Julie Thomas',
  'Robert Petit',
  'Amanda Blanc',
  'Thomas Moreau',
  'Jennifer Leroy',
];

// Function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate content using OpenAI
async function generateContent(type, subject) {
  // Ne pas appliquer la logique spéciale pour localisation_colis ici
  // car c'est traité séparément dans generateLocationMessage
  try {
    const prompt = `Écris un message de client fictif en français pour un service client. 
    
Le type de message est "${type}" et le sujet est "${subject}".

Le message doit être réaliste, entre 2 et 5 phrases, sans introduction ni signature. 
Utilise un ton naturel comme si un vrai client écrivait à un service client.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    return `Message concernant ${subject}. Ceci est un message généré automatiquement car OpenAI n'a pas pu être contacté.`;
  }
}

// Function to generate a random message
async function generateRandomMessage(id) {
  const template = getRandomItem(messageTemplates);
  const sender = getRandomItem(senders);
  const subject = getRandomItem(template.subjects);
  const content = await generateContent(template.type, subject);

  return {
    id,
    sender,
    subject,
    content,
    timestamp: new Date().toISOString(),
    type: template.type, // Ajouter explicitement le type
  };
}

// Function to generate a test message specifically for location tracking
async function generateLocationMessage(id) {
  const template = messageTemplates.find((t) => t.type === 'localisation_colis');
  if (!template) {
    console.error("Template 'localisation_colis' not found");
    // Fallback to a random template
    return generateRandomMessage(id);
  }

  const sender = getRandomItem(senders);
  const subject = getRandomItem(template.subjects);

  // Décider aléatoirement d'inclure un numéro de suivi ou non (50/50)
  const includeTrackingNumber = Math.random() < 0.5;
  const content = includeTrackingNumber
    ? getRandomItem(predefinedLocationMessages)
    : getRandomItem(locationMessagesWithoutTracking);

  return {
    id,
    sender,
    subject,
    content,
    timestamp: new Date().toISOString(),
    type: 'localisation_colis', // Ajouter le type pour la clarté
  };
}

// Main function to generate messages
async function generateMessages(count = 5) {
  let messages = [];

  // Read existing messages if file exists
  if (fs.existsSync(messagesPath)) {
    try {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    } catch (error) {
      console.error('Error reading existing messages:', error);
      messages = [];
    }
  }

  // Find the highest existing ID
  const highestId = messages.length > 0 ? Math.max(...messages.map((msg) => msg.id)) : 0;

  // NOUVELLE APPROCHE SIMPLIFIÉE
  // 1. Créer un tableau avec tous les types disponibles
  let allTypes = messageTemplates.map((t) => t.type);
  console.log('Types disponibles:', allTypes);

  // 2. Générer des messages avec chaque type un par un
  const newMessages = [];

  for (let i = 0; i < count; i++) {
    // Sélectionner un type au hasard - distribution totalement aléatoire
    const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
    console.log(`Message ${i + 1}/${count} - Type sélectionné: ${randomType}`);

    let newMessage;

    if (randomType === 'localisation_colis') {
      // Cas spécial pour les messages de localisation
      newMessage = await generateLocationMessage(highestId + i + 1);
    } else {
      // Pour tous les autres types
      const template = messageTemplates.find((t) => t.type === randomType);
      const sender = getRandomItem(senders);
      const subject = getRandomItem(template.subjects);

      console.log(`Génération de contenu pour le type: ${randomType}, sujet: ${subject}`);
      const content = await generateContent(randomType, subject);

      newMessage = {
        id: highestId + i + 1,
        sender,
        subject,
        content,
        timestamp: new Date().toISOString(),
        type: randomType,
      };
    }

    console.log(`Message généré (ID: ${newMessage.id}): ${newMessage.subject} - Type: ${newMessage.type}`);
    newMessages.push(newMessage);
  }

  // Combine existing and new messages
  const updatedMessages = [...messages, ...newMessages];

  // Ensure data directory exists
  const dataDir = path.dirname(messagesPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(messagesPath, JSON.stringify(updatedMessages, null, 2));

  // Log des types générés
  const typesSummary = newMessages.reduce((acc, msg) => {
    acc[msg.type] = (acc[msg.type] || 0) + 1;
    return acc;
  }, {});

  console.log('Résumé des types générés:', typesSummary);
  console.log(`Généré ${newMessages.length} nouveaux messages. Total messages: ${updatedMessages.length}`);

  return updatedMessages;
}

// If script is run directly
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 3;
  generateMessages(count);
}

module.exports = generateMessages;
