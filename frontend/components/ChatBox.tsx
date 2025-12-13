'use client';

import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderType: 'doctor' | 'patient';
  senderName: string;
  message: string;
  createdAt: string;
}

interface ChatBoxProps {
  socket: Socket;
  consultationId: string;
  userType: 'doctor' | 'patient';
  userName: string;
  initialMessages?: Message[];
}

export default function ChatBox({
  socket,
  consultationId,
  userType,
  userName,
  initialMessages = [],
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    socket.on('receive-message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for typing indicators
    socket.on('user-typing', () => {
      setOtherUserTyping(true);
    });

    socket.on('user-stop-typing', () => {
      setOtherUserTyping(false);
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [socket]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { consultationId, userType, userName });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', { consultationId });
    }, 1000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Emit message to server
    socket.emit('send-message', {
      consultationId,
      senderType: userType,
      senderName: userName,
      message: newMessage.trim(),
    });

    setNewMessage('');
    setIsTyping(false);
    socket.emit('stop-typing', { consultationId });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Chat Consultation</h3>
        <p className="text-xs text-gray-500">Real-time messaging</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === userType ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderType === userType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.senderType !== userType && (
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
                )}
                <p className="break-words">{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderType === userType ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
