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
        email: '',
        // Location-related hidden fields
        country: '',
        state: '',
        region_dist: '',
        txt_place_search: '',
        longdeg: '',
        longmin: '',
        longdir: '',
        latdeg: '',
        latmin: '',
        latdir: '',
        timezone: '0',
        timezone_name: '',
        latitude_google: '',
        longitude_google: '',
        correction: '0'
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


        // Load scripts in sequence to ensure proper initialization
        // Load jQuery first
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
        jqueryScript.onload = () => {
            console.log('jQuery loaded');

            // Load solar.js after jQuery
            const solarScript = document.createElement('script');
            solarScript.src = '/solar.js';
            solarScript.onload = () => {
                console.log('solar.js loaded');

                // Load CAPAC API script after solar.js
                const capacScript = document.createElement('script');
                capacScript.src = 'https://placesapis.clickastro.com/capac/api/?key=AJSjkshjjSDkjhKDJDhjdjdklDldld&callback=initAutocomplete';
                capacScript.onload = () => {
                    console.log('CAPAC API loaded');
                };
                capacScript.onerror = () => {
                    console.error('Failed to load CAPAC API');
                };
                document.body.appendChild(capacScript);
            };
            solarScript.onerror = () => {
                console.error('Failed to load solar.js');
            };
            document.body.appendChild(solarScript);
        };
        jqueryScript.onerror = () => {
            console.error('Failed to load jQuery');
        };
        document.body.appendChild(jqueryScript);

        return () => {
            clearTimeout(timeoutId);

            // Remove all dynamically added scripts
            const scriptsToRemove = [
                'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
                // '/solar.js',
                'https://www.clickastro.com/js/cad/google_place_for_cards-solar.js?ver=6.201',
                'https://placesapis.clickastro.com/capac/api/'
            ];

            scriptsToRemove.forEach(src => {
                const scripts = document.querySelectorAll(`script[src^="${src}"]`);
                scripts.forEach(script => {
                    if (document.body.contains(script)) {
                        document.body.removeChild(script);
                    }
                });
            });

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
            // Get location details from hidden inputs (populated by solar.js)
            // solar.js updates the DOM directly, so we need to read from there
            const locationFields = {
                country: document.getElementById('country')?.value || '',
                state: document.getElementById('state')?.value || '',
                region_dist: document.getElementById('region_dist')?.value || '',
                txt_place_search: document.getElementById('txt_place_search')?.value || '',
                longdeg: document.getElementById('longdeg')?.value || '',
                longmin: document.getElementById('longmin')?.value || '',
                longdir: document.getElementById('longdir')?.value || '',
                latdeg: document.getElementById('latdeg')?.value || '',
                latmin: document.getElementById('latmin')?.value || '',
                latdir: document.getElementById('latdir')?.value || '',
                timezone: document.getElementById('timezone')?.value || '0',
                timezone_name: document.getElementById('timezone_name')?.value || '',
                latitude_google: document.getElementById('latitude_google')?.value || '',
                longitude_google: document.getElementById('longitude_google')?.value || '',
                correction: document.getElementById('correction')?.value || '0'
            };

            const payload = { ...details, ...locationFields, mobile };
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
                    {/* Hidden location fields moved to BirthDetailsForm */}

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
