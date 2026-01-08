import React from 'react';
import { Box, ThemeProvider } from '@mui/material';
import theme from '../theme/theme';

const Layout = ({ children }) => {
    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "#111", // Dark background outside the container
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                }}
            >
                <Box
                    sx={{
                        width: { xs: '100%', sm: 450 },
                        minHeight: '100vh',
                        bgcolor: '#FFF6EB',
                        boxShadow: 3,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default Layout;
