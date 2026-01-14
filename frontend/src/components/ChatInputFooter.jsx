import React from 'react';
import {
    Box,
    InputBase,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";

const ChatInputFooter = ({ onSend, userStatus, loading, summary }) => {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim() || loading || summary || userStatus !== 'ready') return;
        onSend(message);
        setMessage("");
    };


    return (
        <Box sx={{ position: "relative", width: "100%", mt: 4 }}>
            {/* Bottom Curves */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 65,
                    left: -11,
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
                    bottom: 65,
                    right: -11,
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
                        placeholder={userStatus === 'ready' ? "Type your message..." : "Preparing..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading || summary || userStatus !== 'ready'}
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
                        cursor: message.trim() && !loading && !summary && userStatus === 'ready' ? "pointer" : "default",
                    }}
                    onClick={handleSend}
                >
                    <SendIcon sx={{ color: "#2f3148" }} />
                </Box>
            </Box>
        </Box>
    );
};

export default ChatInputFooter;
