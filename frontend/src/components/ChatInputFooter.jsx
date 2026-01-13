import React from 'react';
import {
    Box,
    InputBase,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";

const ChatInputFooter = ({ onSend }) => {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message);
        setMessage("");
    };


    return (
        <Box sx={{ position: "relative", width: "100%", mt: 4 }}>
            {/* Bottom Curves */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 55,
                    left: 0,
                    width: 100,
                }}
            >
                <Box
                    component="img"
                    src="/svg/bottom_left_open_curve.svg"
                    alt="Left curve"
                    sx={{ width: "100px" }}
                />
            </Box>

            <Box
                sx={{
                    position: "absolute",
                    bottom: 55,
                    right: 0,
                    width: 100,
                }}
            >
                <Box
                    component="img"
                    src="/svg/bottom_right_open_curve.svg"
                    alt="Right curve"
                    sx={{ width: "100px" }}
                />
            </Box>

            {/* Footer Input Area */}
            <Box sx={{ bgcolor: "#2f3148", px: 2, py: 1.5, display: "flex", gap: 2 }}>
                <Box
                    sx={{
                        flex: 1,
                        bgcolor: "#fff4e5",
                        borderRadius: 30,
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <InputBase
                        fullWidth
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                </Box>

                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "#fff4e5",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                    onClick={handleSend}
                    disabled={loading || !input.trim() || summary || userStatus !== 'ready'}
                >
                    <SendIcon sx={{ color: "#2f3148" }} />
                </Box>
            </Box>
        </Box>
    );
};

export default ChatInputFooter;
