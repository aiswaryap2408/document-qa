import { Box, Typography } from "@mui/material";

interface IntroMsgProps {
  name?: string;
  title?: string;
  description?: string;
  footerText?: string;
  avatarSrc?: string;
}

const IntroMsg: React.FC<IntroMsgProps> = ({
  name = "Varun",
  title,
  description = `Press "Consult now" button below to start your astrologer
  consultation any time. I’ll connect you to our astrologer.`,
  footerText = "You may call him as ‘Guruji’",
  avatarSrc = "/svg/guruji_illustrated.svg",
}) => {
  return (
    <Box sx={{ px: 3, pb: 1, width: "100%" }}>
      <Box
        sx={{
          position: "relative",
          border: "2px solid #F36A2F",
          borderRadius: 2,
          p: 2,
          bgcolor: "#fcebd3",
        }}
      >
        {/* Avatar */}
        <Box
          sx={{
            position: "absolute",
            top: -28,
            left: "50%",
            transform: "translateX(-50%)",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "5px solid #F36A2F",
            bgcolor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src={avatarSrc}
            alt="Guruji"
            sx={{ width: 50 }}
          />
        </Box>

        {/* Content */}
        <Typography sx={{ mb: 2 }}>
          {title ?? `${name}, welcome!`}
        </Typography>

        <Typography sx={{ mb: 2 }}>
          {description}
        </Typography>

        <Typography>
          {footerText}
        </Typography>
      </Box>
    </Box>
  );
};

export default IntroMsg;
