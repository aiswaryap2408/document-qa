import { Box } from "@mui/material";
import Footer from "../components/footer";
import Header from "../components/header";
import IntroMsg from "../components/IntroMsg";

interface ConsultCardProps {
  name?: string;
  onConsult?: () => void;
}

const ConsultCard: React.FC<ConsultCardProps> = ({
  name = "Varun",
  onConsult,
}) => {
  return (
    <>
      <Header backgroundImage="/svg/top_curve_dark.svg" />

      <Box
        sx={{
          bgcolor: "#FFF6EB",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 190px)", // match Header height
        }}
      >
        {/* Content pushed to bottom */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <IntroMsg name={name} />
        </Box>

        {/* Footer stays at bottom */}
        <Footer onConsult={onConsult} />
      </Box>
    </>
  );
};

export default ConsultCard;
