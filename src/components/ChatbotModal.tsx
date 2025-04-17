import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotModalProps {
  onClose: () => void;
}

const USER_AVATAR = "https://media.licdn.com/dms/image/v2/C4D03AQFeoCy8EGu4oQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1557516603602?e=1750291200&v=beta&t=n9qG71O96VCcBGbBBi0xDBxmgaAMlSCUdcSGQ9xJunA";
const BOT_AVATAR = "https://media.licdn.com/dms/image/v2/D4D03AQExcYAIk2AI2g/profile-displayphoto-shrink_800_800/B4DZYQqftNHIAc-/0/1744036298012?e=1750291200&v=beta&t=ApEeHEmvHtQ-_r3FaelAAG6z17zi8Fd7hk4JPssanKU";

const ChatbotModal: React.FC<ChatbotModalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: "Bonjour Sophie ! Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.get('https://n8n.ia-temis.be/webhook/833ae2e2-7b39-4560-9b78-13ea801bd4eb', {
        params: {
          message: userMessage.content
        }
      });

      // Parse the response data
      let botContent: string;
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Handle array response
        const firstItem = response.data[0];
        if (typeof firstItem === 'object' && firstItem !== null && 'output' in firstItem) {
          botContent = String(firstItem.output);
        } else {
          botContent = JSON.stringify(firstItem);
        }
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Handle object response
        if ('output' in response.data) {
          botContent = String(response.data.output);
        } else {
          botContent = JSON.stringify(response.data);
        }
      } else {
        // Handle primitive response
        botContent = String(response.data);
      }

      // Add bot response
      const botMessage: Message = {
        type: 'bot',
        content: botContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: "Une erreur s'est produite lors de la communication avec le serveur. Veuillez réessayer.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={BOT_AVATAR} 
                alt="TEMIS Assistant" 
                className="w-full h-full object-cover"
              />
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-emerald-800">TEMIS Assistant</h2>
              <p className="text-sm text-emerald-500">Intelligence Artificielle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-emerald-100'
                    : 'bg-emerald-500'
                }`}
              >
                <img 
                  src={message.type === 'user' ? USER_AVATAR : BOT_AVATAR} 
                  alt={message.type === 'user' ? 'User' : 'TEMIS Assistant'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={BOT_AVATAR} 
                  alt="TEMIS Assistant" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors resize-none"
              rows={2}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 bottom-2 p-2 text-emerald-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotModal;