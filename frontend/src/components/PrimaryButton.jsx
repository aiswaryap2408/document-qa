import React from "react";
import { Button } from "@mui/material";

const PrimaryButton = ({
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
