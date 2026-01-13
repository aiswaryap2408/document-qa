import { Box, Typography } from "@mui/material";

const TypingIndicator = ({
    text = "Astrologer is typing...",
    sx,
    textSx,
}) => {
    return (
        <Box
            sx={{
                py: 1,
                display: "flex",
                justifyContent: "center",
                ...sx,
            }}
        >
            <Typography
                sx={{
                    fontSize: 14,
                    color: "#a19b93",
                    ...textSx,
                }}
            >
                {text}
            </Typography>
        </Box>
    );
};

export default TypingIndicator;
