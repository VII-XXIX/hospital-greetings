import React, { useEffect, useRef, useState, useMemo } from 'react';

interface ScrollSequenceProps {
    frameCount: number;
    containerHeight: string;
}

export const ScrollSequence: React.FC<ScrollSequenceProps> = ({ frameCount, containerHeight }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const images = useRef<HTMLImageElement[]>([]);
    const [imagesLoaded, setImagesLoaded] = useState(0);

    // Pad the index with leading zeros (e.g., 1 -> 00001)
    const padIndex = (index: number) => index.toString().padStart(5, '0');

    useEffect(() => {
        // Preload images
        const preloadImages = () => {
            for (let i = 1; i <= frameCount; i++) {
                const img = new Image();
                img.src = `/asset/home/${padIndex(i)}.png`;
                img.onload = () => {
                    setImagesLoaded(prev => prev + 1);
                };
                images.current[i - 1] = img;
            }
        };

        preloadImages();
    }, [frameCount]);

    const updateCanvas = (index: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = images.current[index];
        if (img && img.complete) {
            // Calculate aspect ratio to cover or contain
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const imgWidth = img.width;
            const imgHeight = img.height;

            const ratio = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
            const x = (canvasWidth - imgWidth * ratio) / 2;
            const y = (canvasHeight - imgHeight * ratio) / 2;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(img, x, y, imgWidth * ratio, imgHeight * ratio);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const scrollPercent = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
            const frameIndex = Math.min(frameCount - 1, Math.floor(scrollPercent * frameCount));

            requestAnimationFrame(() => updateCanvas(frameIndex));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial draw
        updateCanvas(0);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [frameCount, imagesLoaded]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            updateCanvas(0);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div ref={containerRef} style={{ height: containerHeight }} className="relative w-full overflow-hidden">
            <div className="sticky top-0 w-full h-screen">
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                {imagesLoaded < frameCount && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cream/50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${(imagesLoaded / frameCount) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-primary">LOADING EXPERIENCE...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
