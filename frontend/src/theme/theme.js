import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#dc5d35",
        },
        background: {
            default: "#fff4e6",
        },
        text: {
            primary: "#3a2b1f",
            secondary: "#7a6a5d",
        },
    },
    typography: {
        fontFamily: "Roboto, sans-serif",
    },
    shape: {
        borderRadius: 10,
    },
});

export default theme;
