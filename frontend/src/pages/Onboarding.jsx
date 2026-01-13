import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Header from '../components/header';
import PrimaryButton from '../components/PrimaryButton';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

const Onboarding = () => {
    const navigate = useNavigate();
    const [activeDot, setActiveDot] = useState(0);

    // Retrieve user name from local storage or set default
    const name = localStorage.getItem('userName') || "User";

    const handleBack = () => {
        setActiveDot((prev) => Math.max(prev - 1, 0));
    };

    const handleConfirm = () => {
        if (activeDot < 2) {
            setActiveDot((prev) => prev + 1);
        } else {
            console.log("Onboarding completed");
            navigate('/chat');
        }
    };

    const getCardContent = (name) => [
        {
            title: (
                <>
                    Hello {name}, <br />
                    I’m <span style={{ color: "#F36A2F", fontWeight: 600 }}>MAYA</span>.
                </>
            ),
            paragraphs: [
                <>
                    I’m your{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        AI assistant to help you with consulting our astrologers
                    </span>{" "}
                    via this Findastro.
                </>,
                <>
                    As an AI I have certain capabilities, but before that allow me to
                    explain what to expect from this Findastro platform.
                </>,
            ],
            points: [
                <span>
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        All conversations
                    </span>{" "}
                    between you and your astrologer{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>stays private</span>
                    . I assure you, no other humans read your conversations.
                </span>,
                <span>
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        {" "}
                        Our astrologers take help of Softwares and/or AI{" "}
                    </span>{" "}
                    for giving you the right predictions with the right calculations as fast
                    as possible,{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        because accuracy and time is valuable for both of us.
                    </span>
                    .
                </span>,
            ],
        },
        {
            title: (
                <>
                    I have certain{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>capabilities</span>.
                </>
            ),
            paragraphs: [<></>],
            points: [
                <>
                    Understand your question(s) and{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        help you to ask the right questions
                    </span>
                    , ask better follow up questions, etc. Your astrologer will not know
                    this.
                </>,
                <>
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        Help you understand the astrologer’s prediction
                    </span>{" "}
                    it a better way, if applicable and{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        summarize the predictions
                    </span>
                    , remedies, etc if applicable.{" "}
                </>,
                <>
                    Help you{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        visualize certain predictions
                    </span>
                    . For example a timeline.
                </>,
                <>
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        Give you reminders
                    </span>{" "}
                    to take on remedies, rituals, dasa changes, etc.
                </>,
            ],
        },

        {
            title: (
                <>
                    … and I have certain{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        responsibilities
                    </span>
                </>
            ),
            paragraphs: [<></>],
            points: [
                <>
                    To{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        prevent the misuse
                    </span>{" "}
                    of the platform, pass only astrologically relevant questions to the
                    astrologer.{" "}
                </>,
                <>
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>Prevent</span>{" "}
                    astrologers from answering questions on{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        restricted topics
                    </span>
                    .
                </>,
                <>
                    Identify if a question (or answer) is beyond our{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>free-to-use</span>{" "}
                    policy and notify you regarding the{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        astrologer fees
                    </span>
                    .
                </>,
                <>
                    I’ll always be your{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        friendly AI assistant
                    </span>{" "}
                    working for{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        your better experience
                    </span>
                    .
                </>,
            ],
            highlights: [
                <>
                    Always{" "}
                    <span style={{ color: "#F36A2F", fontWeight: 600 }}>
                        please be respectful to the astrologer
                    </span>
                    . <br />
                    Happy consultation!
                </>,
            ],
        },
    ];

    const data = getCardContent(name)[activeDot];

    return (
        <Box>
            <Header />

            <Box sx={{ width: "100%", px: 3, py: 4 }}>
                {/* Avatar */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: -5,
                        position: "relative",
                        zIndex: 2,
                    }}
                >
                    <Box
                        component="img"
                        src="/svg/guruji_illustrated.svg"
                        alt="MAYA"
                        sx={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            border: "6px solid #F36A2F",
                            bgcolor: "#fff",
                        }}
                    />
                </Box>

                {/* Card */}
                <Box
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 2,
                        p: 3,
                        pt: 7,
                        boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
                        height: { xs: '100%', sm: 500 },
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Main Content */}
                    <Box>
                        <Typography sx={{ fontSize: '.9rem', mb: 2 }}>{data.title}</Typography>

                        {data.paragraphs.map((p, i) => (
                            <Typography key={i} sx={{ fontSize: '.9rem', mb: 2 }}>
                                {p}
                            </Typography>
                        ))}

                        {data.points.length > 0 && (
                            <Box component="ol" sx={{ pl: 0 }}>
                                {data.points.map((point, i) => (
                                    <Typography
                                        key={i}
                                        component="li"
                                        sx={{
                                            fontSize: '.9rem',
                                            mb: 2,
                                            listStyleType: "decimal",
                                            listStylePosition: "inside",
                                        }}
                                    >
                                        {point}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {/* Push highlight to bottom */}
                    {data.highlights && (
                        <Box
                            sx={{
                                mt: "auto",
                                backgroundColor: "#fff4e5",
                                p: 2,
                                borderRadius: 1,
                                fontSize: '.9rem',
                            }}
                        >
                            {data.highlights}
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 3,
                    }}
                >
                    {activeDot > 0 ? (
                        <Typography sx={{ fontSize: '.9rem', cursor: "pointer" }} onClick={handleBack}>
                            &lt; Back
                        </Typography>
                    ) : (
                        <Box /> // Empty placeholder to keep layout balanced
                    )}

                    {/* Dots */}
                    <Box sx={{ display: "flex", gap: { xs: .8, sm: 1.3 } }}>
                        {[0, 1, 2].map((i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: { xs: 15, sm: 20 },
                                    height: { xs: 15, sm: 20 },
                                    borderRadius: "50%",
                                    bgcolor: activeDot === i ? "#F36A2F" : "rgba(243,106,47,0.3)",
                                }}
                            />
                        ))}
                    </Box>

                    <PrimaryButton
                        label={activeDot < 2 ? "I understand" : "Consult now"}
                        onClick={handleConfirm}
                        endIcon={<KeyboardDoubleArrowRightIcon sx={{ fontSize: '40px' }} />}
                        sx={{ borderRadius: 5, width: { xs: '55%', sm: '40%' } }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Onboarding;
