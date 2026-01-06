import React from "react";
import { Button } from "@mui/material";

interface PrimaryButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  sx?: object;
  type?: "button" | "submit" | "reset";
   startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onClick,
  disabled = false,
  sx,
  type = "button",
  startIcon,
  endIcon,
}) => {
  return (
    <Button
      variant="contained"
      type={type}
      onClick={onClick}
      disabled={disabled}
       startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        width: "50%",
        borderRadius: 1,
        textTransform: "none",
        fontWeight: 500,
        padding: 1.2,
        fontSize: 16,
        ...sx,
      }}
    >
      {label}
    </Button>
  );
};

export default PrimaryButton;
