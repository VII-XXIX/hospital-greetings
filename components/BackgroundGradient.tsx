import React from 'react';

export const BackgroundGradient: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Base Background */}
            <div className="absolute inset-0 bg-[#FFFBF7]"></div>

            {/* Moving Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-blob mix-blend-multiply filter"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-300/20 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply filter"></div>

            {/* Grain Overlay for Texture (Premium Feel) */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>
    );
};
