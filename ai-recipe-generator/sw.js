const CACHE_NAME = 'ai-recipe-generator-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/metadata.json',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/services/geminiService.ts',
  '/services/db.ts',
  '/components/RecipeForm.tsx',
  '/components/RecipeCard.tsx',
  '/components/CookingMode.tsx',
  '/components/AIAssistant.tsx',
  '/components/SavedRecipesList.tsx',
  '/components/common/Button.tsx',
  '/components/common/Select.tsx',
  '/components/common/Loader.tsx',
  '/components/common/Tag.tsx',
  '/components/common/Toast.tsx',
  '/components/icons/BarChart.tsx',
  '/components/icons/Bot.tsx',
  '/components/icons/CheckCircle.tsx',
  '/components/icons/ChefHat.tsx',
  '/components/icons/ChevronLeft.tsx',
  '/components/icons/ChevronRight.tsx',
  '/components/icons/Clock.tsx',
  '/components/icons/Close.tsx',
  '/components/icons/Copy.tsx',
  '/components/icons/Eye.tsx',
  '/components/icons/Heart.tsx',
  '/components/icons/Image.tsx',
  '/components/icons/Info.tsx',
  '/components/icons/MessageCircle.tsx',
  '/components/icons/Mic.tsx',
  '/components/icons/Play.tsx',
  '/components/icons/Repeat.tsx',
  '/components/icons/Search.tsx',
  '/components/icons/Send.tsx',
  '/components/icons/Sparkles.tsx',
  '/components/icons/Trash.tsx',
  '/components/icons/Users.tsx',
  '/components/icons/VolumeOff.tsx',
  '/components/icons/VolumeUp.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/@google/genai@^1.16.0',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return Promise.all(
            urlsToCache.map(url => cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err)))
        );
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});