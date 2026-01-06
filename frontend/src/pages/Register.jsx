import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, setAuthToken } from '../api';
import {
    Box,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Button,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import EmailIcon from "@mui/icons-material/Email";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Header from "../components/header";
import PrimaryButton from "../components/PrimaryButton";
import { InputField } from "../components/inputwithIcon";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

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
            setError(`Registration failed: ${msg}`);
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Header />

            <Box p={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ width: { xs: "100%", sm: "85%" }, mx: "auto" }}>
                        <Typography
                            sx={{
                                color: "#F26A2E",
                                fontWeight: 600,
                                mb: 2,
                                fontSize: 16,
                            }}
                        >
                            Birth details:
                        </Typography>

                        {error && (
                            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                {error}
                            </Typography>
                        )}

                        {/* Name */}
                        <InputField
                            icon={<PersonIcon sx={{ fontSize: 20 }} />}
                            placeholder="Name"
                            value={details.name}
                            onChange={e => setDetails({ ...details, name: e.target.value })}
                        />

                        {/* Email */}
                        <InputField
                            icon={<EmailIcon sx={{ fontSize: 20 }} />}
                            placeholder="Email Address"
                            type="email"
                            value={details.email}
                            onChange={e => setDetails({ ...details, email: e.target.value })}
                        />

                        {/* Gender */}
                        <ToggleButtonGroup
                            exclusive
                            value={details.gender.toLowerCase()}
                            onChange={(_, v) => v && setDetails({ ...details, gender: v.charAt(0).toUpperCase() + v.slice(1) })}
                            sx={{
                                width: "90%",
                                mb: 2,
                                borderRadius: 1,
                                overflow: "hidden",
                            }}
                        >
                            {['male', 'female'].map(g => (
                                <ToggleButton
                                    key={g}
                                    value={g}
                                    sx={{
                                        flex: 1,
                                        textTransform: "capitalize",
                                        bgcolor: details.gender.toLowerCase() === g ? "#FF8A3D" : "#fff",
                                        color: details.gender.toLowerCase() === g ? "#fff" : "#111",
                                        border: "none",
                                        borderRadius: '8px !important',
                                        "&.Mui-selected": {
                                            bgcolor: "#FF8A3D",
                                            color: "#fff",
                                        },
                                        "&.Mui-selected:hover": {
                                            bgcolor: "#FF7A28",
                                        },
                                        "&:hover": {
                                            bgcolor: details.gender.toLowerCase() === g ? "#FF7A28" : "#FFF",
                                        },
                                    }}
                                >
                                    {g}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>

                        {/* Date of birth */}
                        <DatePicker
                            value={dayjs(details.dob)}
                            onChange={(newValue) => setDetails({ ...details, dob: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    sx: {
                                        mb: 2,
                                        bgcolor: "#fff",
                                        borderRadius: 1,
                                        "& fieldset": { border: "none" },
                                        "& .MuiInputBase-root": { height: 52 },
                                    },
                                    InputProps: {
                                        startAdornment: (
                                            <Box sx={{ color: "#FF8A3D", mr: 1, display: 'flex', alignItems: 'center' }}>
                                                <CalendarMonthIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                        ),
                                    },
                                },
                            }}
                        />

                        {/* Time of birth */}
                        <TimePicker
                            value={dayjs(`2000-01-01T${details.tob}`)}
                            onChange={(newValue) => setDetails({ ...details, tob: newValue ? newValue.format('HH:mm') : '' })}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    sx: {
                                        mb: 2,
                                        bgcolor: "#fff",
                                        borderRadius: 1,
                                        "& fieldset": { border: "none" },
                                        "& .MuiInputBase-root": { height: 52 },
                                    },
                                    InputProps: {
                                        startAdornment: (
                                            <Box sx={{ color: "#FF8A3D", mr: 1, display: 'flex', alignItems: 'center' }}>
                                                <AccessTimeIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                        ),
                                    },
                                },
                            }}
                        />

                        {/* Place of birth */}
                        <InputField
                            id="myPlaceAutoComplete"
                            icon={<PlaceIcon sx={{ fontSize: 20 }} />}
                            placeholder="Place of birth"
                            value={details.pob}
                            onChange={e => setDetails({ ...details, pob: e.target.value })}
                        />

                        {/* Chart style */}
                        <Typography
                            sx={{
                                color: "#F26A2E",
                                fontWeight: 600,
                                mt: 3,
                                mb: 0.5,
                            }}
                        >
                            Horoscope chart style preference?
                        </Typography>

                        <Typography fontSize={13} color="#555" mb={2}>
                            The chart representations are slightly different based on regions in India.
                        </Typography>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, width: "90%" }}>
                            {["South Indian", "North Indian", "East Indian", "Kerala"].map((item) => (
                                <Button
                                    key={item}
                                    onClick={() => setDetails({ ...details, chart_style: item })}
                                    variant={details.chart_style === item ? "contained" : "outlined"}
                                    sx={{
                                        bgcolor: details.chart_style === item ? "#FF8A3D" : "#fff",
                                        color: details.chart_style === item ? "#fff" : "#111",
                                        border: "none",
                                        borderRadius: 1,
                                        py: 1.2,
                                        textTransform: "capitalize",
                                        "&:hover": {
                                            bgcolor: details.chart_style === item ? "#FF7A28" : "#FFF0E6",
                                        },
                                    }}
                                >
                                    {item}
                                </Button>
                            ))}
                        </Box>
                    </Box>

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
