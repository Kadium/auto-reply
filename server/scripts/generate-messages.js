const fs = require('fs');
const path = require('path');

// Path to messages file
const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');

// Sample message templates
const messageTemplates = [
  {
    type: 'delivery',
    subjects: [
      'Where is my package?',
      'Delivery delay',
      'Package not received',
      'Shipping issue',
      'Order #123456 not delivered',
    ],
    contents: [
      "I ordered a product last week and still haven't received it. Can you check the status?",
      "My order was supposed to arrive yesterday but I haven't received any updates. Can you help?",
      "I'm still waiting for my package that was supposed to be delivered 3 days ago. What's going on?",
      "I need to know when my order will be delivered. It's been a week since I placed it.",
      "My tracking number doesn't show any updates for days. Is my package lost?",
    ],
  },
  {
    type: 'information',
    subjects: [
      'Product information request',
      'Question about your services',
      'More details needed',
      'Information inquiry',
      'Quick question',
    ],
    contents: [
      "I'd like to know more about your product range. Do you have a catalog you can send me?",
      "Can you tell me more about the services you offer? I'm particularly interested in...",
      "I'm considering your product but need some additional information before deciding.",
      "What's the difference between your basic and premium plans?",
      'Do you offer customization options for your products?',
    ],
  },
  {
    type: 'refund',
    subjects: ['Refund request', 'Cancel my order', 'Return product', 'Money back request', 'Order cancellation'],
    contents: [
      'I want to return the product I purchased last week. How do I get a refund?',
      'I need to cancel my recent order before it ships. Can you process a refund?',
      "The item I received is damaged. I'd like to return it for a full refund.",
      "I've changed my mind about my purchase and would like my money back.",
      'Please cancel order #123456 and refund my payment.',
    ],
  },
  {
    type: 'technical_support',
    subjects: ['Website not working', 'App crash issue', 'Technical problem', 'Login issue', 'Error message'],
    contents: [
      'I can\'t log into my account. It keeps saying "invalid credentials" even though I\'m sure my password is correct.',
      'Your app keeps crashing whenever I try to open the profile section. Can you fix this?',
      'I\'m getting an error message when trying to complete my purchase. It says "Transaction failed".',
      "The download button on your website isn't working for me. Nothing happens when I click it.",
      "Your mobile site isn't displaying properly on my phone. The text is overlapping and I can't read it.",
    ],
  },
  {
    type: 'feedback',
    subjects: [
      'Product feedback',
      'Suggestion for improvement',
      'My experience with your service',
      'Website feedback',
      'App review',
    ],
    contents: [
      "I've been using your product for a month now and I think it would be better if you added...",
      'Your service is good, but it could be improved by making the checkout process simpler.',
      'I love your app but wish it had dark mode. Would you consider adding this feature?',
      'The new website design is confusing. It was easier to navigate before the update.',
      'Your customer service team was excellent, but the product quality could be better.',
    ],
  },
];

// Sender names
const senders = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'David Wilson',
  'Jessica Thompson',
  'Robert Taylor',
  'Amanda White',
  'Thomas Anderson',
  'Jennifer Martinez',
];

// Function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate a random message
function generateRandomMessage(id) {
  const template = getRandomItem(messageTemplates);
  const sender = getRandomItem(senders);
  const subject = getRandomItem(template.subjects);
  const content = getRandomItem(template.contents);

  return {
    id,
    sender,
    subject,
    content,
    timestamp: new Date().toISOString(),
  };
}

// Main function to generate messages
function generateMessages(count = 5) {
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

  // Generate new messages
  const newMessages = [];
  for (let i = 1; i <= count; i++) {
    newMessages.push(generateRandomMessage(highestId + i));
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

  console.log(`Generated ${count} new messages. Total messages: ${updatedMessages.length}`);
  return updatedMessages;
}

// If script is run directly
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 5;
  generateMessages(count);
}

module.exports = generateMessages;
