import React, { useState, useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import PrimaryButton from "../components/PrimaryButton";
import Header from "../components/header";
import GurujiImage from "../components/gurujiImg";

const OTP_LENGTH = 4;

const OtpPage: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  /* Auto focus first input */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /* Handle typing */
  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* Handle backspace */
  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        newOtp[index] = "";
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        newOtp[index - 1] = "";
      }

      setOtp(newOtp);
    }
  };

  /* Handle paste full OTP */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const pastedOtp = pastedData.slice(0, OTP_LENGTH).split("");
    const newOtp = [...Array(OTP_LENGTH)].map((_, i) => pastedOtp[i] || "");
    setOtp(newOtp);

    const focusIndex =
      pastedOtp.length >= OTP_LENGTH
        ? OTP_LENGTH - 1
        : pastedOtp.length;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleContinue = () => {
    const enteredOtp = otp.join("");
    console.log("OTP Entered:", enteredOtp);
  };

  const handleResend = () => {
    console.log("Resend OTP clicked");
  };

  return (
    <>
      <Header />

      <Box mt={2} textAlign="center">
        <Typography fontSize={16} mt={1} mb={2}>
          Welcome to{" "}
          <Typography component="span" fontWeight={600} color="#dc5d35">
            Findastro
          </Typography>
          !
        </Typography>

        <GurujiImage />
      </Box>

      {/* OTP Section */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          px: 2,
          mb: 10,
        }}
      >
        <Typography
          sx={{
            mb: 1,
            color: "#dc5d35",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Enter OTP
        </Typography>

        {/* OTP Inputs */}
        <Box sx={{ display: "flex", gap: {xs: 2, sm: 3}, mb: 2 }}>
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              maxLength={1}
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{
                width: 65,
                height: 75,
                textAlign: "center",
                fontSize: 24,
                borderRadius: 8,
                border: "none",
                outline: "none",
                boxShadow: "0 -6px 12px rgba(0, 0, 0, 0.15)",
                backgroundColor: "#fff",
              }}
            />
          ))}
        </Box>

        {/* Resend */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            mb: 1,
          }}
        >
          <Typography
            sx={{
              color: "#dc5d35",
              fontWeight: 600,
              cursor: "pointer",
              mr: {xs: 0, sm: 5},
              fontSize: 14,
            }}
            onClick={handleResend}
          >
            Resend OTP
          </Typography>
        </Box>

        <PrimaryButton label="Continue" onClick={handleContinue} />
      </Box>
    </>
  );
};

export default OtpPage;
