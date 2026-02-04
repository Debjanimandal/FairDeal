'use client';

import React, { useEffect, useRef } from 'react';

const Sparkles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        class Particle {
            x: number;
            y: number;
            size: number;
            speedY: number;
            speedX: number;
            opacity: number;
            maxOpacity: number;
            fadeSpeed: number;

            constructor(canvasWidth: number, canvasHeight: number) {
                this.x = Math.random() * canvasWidth;
                this.y = -Math.random() * canvasHeight; // Start above screen
                this.size = Math.random() * 1.5 + 0.5; // Small: 0.5 to 2.0 range
                this.speedY = Math.random() * 0.4 + 0.2; // Slower: 0.2 to 0.6 range
                this.speedX = (Math.random() - 0.5) * 0.1;
                this.opacity = 0;
                this.maxOpacity = Math.random() * 0.6 + 0.2;
                this.fadeSpeed = 0.005 + Math.random() * 0.005;
            }

            update(canvasWidth: number, canvasHeight: number) {
                this.y += this.speedY;
                this.x += this.speedX;

                if (this.opacity < this.maxOpacity) {
                    this.opacity += this.fadeSpeed;
                }

                if (this.y > canvasHeight + 10) {
                    this.y = -10;
                    this.x = Math.random() * canvasWidth;
                    this.opacity = 0;
                }
            }

            draw(context: CanvasRenderingContext2D) {
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                context.shadowBlur = 10;
                context.shadowColor = 'white';
                context.fill();
            }
        }

        const init = () => {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update(canvas.width, canvas.height);
                particles[i].draw(ctx);
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
};

export default Sparkles;
