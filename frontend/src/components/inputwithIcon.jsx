import React from "react";
import { TextField, ToggleButton, Box } from "@mui/material";

const InputField = ({
    icon,
    placeholder,
    value,
    onChange,
    onBlur,
    id,
    type = "text",
    helperText,
    inputProps,
    className,
    name,
}) => (
    <TextField
        fullWidth
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        variant="outlined"
        InputProps={{
            startAdornment: (
                <Box sx={{ color: "#FF8A3D", mr: 1 }}>{icon}</Box>
            ),
        }}
        inputProps={{
            ...inputProps,
            className: className,
        }}
        sx={{
            mb: 2,
            bgcolor: "#fff",
            borderRadius: 1,
            "& fieldset": {
                border: "none",
            },
            "& .MuiInputBase-root": {
                height: 52, // Standard height for all fields
            },
            "& .MuiInputBase-input": {
                padding: "12px 14px",
            }
        }}
        helperText={helperText}
    />
);

const GenderButton = ({
    children,
    selected,
    ...props
}) => (
    <ToggleButton
        {...props}
        sx={{
            flex: 1,
            border: "none",
            borderRadius: 1,
            py: 1.5,
            fontWeight: 500,
            bgcolor: selected ? "#FF8A3D" : "#fff",
            color: selected ? "#fff" : "#111",
            "&.Mui-selected": {
                bgcolor: "#FF8A3D",
                color: "#fff",
            },
            "&.Mui-selected:hover": {
                bgcolor: "#FF7A28",
            },
            "&:hover": {
                bgcolor: selected ? "#FF7A28" : "#FFF0E6",
            },
        }}
    >
        {children}
    </ToggleButton>
);

export { InputField, GenderButton };
