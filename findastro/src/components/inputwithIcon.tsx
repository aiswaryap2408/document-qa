import React from "react";
import { TextField, ToggleButton, Box, styled } from "@mui/material";

type InputFieldProps = {
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  helperText?: React.ReactNode;
};

const InputField = ({
  icon,
  placeholder,
  type = "text",
  helperText,
}: InputFieldProps) => (
  <TextField
    fullWidth
    type={type}
    placeholder={placeholder}
    variant="outlined"
    InputProps={{
      startAdornment: (
        <Box sx={{ color: "#FF8A3D", mr: 1 }}>{icon}</Box>
      ),
    }}
    sx={{
      mb: 2,
      bgcolor: "#fff",
      borderRadius: 1,
     
      "& fieldset": {
        border: "none",
      },
       "& .MuiInputBase-input": {
        padding: "12px 12px", 
      },
    }}
    helperText={helperText}
  />
);

const GenderButton = styled(ToggleButton)(({ theme }) => ({
  flex: 1,
  borderRadius: 0,
  textTransform: "capitalize",
  padding: "10px 0",
 border: "none",
  color: "#111",
  backgroundColor: "#fff",

  "&.Mui-selected": {
    backgroundColor: "#FF8A3D",
    color: "#fff",

    "&:hover": {
      backgroundColor: "#FF7A28",
    },
  },

  "&:hover": {
    backgroundColor: "#FFF0E6",
  },
}));
export { InputField, GenderButton };