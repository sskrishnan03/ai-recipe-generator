
import React, { useState } from 'react';
import type { Recipe } from '../types';
import Tag from './common/Tag';
import { Clock } from './icons/Clock';
import { Users } from './icons/Users';
import { BarChart } from './icons/BarChart';
import { CheckCircle } from './icons/CheckCircle';
import { Play } from './icons/Play';
import { Copy } from './icons/Copy';
import { Heart } from './icons/Heart';
import { ShoppingCart } from './icons/ShoppingCart';
import { Rupee } from './icons/Rupee';
import { Download } from './icons/Download';
import { MealIcon } from './icons/MealIcon';

interface RecipeCardProps {
  recipe: Recipe;
  onStartCooking: () => void;
  onToggleSave: (recipe: Recipe) => void;
  onOpenShoppingList: () => void;
  isSaved: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onStartCooking, onToggleSave, onOpenShoppingList, isSaved }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  const handleToggleSaveClick = () => {
    onToggleSave(recipe);
    if (!isSaved) {
        setIsHeartAnimating(true);
        setTimeout(() => setIsHeartAnimating(false), 500);
    }
  };
  
  const formatRecipeAsText = (recipeToFormat: Recipe): string => {
    let text = `🍳 *${recipeToFormat.title}*\n\n`;
    text += `${recipeToFormat.description}\n\n`;
    text += `*Ingredients:*\n${recipeToFormat.ingredients.join('\n- ')}\n\n`;
    text += `*Instructions:*\n${recipeToFormat.instructions.map((s,i) => `${i+1}. ${s}`).join('\n')}`;
    return text;
  };

  const formatRecipeForDownload = (recipeToFormat: Recipe): string => {
    let text = `${recipeToFormat.title}\n`;
    text += `${'='.repeat(recipeToFormat.title.length)}\n\n`;
    text += `${recipeToFormat.description}\n\n`;
    text += `----------------------------------------\n`;
    text += `Difficulty: ${recipeToFormat.difficulty} | Time: ${recipeToFormat.cookingTime} | Servings: ${recipeToFormat.servings}\n`;
    text += `----------------------------------------\n\n`;
    
    text += `INGREDIENTS\n`;
    text += `-----------\n`;
    text += `${recipeToFormat.ingredients.map(ing => `• ${ing}`).join('\n')}\n\n`;
    
    text += `INSTRUCTIONS\n`;
    text += `------------\n`;
    text += `${recipeToFormat.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n`;
    
    if (recipeToFormat.tips.length > 0) {
        text += `CHEF'S NOTES\n`;
        text += `------------\n`;
        text += `${recipeToFormat.tips.map(tip => `• ${tip}`).join('\n')}\n`;
    }
    
    if (recipeToFormat.nutrition) {
        text += `\nNUTRITION (per serving)\n`;
        text += `-----------------------\n`;
        text += `Calories: ${recipeToFormat.nutrition.calories}\n`;
        text += `Protein: ${recipeToFormat.nutrition.protein}\n`;
        text += `Carbs: ${recipeToFormat.nutrition.carbs}\n`;
        text += `Fat: ${recipeToFormat.nutrition.fat}\n`;
    }

    return text;
  };

  const handleCopyRecipe = () => {
    const recipeText = formatRecipeAsText(recipe).replace(/\*/g, ''); // Remove markdown stars for raw copy if needed, or keep them.
    navigator.clipboard.writeText(recipeText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const handleDownload = () => {
    const text = formatRecipeForDownload(recipe);
    const element = document.createElement("a");
    // BOM for UTF-8 support in Excel/Notepad/WordPad
    const file = new Blob(['\uFEFF' + text], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full animate-float-up text-left">
       <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden mb-8 shadow-2xl border border-white group bg-slate-100">
        {recipe.imageUrl && recipe.imageUrl !== 'error' ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-500 p-4 relative overflow-hidden">
             <div className="absolute inset-0 opacity-5 grid grid-cols-6 gap-8 p-4 transform -rotate-12 scale-150 pointer-events-none">
                 {[...Array(24)].map((_, i) => <MealIcon key={i} type={recipe.mealType} className="w-16 h-16" />)}
             </div>
             
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-white border border-slate-300 flex items-center justify-center mb-4 shadow-xl backdrop-blur-sm">
                    <MealIcon type={recipe.mealType} className="w-12 h-12 text-slate-400" />
                </div>
                <p className="font-light tracking-wide text-lg">
                    {recipe.imageError ? 'Image Generation Failed' : 'No Image Available'}
                </p>
             </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full z-20">
            <div className="flex flex-wrap gap-3 mb-4">
                <Tag icon={<MealIcon type={recipe.mealType} className="w-4 h-4" />} text={recipe.mealType} className="backdrop-blur-md bg-white/20 text-white border-white/30" />
                <Tag icon={<Clock className="w-4 h-4" />} text={recipe.cookingTime} className="backdrop-blur-md bg-white/20 text-white border-white/30" />
                <Tag icon={<Users className="w-4 h-4" />} text={recipe.servings} className="backdrop-blur-md bg-white/20 text-white border-white/30" />
                <Tag icon={<BarChart className="w-4 h-4" />} text={recipe.difficulty} className={`backdrop-blur-md bg-white/20 text-white border-white/30`} />
                 {recipe.estimatedCost && (
                     <Tag icon={<Rupee className="w-4 h-4" />} text={recipe.estimatedCost} className="backdrop-blur-md bg-emerald-500/20 text-emerald-100 border-emerald-500/30" />
                 )}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md tracking-tight leading-tight">{recipe.title}</h2>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div className="md:w-2/3">
             <p className="text-xl text-slate-600 leading-relaxed font-light">{recipe.description}</p>
          </div>
          <div className="md:w-1/3 flex flex-col gap-3 relative">
             <button
              onClick={onStartCooking}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
                <Play className="w-6 h-6 fill-current" /> Start Cooking
            </button>
            <div className="flex gap-3">
                <button
                    onClick={handleToggleSaveClick}
                    className={`flex-1 py-3 rounded-2xl font-semibold border transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''} ${isHeartAnimating ? 'animate-bounce' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
                </button>
                <button
                    onClick={onOpenShoppingList}
                    className="flex-1 py-3 rounded-2xl font-semibold border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                    <ShoppingCart className="w-5 h-5" /> List
                </button>
                 <button
                    onClick={handleDownload}
                    className="p-3 rounded-2xl font-semibold border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center relative"
                    title="Download Recipe"
                >
                    <Download className="w-5 h-5" />
                </button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
            <div className="bg-white/60 border border-white rounded-3xl p-6 backdrop-blur-sm shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-rose-500 rounded-full"></span> Ingredients
                </h3>
                <ul className="space-y-4">
                    {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-3 group">
                            {/* Verified Circular Ingredient Bullet */}
                            <div className="mt-1 w-5 h-5 flex-shrink-0 rounded-full border-2 border-rose-200 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-slate-700 leading-snug">{ingredient}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-slate-200">
                     <button onClick={handleCopyRecipe} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors">
                        {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                        {isCopied ? 'Ingredients Copied' : 'Copy Ingredients'}
                     </button>
                </div>
            </div>
            
             <div className="bg-white/60 border border-white rounded-3xl p-6 backdrop-blur-sm shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Nutrition</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Calories</p>
                        <p className="text-lg font-bold text-slate-800">{recipe.nutrition.calories}</p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Protein</p>
                        <p className="text-lg font-bold text-slate-800">{recipe.nutrition.protein}</p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Carbs</p>
                        <p className="text-lg font-bold text-slate-800">{recipe.nutrition.carbs}</p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Fat</p>
                        <p className="text-lg font-bold text-slate-800">{recipe.nutrition.fat}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="md:col-span-8">
            <div className="bg-white/60 border border-white rounded-3xl p-8 backdrop-blur-sm h-full shadow-sm">
                 <h3 className="text-2xl font-bold text-slate-800 mb-8">Method</h3>
                 <div className="space-y-8">
                    {recipe.instructions.map((step, index) => (
                        <div key={index} className="flex gap-6 group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-lg text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">{step}</p>
                            </div>
                        </div>
                    ))}
                 </div>
                 
                 {(recipe.tips.length > 0 || recipe.storageTips.length > 0) && (
                     <div className="mt-12 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                         <h4 className="text-indigo-800 font-bold mb-3 flex items-center gap-2">Chef's Notes</h4>
                         <ul className="space-y-2 text-indigo-700 list-disc list-inside">
                             {recipe.tips.slice(0,2).map((t,i) => <li key={`t-${i}`}>{t}</li>)}
                             {recipe.storageTips.slice(0,2).map((t,i) => <li key={`s-${i}`}>{t}</li>)}
                         </ul>
                     </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
