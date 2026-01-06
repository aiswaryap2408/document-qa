import { Box, Typography } from "@mui/material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import PrimaryButton from "../components/PrimaryButton";
import Header from "../components/header";
import GurujiImage from "../components/gurujiImg";


interface IntroCardProps {
  name?: string;
  onBack?: () => void;
  onGetStarted?: () => void;
}

const IntroCard: React.FC<IntroCardProps> = ({
  name = "Varun",
  onBack,
  onGetStarted,
}) => {
  return (

    <>
      <Header />
    <GurujiImage />
    <Box
      sx={{
        mx: "auto",
        pt: 3,
        px: 5,
        pb: 1,
       
      }}
    >
      
      {/* Greeting */}
      <Typography sx={{ fontSize: 18, mb: 2 }}>
        Namaste{" "}
        <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
          {name}
        </Box>
        !
      </Typography>

      {/* Highlight Box */}
      <Box
        sx={{
          bgcolor: "#F6D6A8",
          borderRadius: 1,
          px: 2,
          py: 1.5,
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
          We made some changes based on the most requested features!
        </Typography>
      </Box>

      {/* Features */}
      <Box component="ol" sx={{ pl: 0, mb: 4, listStylePosition: "inside" }}>
        <Typography component="li" sx={{ fontSize: 14, mb: 2 }}>
          <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
            24x7
          </Box>{" "}
          astrologer availability.
        </Typography>

        <Typography component="li" sx={{ fontSize: 14, mb: 2 }}>
          This is most requested,{" "}
          <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
            AI assisted consultation
          </Box>
          . We are {" "}
          <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
           introducing MAYA
          </Box>
          , an AI assistant to help you with consultations, and much more.
        </Typography>

        <Typography component="li" sx={{ fontSize: 14 }}>
          Better interface
        </Typography>
      </Box>

          </Box>
          {/* Footer */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          pl: 5,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            cursor: "pointer",
            color: "#000",
          }}
          onClick={onBack}
        >
          &lt; Back
        </Typography>

        <PrimaryButton
            label="Get to know MAYA"
             sx={{ mt: 2, mb: 2, p: 1.2, height: 48, borderRadius: 5, width: {xs: "70%", sm: "55%"}, float: "right"}}
            onClick={onGetStarted}
            endIcon={<span style={{ fontSize: 28, display: "block" }}><KeyboardDoubleArrowRightIcon /></span>}
        />
      </Box>

     </>
  );
};

export default IntroCard;
