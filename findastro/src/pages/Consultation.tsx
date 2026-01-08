import { Box } from "@mui/material";
import Footer from "../components/footer";
import Header from "../components/header";
import IntroMsg from "../components/IntroMsg";
import PrimaryButton from "../components/PrimaryButton";
import CancelIcon from '@mui/icons-material/Cancel';

interface ConsultationProps {
  name?: string;
  onConsult?: () => void;
}

const Consultation: React.FC<ConsultationProps> = ({
  name = "Varun",
  onConsult,
}) => {
  return (
    <>
      <Header backgroundImage="/svg/top_curve_dark.svg" />
      <PrimaryButton label="End Consultation" sx={{ display: 'flex', m: 'auto', borderRadius: 10 }}
      startIcon={<span style={{ fontSize: 28, display: "block" }}><CancelIcon /></span>}    
      />


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

export default Consultation;
