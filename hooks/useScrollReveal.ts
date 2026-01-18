import { useEffect, useRef } from 'react';

export const useScrollReveal = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-visible');
                        observer.unobserve(entry.target); // Only animate once
                    }
                });
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: '50px',
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            // Add initial class
            currentRef.classList.add('reveal-up');
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return ref;
};
