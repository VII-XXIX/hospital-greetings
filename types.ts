export type LanguageCode = 'en' | 'ta' | 'kn' | 'hi' | 'te';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export interface Template {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  alt: string;
  languageCode?: LanguageCode;
}

export interface Festival {
  id: string;
  name: string;
  date: string;
  dateIso: string; // YYYY-MM-DD for accurate sorting
  color: string;
  templates: Template[];
}

export interface CardState {
  step: number;
  selectedFestival: Festival | null;
  selectedLanguage: Language | null;
  selectedTemplate: Template | null;
  recipientName: string;
  senderName: string;
  customMessage: string;
  textColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logoScale: number; // 0.5 to 1.5
  textYOffset: number; // -100 to 100
  gradientOpacity: number; // 0 to 1
  aspectRatio: 'square' | 'portrait' | 'story';
}