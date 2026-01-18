import React, { useRef, useEffect, useState } from 'react';
import { Download, Wand2, RefreshCcw, Share2, Type, Palette, Loader2, ChevronRight } from 'lucide-react';
import { CardState } from '../types';
import { generateAiWish } from '../services/geminiService';
import { FONT_OPTIONS, COLOR_OPTIONS, HOSPITAL_LOGO_BASE64 } from '../constants';
import { UI_TRANSLATIONS } from '../translations';

interface EditorProps {
  cardState: CardState;
  onUpdateMessage: (msg: string) => void;
  onUpdateSender: (name: string) => void;
  onUpdateRecipient: (name: string) => void;
  onUpdateStyle: (key: keyof CardState, value: any) => void;
}

export const Editor: React.FC<EditorProps> = ({
  cardState,
  onUpdateMessage,
  onUpdateSender,
  onUpdateRecipient,
  onUpdateStyle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTemplateIdRef = useRef<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helper to get localized text
  const t = (key: string, variables?: Record<string, string | number>) => {
    const langCode = cardState.selectedLanguage?.code || 'en';
    let text = UI_TRANSLATIONS[langCode]?.[key] || UI_TRANSLATIONS['en'][key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }
    return text;
  };

  // Default dimensions
  // Dynamic dimensions based on aspect ratio
  const getDimensions = () => {
    switch (cardState.aspectRatio) {
      case 'square': return { width: 1080, height: 1080 }; // 1:1 Instagram Post
      case 'story': return { width: 1080, height: 1920 };  // 9:16 Story/Status
      case 'portrait':
      default: return { width: 1080, height: 1350 };       // 4:5 Standard Card
    }
  };

  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = getDimensions();

  // Helper to calculate wrapped lines without drawing
  const getWrappedLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Draw function
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cardState.selectedTemplate) return;

    // Reset loaded state only if template changes to avoid flickering on text updates
    if (cardState.selectedTemplate.id !== lastTemplateIdRef.current) {
      setImageLoaded(false);
      lastTemplateIdRef.current = cardState.selectedTemplate.id;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load Main Background Image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = cardState.selectedTemplate.imageUrl;

    // Load Logo Image
    const logoImg = new Image();
    logoImg.src = HOSPITAL_LOGO_BASE64;

    // Wait for BG to load, logo loads instantly as data URI
    bgImg.onload = () => {
      // 1. Draw Image with Object-Fit: Cover
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
      let renderW, renderH, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        // Image is wider than canvas (Crop sides)
        renderH = CANVAS_HEIGHT;
        renderW = renderH * imgRatio;
        offsetX = (CANVAS_WIDTH - renderW) / 2;
        offsetY = 0;
      } else {
        // Image is taller than canvas (Crop top/bottom)
        renderW = CANVAS_WIDTH;
        renderH = renderW / imgRatio;
        offsetX = 0;
        offsetY = (CANVAS_HEIGHT - renderH) / 2;
      }

      ctx.drawImage(bgImg, offsetX, offsetY, renderW, renderH);

      // Now load and draw logo immediately after BG is ready
      if (logoImg.complete) {
        drawOverlays(ctx, logoImg);
      } else {
        logoImg.onload = () => drawOverlays(ctx, logoImg);
      }
    };

    bgImg.onerror = () => {
      // Retry once with cache buster to handle potential CORS/Cache invalidation issues
      if (!bgImg.src.includes('retry=true')) {
        console.log("Retrying image load with cache buster...");
        const separator = bgImg.src.includes('?') ? '&' : '?';
        bgImg.src = bgImg.src + separator + 'retry=true';
        return;
      }

      console.error("Failed to load background image:", cardState.selectedTemplate.imageUrl);
      setImageLoaded(true); // Stop the spinner even if failed
      // Draw a fallback background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ef4444'; // Red text for error
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('renderingError'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    };

    // Finalize
    // Finalize
    setDownloadUrl(canvas.toDataURL('image/png', 1.0)); // High Quality
    setImageLoaded(true);
  };

  const drawOverlays = (ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement) => {
    // 2. Add Overlay Gradients

    // Top Gradient (for Logo visibility)
    const topGradient = ctx.createLinearGradient(0, 0, 0, 300);
    topGradient.addColorStop(0, "rgba(0,0,0,0.7)");
    topGradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 300);

    // Bottom Gradient (for Message visibility)
    const bottomGradientHeight = CANVAS_HEIGHT * 0.45; // 45% of height
    const bottomGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - bottomGradientHeight, 0, CANVAS_HEIGHT);
    bottomGradient.addColorStop(0, "rgba(0,0,0,0)");
    bottomGradient.addColorStop(0.5, `rgba(0,0,0,${cardState.gradientOpacity * 0.5})`);
    bottomGradient.addColorStop(1, `rgba(0,0,0,${cardState.gradientOpacity})`);
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - bottomGradientHeight, CANVAS_WIDTH, bottomGradientHeight);


    // 3. HEADER & LOGO
    const margin = 50;
    const baseLogoSize = 100; // Increased base size for higher resolution
    const logoSize = baseLogoSize * (cardState.logoScale || 1);

    // Calculate Position
    let logoX = margin;
    let logoY = margin;
    let textX = margin + logoSize + 25;
    let textY = margin + (logoSize / 2);
    let textAlign: CanvasTextAlign = 'left';

    // Position Logic
    if (cardState.logoPosition === 'top-right') {
      logoX = CANVAS_WIDTH - margin - logoSize;
      logoY = margin;
      textX = logoX - 25;
      textY = logoY + (logoSize / 2);
      textAlign = 'right';
    } else if (cardState.logoPosition === 'bottom-left') {
      logoX = margin;
      logoY = CANVAS_HEIGHT - margin - logoSize;
      textX = logoX + logoSize + 25;
      textY = logoY + (logoSize / 2);
      textAlign = 'left';
    } else if (cardState.logoPosition === 'bottom-right') {
      logoX = CANVAS_WIDTH - margin - logoSize;
      logoY = CANVAS_HEIGHT - margin - logoSize;
      textX = logoX - 25;
      textY = logoY + (logoSize / 2);
      textAlign = 'right';
    }

    // Draw Logo Icon
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // Draw Header Text
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    // "SOORIYA HOSPITAL"
    ctx.font = '800 42px "Poppins", sans-serif'; // Larger for Hi-Res
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(t('hospitalName'), textX, textY - 10);

    // "GREETINGS"
    ctx.font = '600 20px "Poppins", sans-serif';
    ctx.fillStyle = '#FFCCBC'; // Soft Peach/Orange
    ctx.shadowBlur = 2;
    ctx.fillText(t('greetings'), textX + (textAlign === 'left' ? 2 : -2), textY + 18);


    // 4. MESSAGE CONTENT (Bottom Half)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // -- Define Fonts --
    const selectedFont = FONT_OPTIONS.find(f => f.id === cardState.fontFamily)?.family || '"Poppins", sans-serif';
    const isScript = cardState.fontFamily === 'Great Vibes';

    // Font Size Logic (Scaled for higher resolution)
    let baseSize = isScript ? 86 : 58;
    if (cardState.fontSize === 'small') baseSize *= 0.8;
    if (cardState.fontSize === 'large') baseSize *= 1.2;

    const messageFont = `500 ${baseSize}px ${selectedFont}`;
    const senderFont = '400 36px "Inter", sans-serif';

    const isDarkText = ['#1E293B', '#000000'].includes(cardState.textColor);

    // Calculate positions starting from bottom up
    const bottomPadding = 80;
    // Apply user vertical offset
    let currentY = CANVAS_HEIGHT - bottomPadding - (cardState.textYOffset || 0);

    // -- Draw Sender Name --
    if (cardState.senderName) {
      ctx.font = senderFont;
      ctx.fillStyle = isDarkText ? '#475569' : '#e2e8f0';
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(`- ${cardState.senderName}`, CANVAS_WIDTH / 2, currentY);
      currentY -= 80;
    }

    // -- Draw Message --
    const message = cardState.customMessage || (isGenerating ? t('drafting') : `${t('happy')} ${cardState.selectedFestival?.name}!`);
    ctx.font = messageFont;
    ctx.fillStyle = cardState.textColor;

    // Stronger shadow for message clarity
    ctx.shadowColor = isDarkText ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const maxWidth = CANVAS_WIDTH * 0.85;
    const lineHeight = isScript ? (baseSize * 1.2) : (baseSize * 1.3);

    const lines = getWrappedLines(ctx, message, maxWidth);
    const messageHeight = lines.length * lineHeight;

    const messageStartY = currentY - messageHeight;

    lines.forEach((line, index) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, messageStartY + (index * lineHeight));
    });

    // Update state to trigger re-render of canvas URL
    setDownloadUrl(ctx.canvas.toDataURL('image/png'));
    setImageLoaded(true);
  };

  useEffect(() => {
    drawCard();
    drawCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardState]);

  const handleGenerateWish = async () => {
    if (!cardState.selectedFestival || !cardState.selectedLanguage) return;

    setIsGenerating(true);
    const wish = await generateAiWish(
      cardState.selectedFestival.name,
      cardState.selectedFestival.id, // Passed ID for translation lookup
      cardState.selectedLanguage.name,
      cardState.selectedLanguage.nativeName, // Pass native name for better prompt context
      cardState.selectedLanguage.code, // Pass code for fallback logic
      cardState.senderName || 'Sender',
      cardState.recipientName || 'Friend'
    );
    onUpdateMessage(wish);
    setIsGenerating(false);
  };

  // No longer auto-generating wish on mount to avoid blocking the user
  // Default message will be used if customMessage is empty
  /* 
  useEffect(() => {
    if (!cardState.customMessage) {
      handleGenerateWish();
    }
  }, []);
  */

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.download = `sooriya-hospital-greeting-${Date.now()}.png`;
      link.href = downloadUrl;
      link.click();
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'greeting.png', { type: 'image/png' });

      if (navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: `Wishing you a Happy ${cardState.selectedFestival?.name}!`,
            text: cardState.customMessage || 'Best wishes from Sooriya Hospital.',
          });
        } catch (err) {
          console.error('Error sharing:', err);
        }
      } else {
        alert('Sharing is not supported on this browser. Please download the image instead.');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fade-in-up">

      {/* Controls */}
      <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-card border border-white order-2 lg:order-1">

        {/* Section: Content (PRIORITY) */}
        <div className="mb-8 pb-8 border-b border-gray-100">
          <h3 className="text-sm font-bold text-textSec uppercase tracking-wider mb-4 flex items-center gap-2">
            <Type className="w-4 h-4" /> {t('personalize')}
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textSec mb-2 pl-1">{t('fromName')}</label>
                <input
                  type="text"
                  value={cardState.senderName}
                  onChange={(e) => onUpdateSender(e.target.value)}
                  placeholder="e.g. Dr. Anand"
                  className="w-full p-3 bg-cream border-2 border-transparent rounded-xl focus:bg-white focus:border-primary/30 outline-none transition-all text-sm"
                />
              </div>
              <div>
                {/* Replaced 'To' with 'Festive Name' conceptual equivalent if 'To' was deemed less important, 
                     but user asked for 'festive name is important' which usually implies the greeting text or the festival name itself. 
                     The current codebase has 'Recipient Name' as 'To'. 
                     The user said "festive name is important". 
                     If 'Festive Name' refers to the Festival Name itself, it's already selected. 
                     If it refers to a custom text for the festival, it might be the message.
                     The user also said "from name sender is import".
                     I will keep 'To' but maybe rename label if needed, but for now prioritization is the key.
                     Let's put 'From' and 'To' first as requested.
                 */}
                <label className="block text-sm font-medium text-textSec mb-2 pl-1">{t('toName')}</label>
                <input
                  type="text"
                  value={cardState.recipientName}
                  onChange={(e) => onUpdateRecipient(e.target.value)}
                  placeholder="e.g. Priya"
                  className="w-full p-3 bg-cream border-2 border-transparent rounded-xl focus:bg-white focus:border-primary/30 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 pl-1">
                <label className="block text-sm font-medium text-textSec">{t('message')}</label>
                <button
                  onClick={handleGenerateWish}
                  disabled={isGenerating}
                  className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {isGenerating ? t('drafting') : t('aiReword')}
                </button>
              </div>
              <textarea
                value={cardState.customMessage}
                onChange={(e) => onUpdateMessage(e.target.value)}
                placeholder={isGenerating ? t('translating') : `${t('writeWarm')} ${cardState.selectedFestival?.name} ${t('wishHere')}...`}
                rows={3}
                maxLength={100}
                className="w-full p-4 bg-cream border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none placeholder-gray-400 text-textMain"
              />
            </div>
          </div>
        </div>

        {/* Section: Advanced Styling (Collapsible) */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-left group"
          >
            <span className="font-bold text-textMain flex items-center gap-2">
              <Palette className="w-4 h-4 text-textSec group-hover:text-primary transition-colors" />
              {t('advancedOptions')}
            </span>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showAdvanced ? 'rotate-90' : ''}`} />
          </button>

          <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="min-h-0">

              {/* Layout Selection */}
              <div className="mb-8 pb-8 border-b border-gray-100">
                <h3 className="text-xs font-bold text-textSec uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Share2 className="w-3 h-3" /> {t('cardLayout')}
                </h3>
                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                  {[
                    { id: 'square', label: t('postSquare'), ratio: '1:1' },
                    { id: 'portrait', label: t('cardPortrait'), ratio: '4:5' },
                    { id: 'story', label: t('storyFull'), ratio: '9:16' }
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => onUpdateStyle('aspectRatio', layout.id)}
                      className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${cardState.aspectRatio === layout.id
                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-textMain hover:bg-white/50'
                        }`}
                    >
                      <span>{layout.label}</span>
                      <span className="text-[10px] opacity-60 font-normal">{layout.ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Customization */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-textSec uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> {t('customizeStyle')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Font Selection */}
                  <div>
                    <label className="text-xs font-semibold text-textMain mb-2 block">{t('typography')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => onUpdateStyle('fontFamily', font.id)}
                          className={`px-3 py-2 rounded-lg text-sm border transition-all ${cardState.fontFamily === font.id
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-textMain border-gray-200 hover:border-primary/50'
                            }`}
                          style={{ fontFamily: font.family }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="text-xs font-semibold text-textMain mb-2 block">{t('textColor')}</label>
                    <div className="flex gap-3">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => onUpdateStyle('textColor', color.value)}
                          className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${cardState.textColor === color.value
                            ? 'border-primary scale-110 shadow-md ring-2 ring-primary/20'
                            : 'border-gray-200 hover:scale-105'
                            }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        >
                          {cardState.textColor === color.value && (
                            <div className={`w-2.5 h-2.5 rounded-full ${['white', 'gold'].includes(color.id) ? 'bg-black' : 'bg-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Font Size Selection */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="text-xs font-bold text-textMain mb-3 block uppercase tracking-wider">{t('fontSize')}</label>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => onUpdateStyle('fontSize', size)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all uppercase tracking-wide ${cardState.fontSize === size
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                          : 'bg-white text-textSec border-gray-100 hover:border-primary/30 hover:text-primary'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {/* Advanced Layout Controls */}
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    <h3 className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">{t('detailedAdjustments')}</h3>

                    {/* Logo Position */}
                    <div>
                      <label className="text-xs text-textSec mb-1 block">{t('logoPosition')}</label>
                      <div className="grid grid-cols-2 gap-2 max-w-[120px]">
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                          <button
                            key={pos}
                            onClick={() => onUpdateStyle('logoPosition', pos)}
                            className={`h-8 rounded-md border-2 transition-all ${cardState.logoPosition === pos
                              ? 'bg-primary border-primary'
                              : 'bg-gray-100 border-transparent hover:bg-gray-200'
                              }`}
                            title={pos.replace('-', ' ')}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Text Offset */}
                      <div>
                        <label className="text-xs text-textSec mb-1 block flex justify-between">
                          <span>{t('textHeight')}</span>
                          <span className="text-[10px] bg-gray-100 px-1 rounded">{cardState.textYOffset || 0}</span>
                        </label>
                        <input
                          type="range"
                          min="-50" max="400" step="10"
                          value={cardState.textYOffset || 0}
                          onChange={(e) => onUpdateStyle('textYOffset', parseInt(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Logo Size */}
                      <div>
                        <label className="text-xs text-textSec mb-1 block flex justify-between">
                          <span>{t('logoSize')}</span>
                          <span className="text-[10px] bg-gray-100 px-1 rounded">{Math.round((cardState.logoScale || 1) * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0.5" max="1.5" step="0.1"
                          value={cardState.logoScale || 1}
                          onChange={(e) => onUpdateStyle('logoScale', parseFloat(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Gradient Opacity */}
                      <div className="col-span-2">
                        <label className="text-xs text-textSec mb-1 block flex justify-between">
                          <span>{t('readability')}</span>
                          <span className="text-[10px] bg-gray-100 px-1 rounded">{Math.round((cardState.gradientOpacity || 0.8) * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0" max="1" step="0.1"
                          value={cardState.gradientOpacity === undefined ? 0.8 : cardState.gradientOpacity}
                          onChange={(e) => onUpdateStyle('gradientOpacity', parseFloat(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            disabled={!imageLoaded}
            className="col-span-1 bg-gray-900 text-white hover:bg-black font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Share2 className="w-5 h-5" />
            {t('share')}
          </button>
          <button
            onClick={handleDownload}
            disabled={!imageLoaded}
            className="col-span-1 bg-primary hover:bg-[#FF7043] text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/25"
          >
            <Download className="w-5 h-5" />
            {t('save')}
          </button>
        </div>
      </div>

      {/* Preview - Sticky on Desktop */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-28 flex justify-center items-center p-8 lg:p-10 bg-cream/50 rounded-3xl border border-white/50 transition-all">
        <div className="relative group perspective-1000">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto max-w-[360px] rounded-xl shadow-2xl transition-transform duration-500 ease-out transform group-hover:rotate-1 group-hover:scale-[1.01]"
          />

          {/* Loading Overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl transition-all duration-300">
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border border-primary/20 animate-fade-in-up">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-xs font-bold text-primary uppercase tracking-wider animate-pulse">{t('rendering')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generating Overlay - Full Screen or Modal Style */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 border border-white/20">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Wand2 className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('aiWriting')}</h3>
              <p className="text-gray-500 text-sm">
                {t('aiCrafting')}
                <br />{t('takesSeconds')}
              </p>
            </div>

            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminate"></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};