import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoReplyContent, setAutoReplyContent] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  // Fetch messages from API
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/messages');
      setMessages(response.data);

      // Select the first message if there is one and none is currently selected
      if (response.data.length > 0 && !selectedMessage) {
        setSelectedMessage(response.data[0]);
      } else if (selectedMessage) {
        // If a message was selected, make sure it still exists
        const stillExists = response.data.find((msg) => msg.id === selectedMessage.id);
        if (!stillExists) {
          setSelectedMessage(response.data.length > 0 ? response.data[0] : null);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate test messages
  const generateTestMessages = async (count = 5) => {
    try {
      await axios.post('/api/generate-messages', { count });
      fetchMessages();
    } catch (error) {
      console.error('Error generating test messages:', error);
    }
  };

  // Generate auto-reply
  const generateAutoReply = async () => {
    if (!selectedMessage) return;

    setIsGeneratingReply(true);
    try {
      const response = await axios.post('/api/auto-reply', {
        message: selectedMessage,
      });

      if (response.data.matchedType !== 'none' && response.data.confidence > 0.7) {
        setAutoReplyContent(response.data.response);
      } else {
        setAutoReplyContent('No suitable template found for this message. Please compose a manual response.');
      }
    } catch (error) {
      console.error('Error generating auto-reply:', error);
      setAutoReplyContent('Error generating auto-reply. Please try again later.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // Delete a message (when it's been responded to)
  const deleteMessage = async (id) => {
    try {
      await axios.delete(`/api/messages/${id}`);

      // Update messages list
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== id));

      // If the deleted message was selected, select the first message from the remaining ones
      if (selectedMessage && selectedMessage.id === id) {
        const updatedMessages = messages.filter((msg) => msg.id !== id);
        setSelectedMessage(updatedMessages.length > 0 ? updatedMessages[0] : null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();

    // Refresh messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-primary text-white shadow-lg">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Auto-Reply POC</h1>
              <button className="btn btn-accent btn-sm" onClick={() => generateTestMessages(3)}>
                Generate Test Messages
              </button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <Sidebar
            messages={messages}
            selectedMessage={selectedMessage}
            onSelectMessage={setSelectedMessage}
            isLoading={isLoading}
          />

          <Editor
            message={selectedMessage}
            autoReplyContent={autoReplyContent}
            onGenerateReply={generateAutoReply}
            onSubmitReply={() => selectedMessage && deleteMessage(selectedMessage.id)}
            isGeneratingReply={isGeneratingReply}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
