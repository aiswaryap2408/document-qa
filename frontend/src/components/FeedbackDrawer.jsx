import React, { useState, useEffect } from "react";
import { Box, Drawer, Typography, TextField, Button } from "@mui/material";
import StarRateIcon from '@mui/icons-material/StarRate';

const FeedbackDrawer = ({
    open,
    onClose,
    onSubmit,
    onAddDakshina,
    onNewJourney
}) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (open) {
            setRating(0);
            setFeedback("");
            setSubmitted(false);
        }
    }, [open]);

    const handleSubmit = () => {
        setSubmitted(true);
        if (onSubmit) {
            onSubmit(rating, feedback);
        }
    };

    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
                sx: {
                    bgcolor: "#5AA270",
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    px: 3,
                    pt: 3,
                    pb: 1.5,
                    maxWidth: 450,
                    mx: "auto",
                    minHeight: submitted ? 250 : 'auto', // Ensure height for success message
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: submitted ? 'center' : 'flex-start'
                },
            }}
        >
            {!submitted ? (
                <>
                    <Typography
                        sx={{
                            textAlign: "center",
                            color: "#fff",
                            fontSize: 16,
                            mb: 1,
                            fontWeight: 400,
                        }}
                    >
                        Feedback (Optional)
                    </Typography>

                    <TextField
                        multiline
                        minRows={4}
                        placeholder="Give your feedback here"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        fullWidth
                        InputProps={{
                            sx: {
                                bgcolor: "#fff",
                                borderRadius: 1,
                                fontSize: 14,
                                border: "none",
                                "& .MuiOutlinedInput-notchedOutline": { border: "none" }
                            },
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Typography sx={{ color: "#fff", textAlign: "center", mb: .5 }}>
                        Please rate your consultation:
                    </Typography>

                    {/* Stars */}
                    <Box display="flex" justifyContent="center" mb={0}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Box
                                key={star}
                                onClick={() => setRating(star)}
                                sx={{
                                    mx: 1,
                                    mb: 1,
                                    cursor: "pointer",
                                    color: star <= rating ? "#fff" : "rgba(255,255,255,0.4)",
                                    transition: "0.2s",
                                    transform: star <= rating ? "scale(1.1)" : "scale(1)",
                                }}
                            >
                                <StarRateIcon sx={{ fontSize: 45 }} />
                            </Box>
                        ))}
                    </Box>

                    <Button
                        onClick={handleSubmit}
                        sx={{
                            bgcolor: "#fff",
                            color: "#5AA270",
                            borderRadius: 30,
                            height: 42,
                            fontSize: 16,
                            textTransform: "none",
                            width: "30%",
                            mx: "auto",
                            "&:hover": {
                                bgcolor: "#f3f3f3",
                            },
                        }}
                    >
                        Ok
                    </Button>
                </>
            ) : (
                <Box sx={{ textAlign: 'center', color: '#fff' }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>
                        Rating / Feedback received
                    </Typography>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.6, mb: 4 }}>
                        Thank you for your feedback/rating. This for sure will help us continue improving the service.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            onClick={onAddDakshina}
                            sx={{
                                bgcolor: "#fff",
                                color: "#5AA270",
                                borderRadius: 30,
                                height: 42,
                                fontSize: 14,
                                width: "45%",
                                textTransform: "none",
                                fontWeight: 700,
                                "&:hover": { bgcolor: "#f3f3f3" },
                            }}
                        >
                            Add Dakshina
                        </Button>
                        <Button
                            onClick={onNewJourney}
                            sx={{
                                bgcolor: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                borderRadius: 30,
                                height: 42,
                                fontSize: 14,
                                width: "45%",
                                textTransform: "none",
                                border: '1px solid #fff',
                                fontWeight: 600,
                                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                            }}
                        >
                            New Journey
                        </Button>
                    </Box>
                </Box>
            )}
        </Drawer>
    );
};

export default FeedbackDrawer;
