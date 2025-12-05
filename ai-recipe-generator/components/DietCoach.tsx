
import React, { useState } from 'react';
import { generateDietPlan } from '../services/geminiService';
import type { DietPlan } from '../types';
import Button from './common/Button';
import { Download } from './icons/Download';
import { Activity } from './icons/Activity';
import Loader from './common/Loader';

const DietCoach: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setIsLoading(true);
    setDietPlan(null);
    try {
      const plan = await generateDietPlan(goal, preferences);
      setDietPlan(plan);
    } catch (error) {
      console.error(error);
      alert("Failed to generate diet plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!dietPlan) return;
    
    let text = `AI DIET COACH PLAN\n`;
    text += `Goal: ${dietPlan.goal}\n`;
    text += `==========================================\n\n`;
    text += `${dietPlan.introduction}\n\n`;
    
    dietPlan.weeklyPlan.forEach(day => {
        text += `\n[ ${day.day.toUpperCase()} ]\n`;
        text += `------------------------------------------\n`;
        text += `Breakfast: ${day.meals.breakfast.name} (${day.meals.breakfast.calories})\n`;
        text += `  > ${day.meals.breakfast.details}\n`;
        text += `Lunch:     ${day.meals.lunch.name} (${day.meals.lunch.calories})\n`;
        text += `  > ${day.meals.lunch.details}\n`;
        text += `Dinner:    ${day.meals.dinner.name} (${day.meals.dinner.calories})\n`;
        text += `  > ${day.meals.dinner.details}\n`;
        text += `Snack:     ${day.meals.snack.name} (${day.meals.snack.calories})\n`;
        text += `  > ${day.meals.snack.details}\n`;
    });

    const element = document.createElement("a");
    const file = new Blob(['\uFEFF' + text], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `Diet_Plan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" /> Diet AI Coach
         </h2>
         <p className="text-slate-500 text-sm mt-1">Get a customized weekly meal plan for your goals.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4 mb-8">
         <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Health Goal</label>
            <input 
                type="text" 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Lose weight, Muscle gain, Low carb..."
                className="w-full neu-input rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                required
            />
         </div>
         <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Dietary Preferences / Allergies</label>
            <textarea 
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g., Vegetarian, No nuts, Gluten-free..."
                rows={2}
                className="w-full neu-input rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
            />
         </div>
         <Button type="submit" isLoading={isLoading} className="w-full !bg-emerald-500 hover:!bg-emerald-600 !text-white !border-emerald-500">
             Generate Weekly Plan
         </Button>
      </form>

      {isLoading && (
          <div className="py-8 flex items-center justify-center">
              <Loader text="Planning your week..." />
          </div>
      )}

      {dietPlan && !isLoading && (
          <div className="animate-float-up space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <h3 className="font-bold text-emerald-800 mb-2">Introduction</h3>
                  <p className="text-sm text-emerald-700 leading-relaxed">{dietPlan.introduction}</p>
              </div>

              <div className="space-y-4">
                  {dietPlan.weeklyPlan.map((day, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">{day.day}</h4>
                          <div className="space-y-3">
                              <MealItem type="Breakfast" meal={day.meals.breakfast} />
                              <MealItem type="Lunch" meal={day.meals.lunch} />
                              <MealItem type="Dinner" meal={day.meals.dinner} />
                              <MealItem type="Snack" meal={day.meals.snack} />
                          </div>
                      </div>
                  ))}
              </div>
              
              <button 
                onClick={handleDownload}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
              >
                  <Download className="w-5 h-5" /> Download Full Plan
              </button>
          </div>
      )}
    </div>
  );
};

const MealItem = ({ type, meal }: { type: string, meal: { name: string, calories: string, details: string } }) => (
    <div className="text-sm">
        <div className="flex justify-between items-baseline">
            <span className="font-semibold text-slate-500 w-20 flex-shrink-0">{type}</span>
            <span className="font-medium text-slate-800 text-right">{meal.name}</span>
        </div>
        <div className="flex justify-between items-baseline mt-0.5">
            <span className="text-xs text-slate-400 pl-20 truncate w-full">{meal.details}</span>
            <span className="text-xs font-bold text-emerald-600 whitespace-nowrap ml-2">{meal.calories}</span>
        </div>
    </div>
);

export default DietCoach;
