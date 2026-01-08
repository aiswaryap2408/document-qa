import { Box, Button } from "@mui/material";

interface FooterProps {
  onConsult?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onConsult }) => {
  return (
    <Box
      sx={{
        backgroundImage: 'url("/svg/bottom_closed_curve.svg")',
        pt: 1,
        textAlign: "center",
        backgroundRepeat: "no-repeat", 
        backgroundSize: "contain",
        backgroundPosition: "bottom",
      }}
    >
    
      <Box
        sx={{
          width: 80,
          height: 80,
          mx: "auto",
          mb: 0,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="/svg/guruji_illustrated.svg"
          alt="Guruji"
          sx={{ width: 65  }}
        />
      </Box>

      <Button
        onClick={onConsult}
        sx={{
          color: "#fff",
          fontSize: '.9rem',
          fontWeight: 500,
          textTransform: "none",
          height: 15,
        }}
      >
        Consult now
      </Button>
    </Box>
  );
};

export default Footer;
