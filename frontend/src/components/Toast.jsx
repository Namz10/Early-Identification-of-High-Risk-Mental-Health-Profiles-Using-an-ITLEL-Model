import React, { useEffect, useState } from 'react';

const Toast = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleForbidden = (e) => {
      addMessage('error', e.detail);
    };
    const handleServerError = (e) => {
      addMessage('warning', e.detail);
    };

    window.addEventListener('api:forbidden', handleForbidden);
    window.addEventListener('api:server-error', handleServerError);
    return () => {
      window.removeEventListener('api:forbidden', handleForbidden);
      window.removeEventListener('api:server-error', handleServerError);
    };
  }, []);

  const addMessage = (type, text) => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 5000);
  };

  if (!messages.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`px-4 py-3 text-sm border ${
            m.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
};

export default Toast;
