
import React, { useState, useEffect, useRef } from 'react';
import type { Recipe, ChatMessage } from '../types';
import type { Chat } from '@google/genai';
import { Bot } from './icons/Bot';
import { Send } from './icons/Send';
import { Close } from './icons/Close';
import { Mic } from './icons/Mic';

interface AIAssistantProps {
  recipe: Recipe;
  chatSession: Chat;
  onClose: () => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const AIAssistant: React.FC<AIAssistantProps> = ({ recipe, chatSession, onClose }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatHistory([{ role: 'model', text: `Hi! I'm your AI assistant. Ask me anything about the "${recipe.title}" recipe.` }]);
  }, [recipe.title]);

  useEffect(() => {
    if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, isAssistantLoading]);
  
  const languageToLangCode = (lang: string): string => {
    const map: { [key: string]: string } = {
        English: 'en-US', Hindi: 'hi-IN', Tamil: 'ta-IN',
        Telugu: 'te-IN', Kannada: 'kn-IN', Malayalam: 'ml-IN',
    };
    return map[lang] || 'en-US';
  };

  const handleVoiceInputClick = () => {
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support voice recognition. Please try using Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languageToLangCode(recipe.language);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      alert(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error("Could not start speech recognition", error);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isAssistantLoading) return;

      const userMessage: ChatMessage = { role: 'user', text: chatInput };
      setChatHistory(prev => [...prev, userMessage]);
      setChatInput('');
      setIsAssistantLoading(true);

      try {
          const response = await chatSession.sendMessage({ message: userMessage.text });
          const modelMessage: ChatMessage = { role: 'model', text: response.text };
          setChatHistory(prev => [...prev, modelMessage]);
      } catch (error) {
          console.error("AI Assistant Error:", error);
          const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
          setChatHistory(prev => [...prev, errorMessage]);
      } finally {
          setIsAssistantLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end items-end sm:items-center sm:p-6" onClick={onClose}>
        <div 
            className="w-full sm:max-w-md h-[80vh] sm:h-[600px] bg-white border border-slate-200 shadow-2xl rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden animate-float-up"
            onClick={e => e.stopPropagation()}
        >
            <header className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Chef</h3>
                        <p className="text-xs text-rose-500">AI Cooking Assistant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                    <Close className="w-6 h-6"/>
                </button>
            </header>
            
            <div className="flex-grow overflow-y-auto p-5 space-y-4 scroll-smooth" ref={chatHistoryRef}>
                 {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 animate-float-up ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 mb-1"></div>}
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-rose-500 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isAssistantLoading && (
                    <div className="flex items-end gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 mb-1"></div>
                        <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200">
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-full py-4 pl-5 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                        disabled={isAssistantLoading}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        <button 
                            type="button" 
                            onClick={handleVoiceInputClick} 
                            className={`p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${isListening ? 'text-rose-500 animate-pulse' : ''}`}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || isAssistantLoading}
                            className="p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 disabled:opacity-50 disabled:bg-slate-300 transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default AIAssistant;
