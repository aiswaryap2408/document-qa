import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import IntroMsg from "../components/IntroMsg";
import ChatBubble from "../components/ChatBubble";
import ChatInputFooter from "../components/ChatInputFooter";
import Header from "../components/header";
import PrimaryButton from "../components/PrimaryButton";
import CancelIcon from "@mui/icons-material/Cancel";
import TypingIndicator from "../components/TypingIndicator";
import DrawerPanel from "../components/feedback/DrawerPanel";

type Sender = "maya" | "user";

interface Message {
    id: number;
    text: string;
    time: string;
    sender: Sender;
}

/* Time formatter */
const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

const initialMessages: Message[] = [
    {
        id: 1,
        text: "Namaste Varun 🙂",
        time: formatTime(new Date()),
        sender: "maya",
    },
    {
        id: 2,
        text: "Please ask what’s in your mind. I have your charts with me.",
        time: formatTime(new Date()),
        sender: "maya",
    },
];

const ChatScreen = () => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isTyping, setIsTyping] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    const chatEndRef = useRef<HTMLDivElement | null>(null);

    /* Auto scroll */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    /* Send message */
    const handleSend = (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            text,
            time: formatTime(new Date()),
            sender: "user",
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            const mayaReply: Message = {
                id: Date.now() + 1,
                text: "I am checking your chart…",
                time: formatTime(new Date()),
                sender: "maya",
            };

            setMessages((prev) => [...prev, mayaReply]);
            setIsTyping(false);
        }, 2000);
    };

    return (
        <Box
            sx={{
                bgcolor: "#FFF6EB",
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                position: "relative",
            }}
        >
            <Header backgroundImage="/svg/top_curve_dark.svg" />

            {/* End Consultation Button */}
            <PrimaryButton
                label="End Consultation"
                startIcon={<CancelIcon />}
                onClick={() => setFeedbackOpen(true)}
                sx={{
                    position: "absolute",
                    top: 135,
                    left: 0,
                    right: 0,
                    mx: "auto",
                    width: 200,
                    height: 40,
                    borderRadius: 10,
                    fontSize: 14,
                    zIndex: 5,
                }}
            />
            {/* Feedback Drawer */}
            <DrawerPanel
                open={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
                onSubmit={(rating, feedback) => {
                    console.log("Rating:", rating);
                    console.log("Feedback:", feedback);
                }}
            />

            {/* Chat Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 3,
                    pb: 10,
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                }}
            >
                <IntroMsg name="Varun" />

                {messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        text={msg.text}
                        time={msg.time}
                        sender={msg.sender}
                    />
                ))}

                <div ref={chatEndRef} />
            </Box>

            {/* Typing Indicator */}
            {isTyping && (
                <TypingIndicator
                    sx={{
                        position: "absolute",
                        bottom: 85,
                        left: 0,
                        right: 0,
                    }}
                />
            )}

            <ChatInputFooter onSend={handleSend} />


        </Box>
    );
};

export default ChatScreen;
