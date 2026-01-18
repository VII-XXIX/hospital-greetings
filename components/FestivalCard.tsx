import React, { useRef, useState } from 'react';
import { Sparkles, ChevronRight, Sun, Flag, Flame, Heart, Flower2, Moon, Stethoscope, Wrench, Gift, PartyPopper, Crown } from 'lucide-react';
import { Festival, LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../translations';

interface FestivalCardProps {
    festival: Festival;
    index: number;
    badgeText?: string;
    onClick: () => void;
    languageCode: LanguageCode;
}

export const FestivalCard: React.FC<FestivalCardProps> = ({ festival, index, badgeText, onClick, languageCode }) => {
    const cardRef = useRef<HTMLButtonElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    const t = (key: string) => {
        return UI_TRANSLATIONS[languageCode]?.[key] || UI_TRANSLATIONS['en'][key] || key;
    };

    // 3D Tilt Logic
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
    };

    const getFestivalIcon = (id: string) => {
        const iconClass = "w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300";
        const props = { className: iconClass, fill: "currentColor", fillOpacity: 0.2, strokeWidth: 2 };

        switch (id) {
            case 'pongal': case 'tamilnewyear': case 'karthigai': return <Sun {...props} />;
            case 'republic': case 'independence': return <Flag {...props} />;
            case 'thaipoosam': case 'diwali': case 'shivaratri': case 'vinayagar': return <Flame {...props} />;
            case 'valentine': return <Heart {...props} />;
            case 'womens': return <Crown {...props} />;
            case 'onam': return <Flower2 {...props} />;
            case 'eid': return <Moon {...props} />;
            case 'doctors': return <Stethoscope {...props} />;
            case 'ayudha': return <Wrench {...props} />;
            case 'christmas': return <Gift {...props} />;
            case 'newyear': return <PartyPopper {...props} />;
            default: return <Sparkles {...props} />;
        }
    };

    const bgClass = festival.color.split(' ')[0].replace('100', '50');
    const textClass = festival.color.split(' ')[1].replace('800', '600');

    return (
        <button
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative glass-card p-5 rounded-3xl transition-all duration-300 text-left overflow-hidden flex flex-col h-full perspective-1000 hover:shadow-2xl hover:bg-white/20"
            style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`,
                transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
            }}
        >
            {/* Badge */}
            {index === 0 && badgeText && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" />
                    {badgeText}
                </div>
            )}

            {/* Glossy Reflection Effect */}
            <div
                className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
                    transform: `translateX(${rotation.y * 2}px) translateY(${rotation.x * 2}px)`
                }}
            />

            <div className="flex flex-col items-center justify-center py-6 flex-grow relative z-10 transition-transform duration-300 group-hover:translate-z-10" style={{ transformStyle: 'preserve-3d' }}>
                {/* Decorative Background blob */}
                <div className={`
           absolute inset-0 opacity-10 rounded-3xl transform scale-75 group-hover:scale-95 transition-transform duration-500
           ${bgClass.replace('bg-', 'bg-')} 
        `}></div>

                {/* Icon Container */}
                <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-transform duration-300 shadow-sm ${bgClass} ${textClass}`}
                    style={{ transform: `translateZ(20px)` }}
                >
                    <div className="animate-wiggle">
                        {getFestivalIcon(festival.id)}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-textMain mb-1 font-display text-center" style={{ transform: `translateZ(10px)` }}>{t(festival.id)}</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 transition-colors ${index === 0
                    ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                    : 'bg-cream text-textSec group-hover:bg-primary group-hover:text-white'
                    }`}>
                    {festival.date}
                </span>
            </div>

            <div className="border-t border-gray-50 pt-3 mt-auto relative z-10">
                <div className="flex items-center justify-center text-sm text-primary font-medium opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    {t('createCard')} <ChevronRight className="w-4 h-4 ml-1" />
                </div>
            </div>
        </button>
    );
};
