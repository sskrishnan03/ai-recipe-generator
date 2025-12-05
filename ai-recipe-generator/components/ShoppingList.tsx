
import React, { useState, useEffect } from 'react';
import type { Recipe, ShoppingListItem } from '../types';
import { extractCoreIngredients, findNearbyStores } from '../services/geminiService';
import { Close } from './icons/Close';
import { Copy } from './icons/Copy';
import { CheckCircle } from './icons/CheckCircle';
import { ShoppingCart } from './icons/ShoppingCart';
import { Plus } from './icons/Plus';
import { MapPin } from './icons/MapPin';
import Loader from './common/Loader';

interface ShoppingListProps {
  recipe: Recipe;
  onClose: () => void;
}

interface Store {
    title: string;
    uri: string;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ recipe, onClose }) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Maps Integration State
  const [isFindingStores, setIsFindingStores] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeError, setStoreError] = useState<string | null>(null);

  useEffect(() => {
    const generateSimplifiedList = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const coreIngredients = await extractCoreIngredients(recipe.ingredients);
            const initialItems = coreIngredients.map(ing => ({ name: ing, checked: false }));
            setItems(initialItems);
        } catch (err) {
            console.warn("Could not simplify shopping list, falling back to original.", err);
            const initialItems = recipe.ingredients.map(ing => ({ name: ing, checked: false }));
            setItems(initialItems);
            setError("Could not simplify list. Showing full ingredient details.");
        } finally {
            setIsLoading(false);
        }
    };
    generateSimplifiedList();
  }, [recipe]);

  const handleToggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      setItems([...items, { name: newItem.trim(), checked: false }]);
      setNewItem('');
    }
  };

  const handleCopyList = () => {
    let listText = `Shopping List for ${recipe.title}\n\n`;
    const uncheckedItems = items.filter(item => !item.checked);
    const checkedItems = items.filter(item => item.checked);

    if (uncheckedItems.length > 0) {
        listText += "To Buy:\n";
        uncheckedItems.forEach(item => {
            listText += `- [ ] ${item.name}\n`;
        });
    }

    if (checkedItems.length > 0) {
        listText += "\nAlready Have:\n";
        checkedItems.forEach(item => {
            listText += `- [x] ${item.name}\n`;
        });
    }

    navigator.clipboard.writeText(listText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleFindStores = () => {
      setIsFindingStores(true);
      setStoreError(null);
      setStores([]);

      if (!navigator.geolocation) {
          setStoreError("Geolocation is not supported by your browser.");
          setIsFindingStores(false);
          return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
          try {
              const { latitude, longitude } = position.coords;
              const foundStores = await findNearbyStores(latitude, longitude);
              setStores(foundStores);
              if (foundStores.length === 0) {
                  setStoreError("No grocery stores found nearby.");
              }
          } catch (err) {
              setStoreError("Failed to find stores. Please try again.");
          } finally {
              setIsFindingStores(false);
          }
      }, (err) => {
          setStoreError("Unable to retrieve your location.");
          setIsFindingStores(false);
      });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-title"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col animate-pop-in max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-rose-500 to-orange-500 w-full"></div>
        <header className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 id="shopping-list-title" className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg"><ShoppingCart className="w-5 h-5 text-rose-500" /></div>
            Shopping List
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
            <Close className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader text="Simplifying list..." />
            </div>
          ) : (
            <>
              {error && <p className="text-center text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded-lg">{error}</p>}
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => handleToggleItem(index)}
                    className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all ${item.checked ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-slate-100 hover:border-rose-200 shadow-sm'}`}
                    tabIndex={0}
                  >
                    <div className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${item.checked ? 'bg-rose-500 border-rose-500' : 'border-slate-300'}`}>
                      {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`flex-grow font-medium ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

           {/* Maps Grounding Section */}
           <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nearby Stores</h3>
                    <button 
                        onClick={handleFindStores} 
                        disabled={isFindingStores}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                        <MapPin className="w-3 h-3" />
                        {isFindingStores ? 'Locating...' : 'Find Stores'}
                    </button>
                </div>
                
                {storeError && <p className="text-xs text-rose-500 mb-2">{storeError}</p>}
                
                {stores.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                        {stores.map((store, idx) => (
                             <a key={idx} href={store.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group border border-transparent hover:border-indigo-100">
                                <div className="p-2 bg-white rounded-full text-indigo-500 shadow-sm"><MapPin className="w-4 h-4"/></div>
                                <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">{store.title}</span>
                             </a>
                        ))}
                    </div>
                )}
           </div>
        </div>

        {!isLoading && (
            <footer className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
            <form onSubmit={handleAddItem} className="relative">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add item..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all shadow-sm"
                    aria-label="Add new item to shopping list"
                />
                <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-600 rounded-lg transition-colors disabled:opacity-50"
                disabled={!newItem.trim()}
                aria-label="Add Item"
                >
                <Plus className="w-5 h-5" />
                </button>
            </form>
            <button
                onClick={handleCopyList}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${isCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
                {isCopied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {isCopied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </button>
            </footer>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
