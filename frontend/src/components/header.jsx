import React from "react";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCommentIcon from '@mui/icons-material/AddComment';

const Header = ({ backgroundImage = "/svg/top_curve_light.svg" }) => {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Only show menu on specific pages
    const showMenu = ['/chat', '/profile', '/history', '/dakshina', '/wallet', '/wallet/recharge'].includes(location.pathname);

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };

    const handleNavigation = (path) => {
        if (path === 'logout') {
            localStorage.clear();
            navigate('/');
        } else if (path === '/chat-new') {
            navigate('/chat', { state: { newSession: true } });
        } else {
            navigate(path);
        }
        setDrawerOpen(false);
    };

    return (
        <Box
            sx={{
                position: "relative",
                height: 172,
                overflow: "hidden",
            }}
        >
            {/* Top Curve */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${backgroundImage})`,
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

            {/* Hamburger menu - Only for logged in users on specific pages */}
            {showMenu && (
                <>
                    <Box
                        onClick={toggleDrawer(true)}
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

                    {/* Drawer */}
                    <Drawer
                        anchor="left"
                        open={drawerOpen}
                        onClose={toggleDrawer(false)}
                        PaperProps={{
                            sx: { width: { xs: '75vw', sm: 300 } }
                        }}
                    >
                        <Box
                            sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                            role="presentation"
                            onKeyDown={toggleDrawer(false)}
                        >
                            {/* Drawer Header */}
                            <Box sx={{
                                p: 3,
                                background: 'linear-gradient(135deg, #FFF0E6 0%, #FFFFFF 100%)',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#F26A2E',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>
                                        AG
                                    </Box>
                                    <Box>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#333' }}>Astrology Guruji</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Your Cosmic Guide</div>
                                    </Box>
                                </Box>
                            </Box>

                            <List sx={{ pt: 2 }}>
                                <ListItem disablePadding onClick={() => handleNavigation('/chat')}>
                                    <ListItemButton sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: '#F26A2E' }}><HomeIcon /></ListItemIcon>
                                        <ListItemText primary="Home" primaryTypographyProps={{ fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>

                                <ListItem disablePadding onClick={() => handleNavigation('/chat-new')}>
                                    <ListItemButton sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: '#F26A2E' }}><AddCommentIcon /></ListItemIcon>
                                        <ListItemText primary="New Consultation" primaryTypographyProps={{ fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>

                                <ListItem disablePadding onClick={() => handleNavigation('/profile')}>
                                    <ListItemButton sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: '#F26A2E' }}><PersonIcon /></ListItemIcon>
                                        <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>

                                <ListItem disablePadding onClick={() => handleNavigation('/history')}>
                                    <ListItemButton sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: '#F26A2E' }}><HistoryIcon /></ListItemIcon>
                                        <ListItemText primary="History" primaryTypographyProps={{ fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>

                                <ListItem disablePadding onClick={() => handleNavigation('/wallet')}>
                                    <ListItemButton sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: '#F26A2E' }}>
                                            <span style={{ fontSize: 20 }}>💰</span>
                                        </ListItemIcon>
                                        <ListItemText primary="My Wallet" primaryTypographyProps={{ fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>

                                <ListItem disablePadding onClick={() => handleNavigation('logout')}>
                                    <ListItemButton sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: '#888' }}><LogoutIcon /></ListItemIcon>
                                        <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500, color: '#666' }} />
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </Box>
                    </Drawer>
                </>
            )}
        </Box>
    );
};

export default Header;
