
import React, { useState, useRef, useEffect } from 'react';
import type { RecipeFormData } from '../types';
import { CUISINE_OPTIONS, DIET_OPTIONS, DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS, MOOD_OPTIONS, MEAL_TYPE_OPTIONS, CHEF_PERSONAS } from '../constants';
import Button from './common/Button';
import Select from './common/Select';
import { Sparkles } from './icons/Sparkles';
import { Image } from './icons/Image';
import { Mic } from './icons/Mic';
import { getIngredientsFromImage, transcribeAudio } from '../services/geminiService';

interface RecipeFormProps {
  onGenerate: (formData: RecipeFormData) => void;
  isLoading: boolean;
  initialValues?: Partial<RecipeFormData>;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onGenerate, isLoading, initialValues }) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    ingredients: '',
    cuisine: 'Any',
    diet: 'None',
    difficulty: 'Any',
    language: 'English',
    mood: 'Any',
    servings: '2',
    mealType: 'All Meal Types',
    chefPersona: 'Friendly Home Cook (Default)',
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (initialValues) {
        setFormData(prev => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const ingredients = await getIngredientsFromImage(base64String, file.type);
            setFormData(prev => ({ ...prev, ingredients }));
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "An unknown error occurred during image scanning.");
        setIsScanning(false);
    }
  };

  const handleVoiceInputClick = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    // Start recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Use webm for broader support or wav
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
             const base64String = (reader.result as string).split(',')[1];
             try {
                 const transcript = await transcribeAudio(base64String, audioBlob.type);
                 setFormData(prev => ({
                    ...prev,
                    ingredients: prev.ingredients ? `${prev.ingredients}, ${transcript}` : transcript
                  }));
             } catch (error) {
                 console.error("Transcription error:", error);
                 alert("Could not transcribe audio. Please try again.");
             }
        };
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone.");
    }
  };


  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center tracking-tight">Design Your Dish</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="ingredients" className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Ingredients</label>
          <textarea
            id="ingredients"
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            rows={3}
            className="w-full neu-input rounded-2xl p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all duration-300 resize-none"
            placeholder="e.g., 2 eggs, avocado, sourdough bread..."
            required
          />
        </div>
        
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />

        <div className="flex gap-3">
            <Button type="button" onClick={handleImageButtonClick} isLoading={isScanning} disabled={isLoading || isListening} className="w-full !py-2 !text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 !border-transparent shadow-none">
              <Image className="w-4 h-4 mr-2" /> {isScanning ? 'Scanning...' : 'Image'}
            </Button>
            <Button 
              type="button" 
              onClick={handleVoiceInputClick} 
              disabled={isLoading || isScanning} 
              className={`w-full !py-2 !text-sm !border-transparent shadow-none transition-all duration-300 ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              <Mic className={`w-4 h-4 mr-2`} />
              {isListening ? 'Stop Listening' : 'Record Voice'}
            </Button>
        </div>
        
        <Select
            label="Chef Persona"
            name="chefPersona"
            value={formData.chefPersona}
            onChange={handleChange}
            options={CHEF_PERSONAS}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            options={LANGUAGE_OPTIONS}
          />
           <Select
            label="Mood"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            options={MOOD_OPTIONS}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <Select
                label="Cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                options={CUISINE_OPTIONS}
            />
            <Select
                label="Meal Type"
                name="mealType"
                value={formData.mealType}
                onChange={handleChange}
                options={MEAL_TYPE_OPTIONS}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Select
              label="Difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              options={DIFFICULTY_OPTIONS}
            />
            <div>
              <label htmlFor="servings" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Servings</label>
              <input
                type="number"
                id="servings"
                name="servings"
                value={formData.servings}
                onChange={handleChange}
                min="1"
                className="w-full neu-input rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                placeholder="2"
              />
            </div>
        </div>
        
        <Select
            label="Diet Preference"
            name="diet"
            value={formData.diet}
            onChange={handleChange}
            options={DIET_OPTIONS}
        />
       
        <Button 
            type="submit" 
            isLoading={isLoading} 
            disabled={isScanning || isListening} 
            className="w-full !mt-8 !py-4 text-lg font-bold !bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_35px_rgba(244,63,94,0.4)] !rounded-2xl"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Recipe
        </Button>
      </form>
    </>
  );
};

export default RecipeForm;
