import { Box, Drawer, Typography, TextField, Button } from "@mui/material";
import { useState, useEffect } from "react";
import StarRateIcon from '@mui/icons-material/StarRate';

interface DrawerPanelProps {
    open: boolean;
    onClose: () => void;
    onSubmit?: (rating: number, feedback: string) => void;
}

const DrawerPanel: React.FC<DrawerPanelProps> = ({
    open,
    onClose,
    onSubmit,
}) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");


    useEffect(() => {
        if (open) {
            setRating(0);
            setFeedback("");
        }
    }, [open]);

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
                },
            }}
        >
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
                            // fontSize: 48,
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

                onClick={() => {
                    onSubmit?.(rating, feedback);
                    onClose();
                }}
                sx={{
                    bgcolor: "#fff",
                    color: "#5AA270",
                    borderRadius: 30,
                    height: 42,
                    fontSize: 16,
                    // fontWeight: 600,
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
        </Drawer>
    );
};

export default DrawerPanel;
