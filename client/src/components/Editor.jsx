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
      <div className="flex-1 flex items-center justify-center bg-base-100 p-6">
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-medium">No message selected</h3>
          <p className="mt-2">Select a message from the sidebar or generate test messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-base-100">
      {/* Message header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{message.subject}</h2>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          From: <span className="font-medium">{message.sender}</span>
        </div>
      </div>

      {/* Message content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="prose max-w-none">
          <p>{message.content}</p>
        </div>
      </div>

      {/* Reply section */}
      <div className="p-4 bg-base-200 border-t">
        <div className="flex mb-2 justify-between">
          <h3 className="text-lg font-medium">Your Reply</h3>
          <button className="btn btn-primary btn-sm" onClick={onGenerateReply} disabled={isGeneratingReply}>
            {isGeneratingReply ? (
              <>
                <div className="loading loading-spinner loading-xs mr-1"></div>
                Generating...
              </>
            ) : (
              'Auto-Reply'
            )}
          </button>
        </div>

        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write your reply here..."
          className="textarea textarea-bordered w-full h-32 mb-3"
          disabled={isGeneratingReply}
        ></textarea>

        <div className="flex justify-end">
          <button className="btn btn-success" onClick={handleSendReply} disabled={!replyContent.trim() || isSending}>
            {isSending ? (
              <>
                <div className="loading loading-spinner loading-xs mr-1"></div>
                Sending...
              </>
            ) : (
              'Send Reply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Editor;
