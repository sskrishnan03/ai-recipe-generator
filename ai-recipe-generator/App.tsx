
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, RecipeFormData, RecipeIdea } from './types';
import type { Chat } from '@google/genai';
import { generateRecipe, generateRecipeImage, startRecipeAssistantChat } from './services/geminiService';
import { initDB, getAllRecipes, saveRecipe, deleteRecipe } from './services/db';
import RecipeForm from './components/RecipeForm';
import RecipeCard from './components/RecipeCard';
import Loader from './components/common/Loader';
import CookingMode from './components/CookingMode';
import AIAssistant from './components/AIAssistant';
import { ChefHat } from './components/icons/ChefHat';
import { MessageCircle } from './components/icons/MessageCircle';
import SavedRecipesList from './components/SavedRecipesList';
import Toast from './components/common/Toast';
import ShoppingList from './components/ShoppingList';
import DietCoach from './components/DietCoach';
import SmartSuggestions from './components/SmartSuggestions';
import { Sparkles } from './components/icons/Sparkles';
import { Heart } from './components/icons/Heart';
import { Activity } from './components/icons/Activity';
import { Lightbulb } from './components/icons/Lightbulb';

const App: React.FC = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderText, setLoaderText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCookingMode, setIsCookingMode] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'diet' | 'smart'>('create');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState<boolean>(false);
  const [prefillFormData, setPrefillFormData] = useState<Partial<RecipeFormData> | undefined>(undefined);

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
        setToast(null);
    }, 3500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const storedRecipes = await getAllRecipes();
        if (storedRecipes) {
          setSavedRecipes(storedRecipes);
        }
      } catch (error) {
        console.error("Could not load saved recipes from DB:", error);
        setSavedRecipes([]);
      }
    };
    loadData();
  }, []);

  // Handle URL Deep Linking
  useEffect(() => {
    const checkUrlForRecipe = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const encodedRecipe = searchParams.get('r');

        if (encodedRecipe) {
            try {
                setIsLoading(true);
                setLoaderText('Loading shared recipe...');
                
                const jsonString = decodeURIComponent(atob(encodedRecipe));
                const parsedRecipe: Recipe = JSON.parse(jsonString);
                
                // Set the basic recipe immediately
                setRecipe(parsedRecipe);
                const newChatSession = startRecipeAssistantChat(parsedRecipe);
                setChatSession(newChatSession);

                // Try to generate an image for it if it doesn't have one (shared links usually don't have large images)
                // We do this in background
                try {
                    setLoaderText('Generating photography for shared recipe...');
                    const imageUrl = await generateRecipeImage(parsedRecipe.title, parsedRecipe.description);
                    setRecipe(prev => prev ? { ...prev, imageUrl } : null);
                } catch (imgError) {
                     console.warn("Could not auto-generate image for shared recipe");
                     setRecipe(prev => prev ? { ...prev, imageError: 'Image not available' } : null);
                }

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error("Failed to parse shared recipe", err);
                showToast("Invalid shared recipe link.", "info");
            } finally {
                setIsLoading(false);
            }
        }
    };
    checkUrlForRecipe();
  }, []); // Run once on mount

  const handleToggleSave = async (recipeToToggle: Recipe) => {
    const isAlreadySaved = savedRecipes.some(r => r.title === recipeToToggle.title);
    let newSavedRecipes;
    if (isAlreadySaved) {
      await deleteRecipe(recipeToToggle.title);
      newSavedRecipes = savedRecipes.filter(r => r.title !== recipeToToggle.title);
      showToast('Recipe removed.', 'info');
    } else {
      await saveRecipe(recipeToToggle);
      newSavedRecipes = [...savedRecipes, recipeToToggle];
      showToast('Recipe saved!', 'success');
    }
    setSavedRecipes(newSavedRecipes);
    setRecipe(recipeToToggle);
  };

  const handleDeleteSavedRecipe = async (recipeTitle: string) => {
    await deleteRecipe(recipeTitle);
    const newSavedRecipes = savedRecipes.filter(r => r.title !== recipeTitle);
    setSavedRecipes(newSavedRecipes);
    showToast('Recipe deleted.', 'info');
  };

  const handleSelectSavedRecipe = (selectedRecipe: Recipe) => {
    setRecipe(selectedRecipe);
    setError(null);
    const newChatSession = startRecipeAssistantChat(selectedRecipe);
    setChatSession(newChatSession);
    setIsAssistantOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleGenerateRecipe = useCallback(async (formData: RecipeFormData) => {
    setIsLoading(true);
    setError(null);
    setRecipe(null);
    setChatSession(null);
    setIsAssistantOpen(false);

    let generatedRecipe: Recipe;

    try {
      setLoaderText('Crafting your culinary masterpiece...');
      generatedRecipe = await generateRecipe(formData);
      setRecipe(generatedRecipe);

      const newChatSession = startRecipeAssistantChat(generatedRecipe);
      setChatSession(newChatSession);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setRecipe(null);
      setIsLoading(false);
      return; 
    }
    
    try {
        setLoaderText('Plating your dish with AI photography...');
        const imageUrl = await generateRecipeImage(generatedRecipe.title, generatedRecipe.description);
        setRecipe(prevRecipe => {
            if (!prevRecipe) return null;
            const finalRecipe = { ...prevRecipe, imageUrl: imageUrl };
            if (savedRecipes.some(r => r.title === finalRecipe.title)) {
                saveRecipe(finalRecipe);
                showToast('Saved recipe updated with new image.', 'success');
            }
            return finalRecipe;
        });
    } catch (err) {
        console.warn("Image generation failed, but displaying recipe text.", err);
        const imageError = err instanceof Error ? err.message : 'Could not create an image.';
        setRecipe(prevRecipe => {
            if (!prevRecipe) return null;
            return { ...prevRecipe, imageUrl: 'error', imageError: imageError };
        });
    } finally {
        setIsLoading(false);
    }
  }, [savedRecipes]);

  const handleStartCooking = () => {
    if (recipe) {
      setIsCookingMode(true);
    }
  };

  const handleExitCooking = () => {
    setIsCookingMode(false);
  };
  
  const handleOpenShoppingList = () => {
    if (recipe) {
      setIsShoppingListOpen(true);
    }
  };

  const handleSelectSmartIdea = (idea: RecipeIdea) => {
    const allIngredients = [...idea.usedIngredients, ...idea.missingIngredients].join(', ');
    setPrefillFormData({
        ingredients: allIngredients,
        mealType: 'All Meal Types', // or infer
    });
    setActiveTab('create');
  };

  const isCurrentRecipeSaved = recipe ? savedRecipes.some(r => r.title === recipe.title) : false;

  // Logic to determine if the sidebar should be fixed height with internal scroll or auto height
  // 'create' tab is Auto height (no internal scroll)
  // Others are fixed height (internal scroll)
  const isScrollableSidebar = activeTab !== 'create';

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 font-outfit text-slate-900">
      <div className="max-w-[1600px] mx-auto">
        <header className="text-center mb-16 relative z-10 animate-float-up">
          <div className="inline-block mb-6 transform hover:scale-110 transition-transform duration-500">
             <ChefHat className="h-24 w-24 text-rose-500 drop-shadow-xl" />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 drop-shadow-sm">
              AI Recipe Generator
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Experience the future of cooking. Transform ingredients into gourmet experiences with the power of Gemini AI.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Sidebar */}
          <div className={`lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8 animate-float-up ${isScrollableSidebar ? 'h-[calc(100vh-6rem)]' : ''}`} style={{ animationDelay: '0.1s' }}>
            <div className={`glass-card rounded-[32px] shadow-2xl relative flex flex-col transition-all duration-300 ${isScrollableSidebar ? 'h-full overflow-hidden' : 'overflow-hidden'}`}>
                
                {/* Top Tabs: Core Modes */}
                <div className="p-3 grid grid-cols-2 gap-2 bg-slate-50 border-b border-slate-100 shrink-0">
                    <button 
                      onClick={() => setActiveTab('create')}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all duration-300 font-bold tracking-wide text-sm ${activeTab === 'create' ? 'bg-white shadow-lg text-rose-500 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}
                    >
                       <Sparkles className={`w-4 h-4 ${activeTab === 'create' ? 'animate-pulse' : ''}`} /> Create
                    </button>
                     <button 
                      onClick={() => setActiveTab('saved')}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all duration-300 font-bold tracking-wide text-sm ${activeTab === 'saved' ? 'bg-white shadow-lg text-rose-500 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}
                    >
                       <Heart className="w-4 h-4" /> Saved
                    </button>
                </div>

                {/* Content Area */}
                <div className={`relative p-6 ${isScrollableSidebar ? 'flex-1 overflow-y-auto custom-scrollbar' : ''}`}>
                    {activeTab === 'create' && <RecipeForm onGenerate={handleGenerateRecipe} isLoading={isLoading} initialValues={prefillFormData} />}
                    {activeTab === 'saved' && (
                        <SavedRecipesList 
                          recipes={savedRecipes}
                          onSelect={handleSelectSavedRecipe}
                          onDelete={handleDeleteSavedRecipe}
                        />
                    )}
                    {activeTab === 'diet' && <DietCoach />}
                    {activeTab === 'smart' && <SmartSuggestions onSelectIdea={handleSelectSmartIdea} />}
                </div>

                {/* Bottom Tools Section */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 shrink-0 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3 opacity-60 px-1">
                        <div className="h-px bg-slate-300 flex-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Tools</span>
                        <div className="h-px bg-slate-300 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                          onClick={() => setActiveTab('diet')}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group ${activeTab === 'diet' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-slate-200/60 text-slate-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5'}`}
                       >
                          <Activity className={`w-5 h-5 mb-1.5 transition-colors ${activeTab === 'diet' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                          <span className="text-xs font-bold">Diet Coach</span>
                       </button>
                       <button 
                          onClick={() => setActiveTab('smart')}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group ${activeTab === 'smart' ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'bg-white border-slate-200/60 text-slate-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5'}`}
                       >
                          <Lightbulb className={`w-5 h-5 mb-1.5 transition-colors ${activeTab === 'smart' ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} />
                          <span className="text-xs font-bold">Leftovers</span>
                       </button>
                    </div>
                </div>

            </div>
          </div>
          
          <div className="lg:col-span-8 xl:col-span-9 animate-float-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card rounded-[32px] p-8 min-h-[600px] flex items-center justify-center relative overflow-hidden">
              {isLoading ? (
                <Loader text={loaderText} />
              ) : error ? (
                <div className="text-center max-w-md p-8 bg-red-100 rounded-3xl border border-red-200">
                  <p className="text-red-700 text-lg font-medium">{error}</p>
                </div>
              ) : recipe ? (
                <RecipeCard 
                  recipe={recipe} 
                  onStartCooking={handleStartCooking} 
                  onToggleSave={handleToggleSave}
                  onOpenShoppingList={handleOpenShoppingList}
                  isSaved={isCurrentRecipeSaved}
                />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <ChefHat className="h-24 w-24 text-rose-300/50" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Ready to Cook?</h2>
                  <p className="text-slate-500 font-light">Tell us what you have, and we'll design a recipe just for you.</p>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <footer className="text-center mt-20 text-slate-400 text-sm font-medium relative z-10">
            <p className="opacity-80">AI Recipe Generator</p>
        </footer>
      </div>

      {isCookingMode && recipe && (
        <CookingMode recipe={recipe} onExit={handleExitCooking} />
      )}
      
      {isShoppingListOpen && recipe && (
        <ShoppingList recipe={recipe} onClose={() => setIsShoppingListOpen(false)} />
      )}

      {recipe && !isLoading && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:scale-110 transition-transform duration-300 border-2 border-white"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}

      {isAssistantOpen && recipe && chatSession && (
        <AIAssistant 
          recipe={recipe} 
          chatSession={chatSession} 
          onClose={() => setIsAssistantOpen(false)} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default App;
