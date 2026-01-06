import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, MobileStepper } from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

const Onboarding = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);

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
        if (activeStep < slides.length - 1) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const finishOnboarding = () => {
        navigate('/chat');
    };

    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1a1a2e',
            color: 'white',
            position: 'relative',
            p: 3
        }}>
            <Box
                onClick={finishOnboarding}
                sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    cursor: 'pointer',
                    opacity: 0.7,
                    zIndex: 10
                }}
            >
                Skip
            </Box>

            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <Typography sx={{ fontSize: { xs: 60, sm: 80 }, mb: 2 }}>
                    {slides[activeStep].icon}
                </Typography>
                <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: { xs: '1.75rem', sm: '2.5rem' }
                }}>
                    {slides[activeStep].title}
                </Typography>
                <Typography sx={{
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    lineHeight: 1.6,
                    opacity: 0.9,
                    mb: 4,
                    maxWidth: 400
                }}>
                    {slides[activeStep].description}
                </Typography>
            </Box>

            <MobileStepper
                variant="dots"
                steps={slides.length}
                position="static"
                activeStep={activeStep}
                sx={{
                    bgcolor: 'transparent',
                    flexGrow: 1,
                    '& .MuiMobileStepper-dot': { bgcolor: 'rgba(255,255,255,0.3)' },
                    '& .MuiMobileStepper-dotActive': { bgcolor: 'white' }
                }}
                nextButton={
                    <Button
                        size="small"
                        onClick={handleNext}
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            bgcolor: 'primary.main',
                            px: 3,
                            borderRadius: 4,
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        {activeStep === slides.length - 1 ? 'Start' : 'Next'}
                        {activeStep !== slides.length - 1 && <KeyboardArrowRight />}
                    </Button>
                }
                backButton={
                    <Button
                        size="small"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        sx={{ color: 'white', opacity: activeStep === 0 ? 0 : 1 }}
                    >
                        <KeyboardArrowLeft />
                        Back
                    </Button>
                }
            />
        </Box>
    );
};

export default Onboarding;
