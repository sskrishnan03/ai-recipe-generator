
export const CUISINE_OPTIONS = [
  "Any",
  "Italian",
  "Mexican",
  "Chinese",
  "Indian",
  "Japanese",
  "Thai",
  "French",
  "Greek",
  "Spanish",
  "Korean",
  "American",
];

export const DIET_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
  "Low-carb",
  "High-protein",
  "Gluten-free",
  "Dairy-free",
];

export const DIFFICULTY_OPTIONS = ["Any", "Easy", "Medium", "Hard"];

export const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
];

export const MOOD_OPTIONS = [
  "Any",
  "Comfort Food",
  "Quick & Energetic",
  "Stress Relief",
  "Healthy Boost",
  "Celebratory",
];

export const MEAL_TYPE_OPTIONS = [
  "All Meal Types",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
  "Appetizer",
];

export const CHEF_PERSONAS = [
  "Friendly Home Cook (Default)",
  "Professional Michelin Chef",
  "Indian Grandma (Dadi/Nani)",
  "Street Food Vendor",
  "Healthy Nutritionist",
  "Busy Mom/Dad (Quick & Easy)",
  "Gordon Ramsay Style (Strict)",
];

export const VOICE_COMMANDS: { [key: string]: { [key: string]: string[] } } = {
  English: {
    next: ['next', 'next step'],
    previous: ['previous', 'back', 'previous step'],
    repeat: ['repeat', 'say again', 'what was that'],
  },
  Hindi: {
    next: ['aage', 'agla kadam'],
    previous: ['piche', 'pichla kadam'],
    repeat: ['dohrao', 'phir se bolo'],
  },
  Tamil: {
    next: ['aduthathu', 'adutha'],
    previous: ['munthaiya', 'pinnadi'],
    repeat: ['thirumba sollu', 'marupadiyum'],
  },
  Telugu: {
    next: ['taruvata', 'munduku'],
    previous: ['venakki', 'gata'],
    repeat: ['malli cheppu', 'tirigi'],
  },
  Kannada: {
    next: ['mundina', 'munde'],
    previous: ['hindina', 'hinde'],
    repeat: ['mattonme heli', 'punah'],
  },
  Malayalam: {
    next: ['aduthathu', 'munnottu'],
    previous: ['kazhinja', 'purakottu'],
    repeat: ['onnu koodi parayoo', 'veendum'],
  },
};
