import { useState } from "react";
import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import { Box, Typography, useTheme } from '@mui/material';
import { Link } from "react-router-dom";
import { tokens } from "../../theme";
import HomeoutlinedIcon from "@mui/icons-material/HomeOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HomeIcon from '@mui/icons-material/Home';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import SettingsIcon from '@mui/icons-material/Settings';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FolderIcon from '@mui/icons-material/Folder';
import PagesIcon from '@mui/icons-material/Pages';
import BarChartIcon from '@mui/icons-material/BarChart';
import NavigationIcon from '@mui/icons-material/Navigation';

const Item = ({ title, to, icon, selected, setSelected }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (
        <MenuItem
            active={selected === title}
            style={{
                color: colors.grey[100],
            }}
            onClick={() => setSelected(title)}
            icon={icon}
        >
            <Typography>{title}</Typography>
            <Link to={to} />
        </MenuItem>
    );
};

const Sidebar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selected, setSelected] = useState("Dashboard");

    return (
        <Box
            sx={{
                "& .pro-sidebar": {
                    width: "240px",
                    minWidth: "240px",
                    borderRight: "none !important",
                },
                "& .pro-sidebar-inner": {
                    background: `${colors.primary[500]} !important`,
                    backdropFilter: "blur(10px)",
                },
                "& .pro-icon-wrapper": {
                    backgroundColor: "transparent !important",
                },
                "& .pro-inner-item": {
                    padding: "10px 35px 10px 20px !important",
                    margin: "4px 10px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                },
                "& .pro-inner-item:hover": {
                    color: "#868dfb !important",
                    backgroundColor: "rgba(134, 141, 251, 0.1) !important",
                },
                "& .pro-menu-item.active": {
                    color: "#6870fa !important",
                    backgroundColor: "rgba(104, 112, 250, 0.1) !important",
                    borderRadius: "8px",
                },
                "& .pro-item-content p": {
                    fontWeight: "600 !important",
                },
                "& .pro-menu-item.pro-sub-menu": {
                    "& .pro-inner-item": {
                        padding: "10px 20px 10px 20px !important",
                    }
                },
                "& .pro-menu-item.pro-sub-menu .pro-inner-list-item": {
                    paddingLeft: "20px !important",
                },
                "& .pro-arrow": {
                    borderColor: `${colors.grey[100]} !important`,
                },
                position: "sticky",
                top: 0,
                height: "100vh",
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                    width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                    background: colors.primary[400],
                },
                "&::-webkit-scrollbar-thumb": {
                    background: colors.primary[300],
                    borderRadius: "3px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                    background: colors.blueAccent[500],
                },
            }}
        >
            <ProSidebar collapsed={isCollapsed}>
                <Menu iconShape="square">
                    {/* LOGO AND MENU ICON */}
                    <MenuItem
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
                        style={{
                            margin: "10px 0 20px 0",
                            color: colors.grey[100],
                        }}
                    >
                        {!isCollapsed && (
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                ml="15px"
                            >
                                <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
                                    VOTE<span style={{ color: colors.greenAccent[500] }}>HUB</span>
                                </Typography>
                            </Box>
                        )}
                    </MenuItem>

                    <Box paddingLeft={isCollapsed ? undefined : "1%"}>
                        {/* DASHBOARD */}
                        <Item
                            title="Dashboard"
                            to="/Admin"
                            icon={<HomeoutlinedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                        />

                        {/* DATA MANAGEMENT - Collapsible */}
                        <SubMenu
                            title="Data Management"
                            icon={<FolderIcon />}
                            defaultOpen={true}
                            style={{
                                color: colors.grey[100],
                            }}
                        >
                            <Item
                                title="Candidates Information"
                                to="/Candidate"
                                icon={<ContactsOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                            <Item
                                title="Student List Info"
                                to="/studentListInfo"
                                icon={<ListAltOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                            <Item
                                title="Pending Candidates"
                                to="/pendingCandidates"
                                icon={<PendingActionsIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                            <Item
                                title="Contact Messages"
                                to="/contacts"
                                icon={<MailOutlineIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                        </SubMenu>

                        {/* PAGES - Collapsible */}
                        <SubMenu
                            title="Pages"
                            icon={<PagesIcon />}
                            defaultOpen={true}
                            style={{
                                color: colors.grey[100],
                            }}
                        >
                            <Item
                                title="Calendar"
                                to="/calendar"
                                icon={<CalendarTodayOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                            <Item
                                title="Voting Settings"
                                to="/votingSettings"
                                icon={<SettingsIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                        </SubMenu>

                        {/* CHARTS & REPORTS - Collapsible */}
                        <SubMenu
                            title="Charts & Reports"
                            icon={<BarChartIcon />}
                            defaultOpen={true}
                            style={{
                                color: colors.grey[100],
                            }}
                        >
                            <Item
                                title="Bar Chart"
                                to="/BarChart"
                                icon={<BarChartOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                            <Item
                                title="Voting Report"
                                to="/votingReport"
                                icon={<AssessmentOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                        </SubMenu>

                        {/* NAVIGATION - Collapsible */}
                        <SubMenu
                            title="Navigation"
                            icon={<NavigationIcon />}
                            defaultOpen={false}
                            style={{
                                color: colors.grey[100],
                            }}
                        >
                            <Item
                                title="Back to Home"
                                to="/"
                                icon={<HomeIcon />}
                                selected={selected}
                                setSelected={setSelected}
                            />
                        </SubMenu>
                    </Box>
                </Menu>
            </ProSidebar>
        </Box>
    );
};

export default Sidebar;
