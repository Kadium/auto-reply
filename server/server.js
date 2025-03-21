require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const generateMessages = require('./scripts/generate-messages');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Path to messages and templates
const messagesPath = path.join(__dirname, 'data', 'messages.json');
const templatesPath = path.join(__dirname, 'templates', 'templates.json');

// Get all messages
app.get('/api/messages', (req, res) => {
  try {
    if (!fs.existsSync(messagesPath)) {
      return res.json([]);
    }

    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    res.json(messages);
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: 'Failed to read messages' });
  }
});

// Get message by ID
app.get('/api/messages/:id', (req, res) => {
  try {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    const message = messages.find((msg) => msg.id === parseInt(req.params.id));

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error reading message:', error);
    res.status(500).json({ error: 'Failed to read message' });
  }
});

// Generate test messages
app.post('/api/generate-messages', async (req, res) => {
  try {
    const count = req.body.count || 5;
    // Nous n'utilisons plus includeLocationMessage car tous les types sont désormais aléatoires
    const messages = await generateMessages(count);

    // Réponse avec les statistiques des types générés
    const typeStats = messages.reduce((acc, msg) => {
      if (msg.type) {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      count,
      totalMessages: messages.length,
      typeStats, // Ajouter les statistiques des types
    });
  } catch (error) {
    console.error('Error generating messages:', error);
    res.status(500).json({ error: 'Failed to generate messages' });
  }
});

// Generate auto-reply
app.post('/api/auto-reply', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Read templates
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

    // Vérifier si le message contient un numéro de suivi pour le template de localisation
    let trackingNumber = null;
    const locationTemplate = templates.find((t) => t.type === 'localisation_colis');

    // Vérifier si le message concerne une demande de localisation en général
    let isLocationRequest = false;
    const locationKeywords = locationTemplate ? locationTemplate.keywords : [];

    // Vérifier si le message contient des mots-clés de localisation
    for (const keyword of locationKeywords) {
      if (message.content.toLowerCase().includes(keyword.toLowerCase())) {
        isLocationRequest = true;
        break;
      }
    }

    if (locationTemplate && locationTemplate.requires_tracking_number) {
      // Chercher un pattern de numéro de suivi dans le message (contenu ET sujet)
      const patterns = locationTemplate.tracking_patterns || [];

      // Tableau des textes à vérifier (contenu et sujet)
      const textsToCheck = [message.content];
      if (message.subject) {
        textsToCheck.push(message.subject);
      }

      // Vérifier chaque texte
      for (const textToCheck of textsToCheck) {
        // Si on a déjà trouvé un numéro, on s'arrête
        if (trackingNumber) break;

        // Essayer chaque pattern sur le texte actuel
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'i');
          const match = textToCheck.match(regex);
          if (match) {
            trackingNumber = match[0];
            console.log(
              `Numéro de suivi trouvé: ${trackingNumber} dans ${textToCheck === message.content ? 'contenu' : 'sujet'}`
            );
            break;
          }
        }
      }
    }

    // Create prompt for OpenAI
    const prompt = `You are an assistant tasked with determining if the following message matches one of these response templates:
    
${JSON.stringify(templates, null, 2)}

The message is:
Subject: ${message.subject || 'No Subject'}
Content: ${message.content}

Please determine the most relevant template type and return a JSON with:
1. "matchedType": The template type that matches best (or "none" if no good match)
2. "confidence": A number between 0 and 1 indicating your confidence
3. "response": The response from the template, slightly personalized to address the specific message if needed

Important rules:
- If the matchedType is "localisation_colis", only use it if a tracking number is detected in the message subject or content.
- If the message is about tracking or locating a package but no tracking number is found, use the "demande_tracking" template instead.
- If a tracking number is detected, include it in the response by replacing {tracking_number} with the actual tracking number.
- If the message doesn't match any template category or the confidence is very low (below 0.5), set matchedType to "none".
${
  trackingNumber
    ? `- Found tracking number: ${trackingNumber} in the message.`
    : '- No tracking number was found in the message.'
}
${isLocationRequest ? '- This message appears to be about package tracking or location.' : ''}

Format the response as valid JSON.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    let responseData = JSON.parse(completion.choices[0].message.content);

    // Vérifier si c'est une demande de localisation mais sans numéro de suivi
    if (responseData.matchedType === 'localisation_colis' && !trackingNumber) {
      // Utiliser le template demande_tracking au lieu de livraison
      responseData.matchedType = 'demande_tracking';
      responseData.response = templates.find((t) => t.type === 'demande_tracking').response;
    }

    // Si OpenAI n'a pas détecté que c'est une demande de localisation mais que nos règles le détectent
    if (
      isLocationRequest &&
      !trackingNumber &&
      responseData.matchedType !== 'localisation_colis' &&
      responseData.matchedType !== 'demande_tracking'
    ) {
      // Vérifier si la confiance est faible
      if (responseData.confidence < 0.8) {
        // Remplacer par demande_tracking
        responseData.matchedType = 'demande_tracking';
        responseData.response = templates.find((t) => t.type === 'demande_tracking').response;
      }
    }

    // Insérer le numéro de suivi dans la réponse si présent
    if (responseData.matchedType === 'localisation_colis' && trackingNumber) {
      responseData.response = responseData.response.replace('{tracking_number}', trackingNumber);
    }

    // Gérer le cas où aucun template ne correspond
    if (responseData.matchedType === 'none' || responseData.confidence < 0.5) {
      responseData.matchedType = 'default';
      responseData.response =
        "Merci pour votre message. Nous l'avons bien reçu et notre équipe l'examinera dans les plus brefs délais. Pour tout besoin urgent, n'hésitez pas à nous contacter directement par téléphone. Nous vous remercions de votre patience et de votre compréhension.";
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error generating auto-reply:', error);
    res.status(500).json({ error: 'Failed to generate auto-reply' });
  }
});

// Delete a message
app.delete('/api/messages/:id', (req, res) => {
  try {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    const updatedMessages = messages.filter((msg) => msg.id !== parseInt(req.params.id));

    fs.writeFileSync(messagesPath, JSON.stringify(updatedMessages, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
