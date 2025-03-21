import React, { useState, useEffect } from 'react';

function Editor({ message, autoReplyContent, onGenerateReply, onSubmitReply, isGeneratingReply }) {
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Update reply content when autoReplyContent changes
  useEffect(() => {
    if (autoReplyContent) {
      setReplyContent(autoReplyContent);
    }
  }, [autoReplyContent]);

  // Clear the reply when the selected message changes
  useEffect(() => {
    setReplyContent('');
  }, [message?.id]);

  const handleSendReply = async () => {
    if (!message || !replyContent.trim()) return;

    setIsSending(true);

    try {
      // In a real app, you'd send the reply to the API here
      // For this POC, we just wait a bit to simulate sending
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Call the onSubmitReply prop to mark the message as handled
      onSubmitReply();

      // Clear the reply content
      setReplyContent('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-medium">Aucun message sélectionné</h3>
          <p className="mt-2">Sélectionnez un message dans la barre latérale ou générez des messages de test</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Message header */}
      <div className="p-4 border-b bg-[#E9C46A]/10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#264653]">{message.subject}</h2>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          De: <span className="font-medium">{message.sender}</span>
        </div>
      </div>

      {/* Message content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="prose max-w-none">
          <p>{message.content}</p>
        </div>
      </div>

      {/* Reply section */}
      <div className="p-4 bg-[#F5F7F9] border-t">
        <div className="flex mb-2 justify-between">
          <h3 className="text-lg font-medium text-[#264653]">Votre Réponse</h3>
          <button
            className="btn bg-[#2A9D8F] hover:bg-[#264653] text-white border-none btn-sm"
            onClick={onGenerateReply}
            disabled={isGeneratingReply}
          >
            {isGeneratingReply ? (
              <>
                <div className="loading loading-spinner loading-xs mr-1"></div>
                Génération...
              </>
            ) : (
              'Réponse Auto'
            )}
          </button>
        </div>

        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Écrivez votre réponse ici..."
          className="textarea border-[#2A9D8F]/30 focus:border-[#2A9D8F] w-full h-32 mb-3"
          disabled={isGeneratingReply}
        ></textarea>

        <div className="flex justify-end">
          <button
            className="btn bg-[#E76F51] hover:bg-[#F4A261] text-white border-none"
            onClick={handleSendReply}
            disabled={!replyContent.trim() || isSending}
          >
            {isSending ? (
              <>
                <div className="loading loading-spinner loading-xs mr-1"></div>
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Editor;
