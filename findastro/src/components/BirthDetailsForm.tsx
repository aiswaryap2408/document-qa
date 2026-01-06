import React from "react";
import {
  Box,
  Typography,
  ToggleButtonGroup,
 
  Button,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import { InputField} from "./inputwithIcon";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import PrimaryButton from "./PrimaryButton";
import { GenderButton } from "./inputwithIcon";


const BirthDetailsForm = () => {
  const [gender, setGender] = React.useState<"male" | "female">("male");
  const [chartStyle, setChartStyle] = React.useState("south");

  return (
    
    
      <Box p={2}>
        <Box sx={{width: {xs: "100%", sm: "85%"}}}>
        {/* Title */}
        <Typography
          sx={{
            color: "#F26A2E",
            fontWeight: 600,
            mb: 2,
            fontSize: 16,
          }}
        >
          Birth details:
        </Typography>

        {/* Name */}
        <InputField icon={<PersonIcon  sx={{backgroundColor: "#F26A2E", color: "#fff", borderRadius: 12, border: "5px solid #F26A2E"}}/>} placeholder="Name" />

        {/* Gender */}
<ToggleButtonGroup
  exclusive
  value={gender}
  onChange={(_, v) => v && setGender(v)}
  sx={{
    width: "90%",
    mb: 2,
    borderRadius: 1,
    overflow: "hidden",
  }}
>
  <GenderButton value="male">Male</GenderButton>
  <GenderButton value="female">Female</GenderButton>
</ToggleButtonGroup>


        {/* Date of birth */}
        <InputField
          icon={<CalendarMonthIcon />}
          placeholder="Date of birth"
          type="date"
        />

        {/* Time of birth */}
        <Box sx={{display: "flex"}}>
            <InputField
              icon={<AccessTimeIcon />}
              placeholder="Time of birth"
              type="time"
            
            />
            <Typography fontSize={16} color="#666" ml={1}>
              I don't know my time of birth,{" "}
              <Box component="span" color="#F26A2E" fontWeight={500}>
                help me.
              </Box>
            </Typography>
        </Box>
        {/* Place of birth */}
        <InputField icon={<PlaceIcon />} placeholder="Place of birth" />

        {/* Chart style */}
        <Typography
          sx={{
            color: "#F26A2E",
            fontWeight: 600,
            mt: 3,
            mb: 0.5,
          }}
        >
          Horoscope chart style preference?
        </Typography>

        <Typography fontSize={13} color="#555" mb={2}>
          The chart representations are slightly different based on regions in
          India. You can always change this later.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, width: "90%" }}>
          {["south", "north", "east", "kerala"].map((item) => (
            <Button
              key={item}
              onClick={() => setChartStyle(item)}
              variant={chartStyle === item ? "contained" : "outlined"}
              sx={{
                bgcolor: chartStyle === item ? "#FF8A3D" : "#fff",
                color: chartStyle === item ? "#fff" : "#111",
                // borderColor: "#FF8A3D",
                border: "none",
                borderRadius: 1,
                py: 1.2,
                textTransform: "capitalize",
                // "&:hover": {
                //   bgcolor: chartStyle === item ? "#FF7A28" : "#FFF0E6",
                // },
              }}
            >
              {item} Indian
            </Button>
          ))}
        </Box>
      </Box>
          <Box>
        {/* Continue button */}
        <PrimaryButton
                    label="Continue"
                    sx={{ mt: 10, mb: 2, p: 1.2, height: 48, borderRadius: 5, width: {xs: "50%", sm: "40%"}, float: "right"}}
                    //   onClick={() => console.log("OTP clicked")}
                     endIcon={<span style={{ fontSize: 28, display: "block" }}><KeyboardDoubleArrowRightIcon /></span>}
                />
        </Box>
      </Box>
    
  
  );
};

export default BirthDetailsForm;


