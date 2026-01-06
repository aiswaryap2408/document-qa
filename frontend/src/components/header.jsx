import { Box } from "@mui/material";
import React from "react";

const Header = () => {
    return (
        <Box
            sx={{
                position: "relative",
                height: 190,
                overflow: "hidden",
            }}
        >
            {/* Top Curve */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "url(/svg/top_curve_light.svg)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                    zIndex: 1,
                }}
            />

            {/* Stars */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(/svg/header_stars.svg)`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    zIndex: 2,
                    mt: { xs: -4, sm: 0 },
                }}
            />

            {/* Hamburger menu */}
            <Box
                sx={{
                    position: "absolute",
                    top: 50,
                    left: 15,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: 20,
                    cursor: "pointer",
                    zIndex: 3,
                }}
            >
                {[1, 2, 3].map((i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 30,
                            height: "0.2rem",
                            bgcolor: "text.primary",
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default Header;
