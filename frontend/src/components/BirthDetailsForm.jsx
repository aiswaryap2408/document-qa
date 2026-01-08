import React from 'react';
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
import { InputField } from "./inputwithIcon";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { GenderButton } from "./inputwithIcon";

const BirthDetailsForm = ({ details, setDetails, error }) => {
    return (
        <Box sx={{ width: { xs: "100%", sm: "85%" } }}>
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
                icon={<PersonIcon sx={{ backgroundColor: "#F26A2E", color: "#fff", borderRadius: 12, border: "5px solid #F26A2E", fontSize: 20 }} />}
                placeholder="Name"
                value={details.name}
                onChange={e => setDetails({ ...details, name: e.target.value })}
            />



            {/* Email */}
            <InputField
                icon={<EmailIcon sx={{ backgroundColor: "#F26A2E", color: "#fff", borderRadius: 12, border: "5px solid #F26A2E", fontSize: 20 }} />}
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
                <GenderButton value="male">Male</GenderButton>
                <GenderButton value="female">Female</GenderButton>
                {/* {['male', 'female'].map(g => (
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
                ))} */}
            </ToggleButtonGroup>

            {/* Date of birth */}
            <InputField
                icon={<CalendarMonthIcon />}
                placeholder="Date of birth"
                type="date"
            />

            {/* Date of birth */}
            {/* <DatePicker
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
            /> */}

            {/* Time of birth */}
            {/* <TimePicker
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
            /> */}

            {/* Time of birth */}
            <Box sx={{ display: "flex" }}>
                <InputField
                    icon={<AccessTimeIcon />}
                    placeholder="Time of birth"
                    type="time"

                />

            </Box>
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
    );
};

export default BirthDetailsForm;
