
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Namaste! I am Maya 🙏",
            description: "I am your personal AI guide to the world of astrology. I'm here to greet you and help clarify your doubts.",
            icon: "🕉️"
        },
        {
            title: "Ask Guruji",
            description: "For deep spiritual questions and analyzing your chart, I will connect you with Guruji, our expert AI astrologer.",
            icon: "✨"
        },
        {
            title: "Ready to Begin?",
            description: "Your journey into the stars starts now. Let's discover what the cosmos has in store for you.",
            icon: "🚀"
        }
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            finishOnboarding();
        }
    };

    const finishOnboarding = () => {
        navigate('/chat');
    };

    return (
        <div className="onboarding-container" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', textAlign: 'center', padding: '20px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white'
        }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer', opacity: 0.7 }} onClick={finishOnboarding}>
                Skip
            </div>

            <div className="slide-content" style={{ maxWidth: '400px', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>
                    {slides[currentSlide].icon}
                </div>
                <h1 style={{ marginBottom: '15px', fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {slides[currentSlide].title}
                </h1>
                <p style={{ fontSize: '1.2rem', lineHeight: '1.6', opacity: 0.9, marginBottom: '40px' }}>
                    {slides[currentSlide].description}
                </p>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '30px' }}>
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: idx === currentSlide ? 'white' : 'rgba(255,255,255,0.3)',
                                transition: 'background 0.3s'
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    style={{
                        padding: '15px 40px', fontSize: '1.1rem', borderRadius: '30px', border: 'none',
                        background: 'linear-gradient(90deg, #ff8c00, #ff0080)', color: 'white', cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255, 100, 0, 0.4)', fontWeight: 'bold'
                    }}
                >
                    {currentSlide === slides.length - 1 ? "Start Chatting" : "Next"}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
