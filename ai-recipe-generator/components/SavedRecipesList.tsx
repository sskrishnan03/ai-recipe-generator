
import React, { useState } from 'react';
import type { Recipe } from '../types';
import { Trash } from './icons/Trash';
import { Eye } from './icons/Eye';
import { Search } from './icons/Search';
import { MEAL_TYPE_OPTIONS } from '../constants';
import Select from './common/Select';
import { MealIcon } from './icons/MealIcon';


interface SavedRecipesListProps {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  onDelete: (recipeTitle: string) => void;
}

const SavedRecipesList: React.FC<SavedRecipesListProps> = ({ recipes, onSelect, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('All Meal Types');
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setRecipeToDelete(title);
  };

  const confirmDelete = () => {
    if (recipeToDelete) {
      onDelete(recipeToDelete);
      setRecipeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setRecipeToDelete(null);
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (mealTypeFilter === 'All Meal Types' || recipe.mealType === mealTypeFilter)
  );

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">My Cookbook</h2>
      
      {recipes.length > 0 && (
        <div className="space-y-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full neu-input rounded-xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            <Select 
              label="Filter"
              name="mealTypeFilter"
              value={mealTypeFilter}
              onChange={(e) => setMealTypeFilter(e.target.value)}
              options={MEAL_TYPE_OPTIONS}
            />
        </div>
      )}

      {recipes.length > 0 ? (
        filteredRecipes.length > 0 ? (
          <ul className="space-y-3">
            {filteredRecipes.map((recipe, index) => (
              <li 
                key={recipe.title} 
                className="group relative bg-white border border-slate-200 rounded-2xl p-4 transition-all duration-300 cursor-pointer animate-float-up shadow-sm hover:shadow-md hover:border-rose-200"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onSelect(recipe)}
              >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:bg-rose-50 transition-colors">
                        <MealIcon type={recipe.mealType} className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors pr-6">{recipe.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{recipe.mealType} • {recipe.cookingTime}</p>
                    </div>
                </div>
                
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100">
                  <button 
                    onClick={(e) => handleDeleteClick(e, recipe.title)} 
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500 py-8">No matching recipes.</p>
        )
      ) : (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-500 mb-2">Your cookbook is empty.</p>
            <p className="text-sm text-slate-400">Create a recipe and save it!</p>
        </div>
      )}

      {recipeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={cancelDelete}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-rose-500">
                <div className="p-2 bg-rose-50 rounded-full">
                    <Trash className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Delete Recipe?</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-700">"{recipeToDelete}"</span> from your cookbook? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 shadow-sm transition-colors text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRecipesList;
