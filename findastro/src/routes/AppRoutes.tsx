import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import Login from "../pages/LoginPage";
import OtpPage from "../pages/otpPage";
import UserRegistration from "../pages/userRegistration";
import IntroCard from "../pages/IntroCard";
import IntroFlow from "../pages/IntroFlow";
import ConsultCard from "../pages/ConsultCard";
import Consultation from "../pages/Consultation";

const AppRoutes = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#111",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          width: 450,
          bgcolor: "background.default",
        }}
      >
        {/* Routes should be inside here */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="otp" element={<OtpPage />} />
          <Route path="user-registration" element={<UserRegistration />} />
          <Route path="intro-card" element={<IntroCard />} />
          <Route path="introFlow" element={<IntroFlow />} />
          <Route path="consultcard" element={<ConsultCard />} />
          <Route path="Consultation" element={<Consultation />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AppRoutes;
