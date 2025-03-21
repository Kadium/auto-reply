import React from 'react';

function Sidebar({ messages, selectedMessage, onSelectMessage, isLoading }) {
  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="w-80 bg-base-200 overflow-y-auto flex-shrink-0 border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Inbox</h2>
        <p className="text-sm text-gray-500">{messages.length} unread messages</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="loading loading-spinner loading-md"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No messages</p>
          <p className="text-sm mt-2">Generate test messages to get started</p>
        </div>
      ) : (
        <ul className="divide-y">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`p-3 hover:bg-base-300 cursor-pointer transition-colors ${
                selectedMessage?.id === message.id ? 'bg-base-300' : ''
              }`}
              onClick={() => onSelectMessage(message)}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm truncate">{message.sender}</span>
                <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
              </div>
              <div className="font-semibold text-sm mt-1 truncate">{message.subject}</div>
              <div className="text-xs text-gray-600 mt-1 truncate">{message.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Sidebar;
