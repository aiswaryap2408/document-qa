import { Box, Typography, TextField } from "@mui/material";
import Header from "../components/header";
// import gurujiImg from "../assets/svg/guruji_illustrated.svg"
import PrimaryButton from "../components/PrimaryButton";
import GurujiImage from "../components/gurujiImg";

const Login = () => {
  return (
   <>
        <Header/>

        {/* Content */}
        <Box textAlign="center" px={3} pb={4}>
          <Box mt={2}>
            <GurujiImage />

            <Typography fontSize={16} mt={1}>
              Welcome to <strong style={{ color: "#dc5d35" }}>Findastro</strong>!
            </Typography>
          </Box>

          <Typography
            mt={8}
            mb={1}
            fontSize={15}
            fontWeight={700}
            color="primary"
          >
            Login / Sign-in with your phone number:
          </Typography>

          {/* Phone Input */}
          <Box
            sx={{
              display: "flex",
              border: "2px solid #f2a28a",
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "#fff",
              mx: 3,
              mb: 2,
            }}
          >
            <Box px={2} py={1.5} fontSize={14}>
              +91
            </Box>
            <TextField
              variant="standard"
              fullWidth
              InputProps={{ disableUnderline: true }}
            
            />
          </Box>

         
         <PrimaryButton
            label="Get OTP"
            sx={{ mt: 0}}
            //   onClick={() => console.log("OTP clicked")}
        />

        </Box>
     </>
  );
};

export default Login;
