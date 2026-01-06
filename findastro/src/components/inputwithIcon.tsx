import React from "react";
import { TextField, ToggleButton, Box } from "@mui/material";

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
    }}
    helperText={helperText}
  />
);

const GenderButton = ({
  children,
  selected,
  ...props
}: any) => (
  <ToggleButton
    {...props}
    sx={{
      flex: 1,
      border: "none",
      borderRadius: 0,
      py: 1.5,
      fontWeight: 500,
      bgcolor: selected ? "#FF8A3D" : "transparent",
      color: selected ? "#fff" : "#111",
      "&:hover": {
        bgcolor: selected ? "#FF7A28" : "#FFF0E6",
      },
    }}
  >
    {children}
  </ToggleButton>
);
export { InputField, GenderButton };