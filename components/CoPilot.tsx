import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, X, Sparkles, Mic, Maximize2, Minimize2, Loader2, BrainCircuit } from 'lucide-react';
import { Job, Candidate, Client, User } from '../types';

interface CoPilotProps {
  jobs: Job[];
  candidates: Candidate[];
  clients: Client[];
  users: User[];
  currentUser: User | null;
}

const CoPilot: React.FC<CoPilotProps> = ({ jobs, candidates, clients, users, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: `Sawubona ${currentUser?.name || 'Partner'}! I am your Senior Recruitment Strategist. I have real-time access to ${candidates.length} candidates and ${jobs.filter(j => j.status === 'Active').length} active jobs. How can I assist?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Data Snapshot for Context
      const activeJobs = jobs.filter(j => j.status === 'Active').map(j => `${j.title} (${j.location})`).join(', ');
      const recentCandidates = candidates.slice(0, 5).map(c => `${c.name} (${c.status})`).join(', ');
      
      const context = `
        ROLE: You are The Hiring Org Senior Recruitment Strategist.
        DATA SNAPSHOT:
        - Active Roles: ${activeJobs}
        - Recent Candidates: ${recentCandidates}
        - Total Clients: ${clients.length}
        
        INSTRUCTIONS:
        - You have live read access to the Firestore snapshot.
        - Answer in under 60 words.
        - Use the user's language (English, Afrikaans, or isiZulu) if detected, otherwise English.
        - Be precise with numbers.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: context
        }
      });

      const text = response.text || "I couldn't process that request right now.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Network connection issue." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
      // Simulation of Voice Input
      if (!isListening) {
          setIsListening(true);
          setTimeout(() => {
              setIsListening(false);
              setInput("What is the placement probability for the Senior Dev role?");
          }, 2000);
      }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-black transition-all z-50 flex items-center gap-3 border border-slate-700 animate-bounce-slight group"
      >
        <div className="relative">
            <BrainCircuit size={24} className="text-orange-500"/>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
        </div>
        <span className="font-bold pr-2 group-hover:pr-4 transition-all">Co-Pilot</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col transition-all duration-300 ${isExpanded ? 'w-[600px] h-[80vh]' : 'w-[400px] h-[500px]'}`}>
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white rounded-t-2xl flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-orange-500"/>
          <h3 className="font-bold text-sm">Gemini Co-Pilot</h3>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">Live Context</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            {isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
            }`}>
              {msg.role === 'model' && <Bot size={14} className="mb-1 text-orange-500"/>}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-orange-500"/>
              <span className="text-xs text-slate-500">Analyzing Firestore...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 rounded-b-2xl flex gap-2 items-center">
        <button 
            type="button" 
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            title="Voice Input"
        >
            <Mic size={20}/>
        </button>
        <input 
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="bg-orange-500 text-white p-2 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Send size={20}/>
        </button>
      </form>
    </div>
  );
};

export default CoPilot;