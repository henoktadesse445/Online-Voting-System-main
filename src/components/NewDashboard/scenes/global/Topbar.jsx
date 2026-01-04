import { Box, IconButton, useTheme } from "@mui/material";
import { useContext, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from 'react-router-dom';// p is padding

const Topbar = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const [redirectToHome, setRedirectToHome] = useState(false);


    const handleLogout = () => {
        // Save theme
        const currentTheme = localStorage.getItem("theme");

        // Clear session data
        localStorage.clear();
        sessionStorage.clear();

        // Restore theme
        if (currentTheme) {
            localStorage.setItem("theme", currentTheme);
        }

        // Clear cookies if any
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Redirect to login
        navigate('/AdminLogin');
    };




    return (
        <Box
            display="flex"
            justifyContent="space-between"
            p={2}
            sx={{
                backdropFilter: "blur(10px)",
                backgroundColor: theme.palette.mode === "dark"
                    ? "rgba(20, 27, 45, 0.7)"
                    : "rgba(255, 255, 255, 0.7)",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                borderBottom: `1px solid ${colors.primary[400]}`,
            }}
        >
            {/* Search Bar */}
            <Box
                display="flex"
                backgroundColor={colors.primary[400]}
                borderRadius="10px"
                sx={{
                    transition: "all 0.3s ease",
                    "&:hover": {
                        backgroundColor: colors.primary[300],
                    }
                }}
            >
                <InputBase sx={{ ml: 2, flex: 1, color: colors.grey[100] }} placeholder="Search" />
                <IconButton type="Button" sx={{ p: 1, color: colors.grey[100] }}>
                    <SearchIcon />
                </IconButton>
            </Box>
            <Box display="flex">
                <IconButton onClick={colorMode.toggleColorMode}>
                    {theme.palette.mode === "dark" ? (
                        <DarkModeOutlinedIcon />
                    ) : (
                        <LightModeOutlinedIcon />
                    )}
                </IconButton>
                <IconButton>
                    <NotificationsOutlinedIcon />
                </IconButton>
                <IconButton>
                    <SettingsOutlinedIcon />
                </IconButton>
                <IconButton onClick={handleLogout}>
                    <LogoutOutlinedIcon />
                </IconButton>
            </Box>
        </Box>
    )
}

export default Topbar;