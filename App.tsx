import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { StepWizard } from './components/StepWizard';
import { FESTIVALS, LANGUAGES } from './constants';
import { CardState, Festival, Language, Template } from './types';
import { Editor } from './components/Editor';
import { FestivalCard } from './components/FestivalCard';
import { BackgroundGradient } from './components/BackgroundGradient';
import {
  ArrowLeft, Sparkles, ChevronRight, Loader2, Plus, Calendar,
  Sun, Flag, Flame, Heart, Flower2, Moon, Stethoscope,
  Wrench, Gift, PartyPopper, Crown, Star
} from 'lucide-react';
import { generateFestivalImage } from './services/geminiService';
import { useScrollReveal } from './hooks/useScrollReveal';

const App: React.FC = () => {
  const [state, setState] = useState<CardState>({
    step: 1,
    selectedFestival: null,
    selectedLanguage: null,
    selectedTemplate: null,
    recipientName: '',
    senderName: '',
    customMessage: '',
    textColor: '#FFFFFF', // Default White
    fontFamily: 'Poppins', // Default Modern
    fontSize: 'medium',
    logoPosition: 'top-left',
    logoScale: 1,
    textYOffset: 0,
    gradientOpacity: 0.8,
    aspectRatio: 'portrait',
  });

  const [generatedTemplates, setGeneratedTemplates] = useState<Template[]>([]);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Helper to get specific icons for festivals
  const getFestivalIcon = (id: string) => {
    // Increased stroke width for cuter, bolder look
    const iconClass = "w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300";
    const props = { className: iconClass, fill: "currentColor", fillOpacity: 0.2, strokeWidth: 2 };

    // ... (This function is now redundant as it's moved to FestivalCard, but keeping just in case or we can delete it)
    // We can remove it later to clean up.

    switch (id) {
      case 'pongal':
      case 'tamilnewyear':
      case 'karthigai':
        return <Sun {...props} />;
      case 'republic':
      case 'independence':
        return <Flag {...props} />;
      case 'thaipoosam':
      case 'diwali':
      case 'shivaratri':
      case 'vinayagar':
        return <Flame {...props} />;
      case 'valentine':
        return <Heart {...props} />;
      case 'womens':
        return <Crown {...props} />;
      case 'onam':
        return <Flower2 {...props} />;
      case 'eid':
        return <Moon {...props} />;
      case 'doctors':
        return <Stethoscope {...props} />;
      case 'ayudha':
        return <Wrench {...props} />;
      case 'christmas':
        return <Gift {...props} />;
      case 'newyear':
        return <PartyPopper {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  // Helper to determine the ACTUAL next occurrence of the festival
  const getNextOccurrence = (isoDateString: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const [_, month, day] = isoDateString.split('-').map(Number);
    // Construct date for the CURRENT calendar year
    const currentYearDate = new Date(now.getFullYear(), month - 1, day);

    // If the date has already passed this year, the next occurrence is next year
    if (currentYearDate < now) {
      currentYearDate.setFullYear(now.getFullYear() + 1);
    }
    return currentYearDate;
  };

  // Helper to get days remaining
  const getDaysRemaining = (isoDateString: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const target = getNextOccurrence(isoDateString);

    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Sort festivals: SHOW ONLY UPCOMING EVENTS automatically
  const sortedFestivals = useMemo(() => {
    return [...FESTIVALS]
      .sort((a, b) => {
        const nextA = getNextOccurrence(a.dateIso);
        const nextB = getNextOccurrence(b.dateIso);
        return nextA.getTime() - nextB.getTime();
      });
  }, []);

  // Scroll Reveal for Grid
  const gridRef = useScrollReveal();

  // Parallax Logic
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    // Dampen the movement
    setMousePos({
      x: (e.clientX - window.innerWidth / 2) * 0.02,
      y: (e.clientY - window.innerHeight / 2) * 0.02
    });
  };

  const nextStep = () => {
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setState(prev => ({ ...prev, step: prev.step - 1 }));
  };

  const handleFestivalSelect = (festival: Festival) => {
    // Clear customMessage to force regeneration in correct language/context
    setState(prev => ({ ...prev, selectedFestival: festival, customMessage: '' }));
    setGeneratedTemplates([]);
    nextStep();
  };

  const handleLanguageSelect = (language: Language) => {
    // Clear customMessage to force regeneration in correct language
    setState(prev => ({ ...prev, selectedLanguage: language, customMessage: '' }));
    nextStep();
  };

  const handleTemplateSelect = (template: Template) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
    nextStep();
  };

  const handleUpdateStyle = (key: 'textColor' | 'fontFamily', value: string) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateImage = async () => {
    if (!state.selectedFestival) return;

    setIsGeneratingImg(true);
    const imageUrl = await generateFestivalImage(state.selectedFestival.name);

    if (imageUrl) {
      const newTemplate: Template = {
        id: `gen-${Date.now()}`,
        imageUrl: imageUrl,
        thumbnailUrl: imageUrl,
        alt: `${state.selectedFestival.name} background`,
      };
      setGeneratedTemplates(prev => [newTemplate, ...prev]);
    }
    setIsGeneratingImg(false);
  };

  const reset = () => {
    setState({
      step: 1,
      selectedFestival: null,
      selectedLanguage: null,
      selectedTemplate: null,
      recipientName: '',
      senderName: '',
      customMessage: '',
      textColor: '#FFFFFF',
      fontFamily: 'Poppins',
    });
    setGeneratedTemplates([]);
  };

  return (
    <div
      className="min-h-screen bg-transparent pb-20 selection:bg-primary/20 selection:text-primary overflow-x-hidden relative"
      onMouseMove={handleMouseMove}
    >
      <BackgroundGradient />

      <div className="relative z-10">
        <Header />

        <main className="max-w-4xl mx-auto">
          <StepWizard currentStep={state.step} totalSteps={4} />

          <div className="px-4 py-2">
            {/* Step 1: Festival Selection with Hero */}
            {state.step === 1 && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12 pt-8">
                  <div className="inline-flex items-center justify-center p-2 bg-white rounded-full shadow-sm mb-6 animate-fade-in-up stagger-1">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Free Generator
                    </span>
                  </div>
                  <h1
                    className="text-4xl md:text-5xl font-bold text-textMain mb-4 leading-tight font-display animate-fade-in-up stagger-2"
                    style={{ transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)` }}
                  >
                    Share Your <span className="text-primary">Best Wishes</span>
                  </h1>

                  {/* Floating Elements for Parallax */}
                  <div className="absolute top-20 left-10 opacity-20 hidden md:block" style={{ transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)` }}>
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute top-40 right-20 opacity-10 hidden md:block" style={{ transform: `translate(${mousePos.x * -1.5}px, ${mousePos.y * 3}px)` }}>
                    <Star className="w-16 h-16 text-secondary" />
                  </div>

                  <p className="text-textSec text-lg max-w-xl mx-auto leading-relaxed animate-fade-in-up stagger-3">
                    Create beautiful greeting cards for upcoming festivals and special days in seconds.
                  </p>
                </div>

                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in-up stagger-3">
                  {sortedFestivals.map((festival, index) => {
                    // Safely extract colors to ensure high contrast
                    // bg-color-100 -> bg-color-50 (Lighter)
                    const bgClass = festival.color.split(' ')[0].replace('100', '50');
                    // text-color-800 -> text-color-600 (Vibrant but visible)
                    const textClass = festival.color.split(' ')[1].replace('800', '600');

                    // Calculate days remaining
                    const daysRemaining = getDaysRemaining(festival.dateIso);

                    // Determine badge text
                    let badgeText = '';
                    if (index === 0) {
                      if (daysRemaining === 0) badgeText = 'HAPPENING TODAY';
                      else if (daysRemaining === 1) badgeText = 'TOMORROW';
                      else badgeText = `IN ${daysRemaining} DAYS`;
                    }

                    return (
                      <FestivalCard
                        key={festival.id}
                        festival={festival}
                        index={index}
                        badgeText={badgeText}
                        onClick={() => handleFestivalSelect(festival)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Language Selection */}
            {state.step === 2 && (
              <div className="animate-fade-in-up max-w-lg mx-auto pt-4">
                <button onClick={prevStep} className="mb-8 text-sm text-textSec hover:text-textMain flex items-center gap-2 font-medium transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Go Back
                </button>

                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-textMain mb-3 font-display">Choose Language</h2>
                  <p className="text-textSec">Which language speaks to your heart?</p>
                </div>

                <div className="space-y-4">
                  {LANGUAGES.map((lang, idx) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className="w-full p-5 bg-surface rounded-2xl shadow-card hover:shadow-card-hover border-2 border-transparent hover:border-primary/20 transition-all duration-300 flex items-center justify-between group transform hover:scale-[1.01]"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-lg font-bold text-textMain font-display">{lang.name}</span>
                        <span className="text-sm text-textSec">{lang.nativeName}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Template Selection */}
            {state.step === 3 && state.selectedFestival && (
              <div className="animate-fade-in-up pt-4">
                <button onClick={prevStep} className="mb-8 text-sm text-textSec hover:text-textMain flex items-center gap-2 font-medium transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Back
                </button>

                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-textMain mb-3 font-display">Pick a Design</h2>
                  <p className="text-textSec">Select a beautiful background or create a unique one.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Generator Button */}
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImg}
                    className="aspect-[3/4] rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-4 hover:bg-primary/10 transition-all duration-300 group"
                  >
                    <div className="bg-white p-4 rounded-full shadow-soft group-hover:scale-110 transition-transform duration-300">
                      {isGeneratingImg ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <Plus className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-textMain text-sm">New Design</span>
                    </div>
                  </button>

                  {/* Generated Templates */}
                  {generatedTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="group relative rounded-3xl overflow-hidden aspect-[3/4] shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <img
                        src={template.thumbnailUrl}
                        alt={template.alt}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white text-primary px-5 py-2.5 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          Select This
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-primary text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> New
                      </div>
                    </button>
                  ))}

                  {/* Static Templates */}
                  {state.selectedFestival.templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="group relative rounded-3xl overflow-hidden aspect-[3/4] shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <img
                        src={template.thumbnailUrl}
                        alt={template.alt}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white text-primary px-5 py-2.5 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          Select This
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Editor */}
            {state.step === 4 && (
              <div className="animate-fade-in-up pt-4">
                <button onClick={prevStep} className="mb-8 text-sm text-textSec hover:text-textMain flex items-center gap-2 font-medium transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Back to Designs
                </button>

                <Editor
                  cardState={state}
                  onUpdateMessage={(msg) => setState(prev => ({ ...prev, customMessage: msg }))}
                  onUpdateSender={(name) => setState(prev => ({ ...prev, senderName: name }))}
                  onUpdateRecipient={(name) => setState(prev => ({ ...prev, recipientName: name }))}
                  onUpdateStyle={handleUpdateStyle}
                />

                <div className="mt-16 text-center">
                  <button
                    onClick={reset}
                    className="text-textSec hover:text-primary text-sm font-medium transition-colors flex items-center gap-2 mx-auto px-4 py-2 rounded-full hover:bg-white hover:shadow-sm"
                  >
                    Make Another Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;