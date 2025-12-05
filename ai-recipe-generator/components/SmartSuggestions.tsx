
import React, { useState } from 'react';
import { generateSmartSuggestions } from '../services/geminiService';
import type { RecipeIdea } from '../types';
import Button from './common/Button';
import { Lightbulb } from './icons/Lightbulb';
import { Sparkles } from './icons/Sparkles';
import Loader from './common/Loader';

interface SmartSuggestionsProps {
    onSelectIdea: (idea: RecipeIdea) => void;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ onSelectIdea }) => {
  const [ingredients, setIngredients] = useState('');
  const [ideas, setIdeas] = useState<RecipeIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) return;
    setIsLoading(true);
    setIdeas([]);
    try {
        const suggestions = await generateSmartSuggestions(ingredients);
        setIdeas(suggestions);
    } catch (error) {
        console.error(error);
        alert("Could not generate suggestions.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-500" /> Smart Suggestions
            </h2>
            <p className="text-slate-500 text-sm mt-1">Turn your leftovers into something delicious.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 mb-8">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">What's in your kitchen?</label>
                <textarea 
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="e.g., half an onion, some cheddar cheese, stale bread, milk..."
                    rows={3}
                    className="w-full neu-input rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none"
                    required
                />
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full !bg-amber-500 hover:!bg-amber-600 !text-white !border-amber-500">
                Get Creative Ideas
            </Button>
        </form>

        {isLoading && (
            <div className="py-8 flex items-center justify-center">
                <Loader text="Brainstorming recipes..." />
            </div>
        )}

        {ideas.length > 0 && (
            <div className="space-y-4">
                {ideas.map((idea, idx) => (
                    <div key={idx} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all animate-float-up" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-amber-600 transition-colors">{idea.title}</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{idea.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            {idea.usedIngredients.map((ing, i) => (
                                <span key={`used-${i}`} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">✓ {ing}</span>
                            ))}
                            {idea.missingIngredients.map((ing, i) => (
                                <span key={`miss-${i}`} className="px-2 py-1 bg-slate-50 text-slate-500 text-xs rounded-md border border-slate-100">+ {ing}</span>
                            ))}
                        </div>

                        <button 
                            onClick={() => onSelectIdea(idea)}
                            className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Generate Full Recipe
                        </button>
                    </div>
                ))}
            </div>
        )}
        
        {ideas.length === 0 && !isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 opacity-50">
                <Lightbulb className="w-12 h-12 mb-2" />
                <p className="text-sm">Enter ingredients to get started</p>
            </div>
        )}
    </div>
  );
};

export default SmartSuggestions;
