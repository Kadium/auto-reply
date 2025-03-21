import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoReplyContent, setAutoReplyContent] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isGeneratingMessages, setIsGeneratingMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  // Fetch messages from API - wrapped in useCallback to prevent infinite loops
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/messages');
      setMessages(response.data);
      setMessageCount(response.data.length);

      // Vérifier si la liste des messages existe
      if (response.data.length > 0) {
        if (!selectedMessage) {
          // Si aucun message n'est sélectionné, sélectionner le premier
          setSelectedMessage(response.data[0]);
        } else {
          // Si un message est déjà sélectionné, vérifier s'il existe toujours dans la liste
          const stillExists = response.data.find((msg) => msg.id === selectedMessage.id);
          if (!stillExists) {
            // Si le message n'existe plus, sélectionner le premier message
            setSelectedMessage(response.data[0]);
          } else {
            // Si le message existe toujours, garder la même sélection sans la modifier
            const updatedMessage = response.data.find((msg) => msg.id === selectedMessage.id);
            // Mise à jour avec les données les plus récentes sans changer la sélection
            setSelectedMessage(updatedMessage);
          }
        }
      } else {
        // Aucun message dans la liste
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMessage]);

  // Generate a single test message
  const generateTestMessage = async () => {
    if (isGeneratingMessages) return;

    setIsGeneratingMessages(true);
    try {
      // Générer un seul message
      await axios.post('/api/generate-messages', { count: 1 });

      // Vérifier si le message a été ajouté
      let attempts = 0;
      const maxAttempts = 3;

      const checkForNewMessage = async () => {
        attempts++;
        try {
          const response = await axios.get('/api/messages');

          // Vérifier si un nouveau message a été ajouté
          if (response.data.length > messageCount || attempts >= maxAttempts) {
            setMessages(response.data);
            setMessageCount(response.data.length);

            // Sélectionner le nouveau message
            if (response.data.length > 0) {
              // Trouver le message le plus récent
              const newestMessage = response.data.reduce((newest, current) => {
                const newestDate = new Date(newest.timestamp);
                const currentDate = new Date(current.timestamp);
                return currentDate > newestDate ? current : newest;
              }, response.data[0]);

              setSelectedMessage(newestMessage);
            }

            setIsGeneratingMessages(false);
          } else if (attempts < maxAttempts) {
            // Réessayer après un délai
            setTimeout(checkForNewMessage, 1000);
          } else {
            setIsGeneratingMessages(false);
          }
        } catch (error) {
          console.error('Error fetching messages during retry:', error);
          setIsGeneratingMessages(false);
        }
      };

      // Premier essai après 1 seconde
      setTimeout(checkForNewMessage, 1000);
    } catch (error) {
      console.error('Error generating test message:', error);
      setIsGeneratingMessages(false);
    }
  };

  // Generate auto-reply
  const generateAutoReply = async () => {
    if (!selectedMessage) return;

    setIsGeneratingReply(true);
    setAutoReplyContent(''); // Réinitialiser le contenu avant de générer

    try {
      const response = await axios.post('/api/auto-reply', {
        message: selectedMessage,
      });

      console.log('Auto-reply response:', response.data); // Log pour déboguer

      // Vérifier si la réponse contient les données attendues
      if (response.data && typeof response.data === 'object') {
        // Cas 1: Type spécifique identifié avec bonne confiance
        if (response.data.matchedType !== 'none' && response.data.confidence > 0.7 && response.data.response) {
          setAutoReplyContent(response.data.response);
        }
        // Cas 2: Type identifié mais confiance moyenne - accepter quand même
        else if (response.data.matchedType !== 'none' && response.data.confidence > 0.4 && response.data.response) {
          setAutoReplyContent(
            response.data.response +
              '\n\n(Note: Cette réponse a été générée avec un niveau de confiance modéré, veuillez la vérifier.)'
          );
        }
        // Cas 3: Type default (fallback)
        else if (response.data.matchedType === 'default' && response.data.response) {
          setAutoReplyContent(response.data.response);
        }
        // Cas 4: Aucun match approprié
        else {
          setAutoReplyContent(
            'Aucun modèle de réponse adapté trouvé pour ce message. Veuillez composer une réponse manuelle.'
          );
        }
      } else {
        // Format de réponse inattendu
        setAutoReplyContent('Format de réponse inattendu. Veuillez composer une réponse manuelle.');
      }
    } catch (error) {
      console.error('Error generating auto-reply:', error);
      setAutoReplyContent('Erreur lors de la génération de la réponse automatique. Veuillez réessayer plus tard.');
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
      setMessageCount((prev) => prev - 1);

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
  }, []);

  return (
    <div className="flex h-screen bg-[#F4F6F8]">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-[#264653] text-white shadow-lg">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">POC Réponse Automatique</h1>
              <button
                className="btn bg-[#E9C46A] hover:bg-[#F4A261] text-[#264653] border-none btn-sm"
                onClick={generateTestMessage}
                disabled={isGeneratingMessages}
              >
                {isGeneratingMessages ? (
                  <>
                    <div className="loading loading-spinner loading-xs mr-1"></div>
                    Génération...
                  </>
                ) : (
                  'Générer un message de test'
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <Sidebar
            messages={messages}
            selectedMessage={selectedMessage}
            onSelectMessage={setSelectedMessage}
            isLoading={isLoading || isGeneratingMessages}
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
