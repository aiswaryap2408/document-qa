import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Header from '../components/header';
import PrimaryButton from '../components/PrimaryButton';
import GurujiImage from '../components/gurujiImg';

const RegisterSuccess = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('User');

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setName(storedName);
        }
    }, []);

    return (
        <>
            <Header />
            <GurujiImage />
            <Box
                sx={{
                    mx: "auto",
                    pt: 3,
                    px: 5,
                    pb: 1,

                }}
            >

                {/* Greeting */}
                <Typography sx={{ fontSize: 18, mb: 2 }}>
                    Namaste{" "}
                    <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
                        {name}
                    </Box>
                    !
                </Typography>

                {/* Highlight Box */}
                <Box
                    sx={{
                        bgcolor: "#F6D6A8",
                        borderRadius: 1,
                        px: 2,
                        py: 1.5,
                        mb: 2,
                    }}
                >
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        We made some changes based on the most requested features!
                    </Typography>
                </Box>

                {/* Feature List */}
                <Box component="ol" sx={{ pl: 0, mb: 4, listStylePosition: "inside", listStyleType: "decimal" }}>
                    <Typography component="li" sx={{ fontSize: 14, mb: 2, display: "list-item" }}>
                        <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
                            24x7
                        </Box>{" "}
                        astrologer availability.
                    </Typography>
                    <Typography component="li" sx={{ fontSize: 14, mb: 2, display: "list-item" }}>
                        This is most requested,{" "}
                        <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
                            AI assisted consultation
                        </Box>
                        . We are {" "}
                        <Box component="span" sx={{ color: "#F05A28", fontWeight: 600 }}>
                            introducing MAYA
                        </Box>
                        , an AI assistant to help you with consultations, and much more.
                    </Typography>

                    <Typography component="li" sx={{ fontSize: 14, display: "list-item" }}>
                        Better interface
                    </Typography>
                </Box>
            </Box>

            {/* Footer Navigation */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    pl: 5,
                }}
            >


                <PrimaryButton
                    label="Get to know MAYA"
                    sx={{ mt: 2, mb: 2, p: 1.2, height: 48, borderRadius: 5, width: { xs: "70%", sm: "55%" }, float: "right" }}
                    onClick={() => navigate('/onboarding')}
                    endIcon={<KeyboardDoubleArrowRightIcon sx={{ fontSize: 24 }} />}
                />
            </Box>

        </>
    );
};

export default RegisterSuccess;
