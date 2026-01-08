import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, setAuthToken } from '../api';
import {
    Box,
    Typography,
    Button,
} from "@mui/material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Header from "../components/header";
import PrimaryButton from "../components/PrimaryButton";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import BirthDetailsForm from '../components/BirthDetailsForm';

const Register = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [details, setDetails] = useState({
        name: '',
        gender: 'Male',
        chart_style: 'South Indian',
        dob: '2000-01-01',
        tob: '12:00',
        pob: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const storedMobile = localStorage.getItem('mobile');
        if (!storedMobile) {
            navigate('/');
        } else {
            setMobile(storedMobile);
        }

        // Session timeout: 10 minutes = 600,000 ms
        const timeoutId = setTimeout(() => {
            console.log("Registration session expired. Redirecting...");
            navigate('/');
        }, 600000);

        // Initialize Places API
        const initPlaces = () => {
            const myPlaceAutoComplete = document.getElementById('myPlaceAutoComplete');
            if (myPlaceAutoComplete && window.clickastro && window.clickastro.places) {
                const capac = new window.clickastro.places.Autocomplete(myPlaceAutoComplete, { types: ['(cities)'] });
                capac.inputId = 'capac_' + myPlaceAutoComplete.id;
                capac.addListener('place_changed', function () {
                    const place = this.getPlace();
                    if (place && place.formatted_address) {
                        setDetails(prev => ({ ...prev, pob: place.formatted_address }));
                    }
                });
            }
        };

        window.CAPACInitListener = initPlaces;

        if (window.clickastro && window.clickastro.places) {
            initPlaces();
        }

        const script = document.createElement('script');
        script.src = 'https://placesapis.clickastro.com/capac/api/?key=AJSjkshjjSDkjhKDJDhjdjdklDldld&callback=CAPACInitListener';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            clearTimeout(timeoutId);
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            delete window.CAPACInitListener;
        };
    }, [navigate]);

    const handleDetailsSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        const { name, email, dob, tob, pob, chart_style, gender } = details;
        if (!name.trim() || !email.trim() || !dob.trim() || !tob.trim() || !pob.trim() || !chart_style.trim() || !gender.trim()) {
            setError('All fields are required. Please fill in all details.');
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            const payload = { ...details, mobile };
            const res = await registerUser(payload);
            const { access_token } = res.data;

            setAuthToken(access_token);
            localStorage.setItem('token', access_token);
            localStorage.setItem('userName', details.name);

            setTimeout(() => {
                navigate('/register-success');
            }, 1000);

        } catch (err) {
            console.error("Registration Error:", err);
            const msg = err.response?.data?.detail || err.message;
            // Handle Pydantic validation errors which might come as an array
            if (Array.isArray(msg)) {
                setError(`Registration failed: ${msg[0].msg}`);
            } else {
                setError(`Registration failed: ${msg}`);
            }
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Header />

            <Box p={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    {/* <Box sx={{ width: { xs: "100%", sm: "85%" }, mx: "auto" }}> */}
                    <BirthDetailsForm details={details} setDetails={setDetails} error={error} />
                    {/* </Box> */}

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <PrimaryButton
                            label={loading ? "Registering..." : "Continue"}
                            sx={{
                                p: 1.2,
                                height: 48,
                                borderRadius: 5,
                                width: { xs: "60%", sm: "50%" }
                            }}
                            onClick={handleDetailsSubmit}
                            disabled={loading}
                            endIcon={<KeyboardDoubleArrowRightIcon />}
                        />
                    </Box>
                </LocalizationProvider>
            </Box>
        </Box>
    );
};
export default Register;
