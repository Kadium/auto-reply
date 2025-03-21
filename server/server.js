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
app.post('/api/generate-messages', (req, res) => {
  try {
    const count = req.body.count || 5;
    const messages = generateMessages(count);
    res.json({ success: true, count, totalMessages: messages.length });
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

    // Create prompt for OpenAI
    const prompt = `You are an assistant tasked with determining if the following message matches one of these response templates:
    
${JSON.stringify(templates, null, 2)}

The message is:
${message.content}

Please determine the most relevant template type and return a JSON with:
1. "matchedType": The template type that matches best (or "none" if no good match)
2. "confidence": A number between 0 and 1 indicating your confidence
3. "response": The response from the template, slightly personalized to address the specific message if needed

Format the response as valid JSON.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const responseData = JSON.parse(completion.choices[0].message.content);
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
