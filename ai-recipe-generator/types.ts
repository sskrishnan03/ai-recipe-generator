
export interface RecipeFormData {
  ingredients: string;
  cuisine: string;
  diet: string;
  difficulty: string;
  language: string;
  mood: string;
  servings: string;
  mealType: string;
  chefPersona: string;
}

export interface Recipe {
  title: string;
  description:string;
  cookingTime: string;
  servings: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  instructionTimers: number[];
  nutrition: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  estimatedCost: string;
  tips: string[];
  storageTips: string[];
  language: string;
  mealType: string;
  imageUrl?: string;
  imageError?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface ShoppingListItem {
  name: string;
  checked: boolean;
}

export interface DietMeal {
  name: string;
  calories: string;
  details: string;
}

export interface DietDay {
  day: string;
  meals: {
    breakfast: DietMeal;
    lunch: DietMeal;
    dinner: DietMeal;
    snack: DietMeal;
  };
}

export interface DietPlan {
  goal: string;
  introduction: string;
  weeklyPlan: DietDay[];
}

export interface RecipeIdea {
  title: string;
  description: string;
  usedIngredients: string[];
  missingIngredients: string[];
}
