import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import { Button } from '@mui/material';
import api from '../../../../api';
import { toast } from 'react-toastify';

const UpcomingElection = () => {
    const [theme, colorMode] = useMode();
    const colors = tokens(theme.palette.mode);
    const [loading, setLoading] = useState(true);
    const [elections, setElections] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [updating, setUpdating] = useState(false);

    // Update current time every second for real-time status
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchElections = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/voting/settings`);
            if (response.data.success) {
                const settings = response.data.settings;
                const startDate = new Date(settings.startDate);
                const endDate = new Date(settings.endDate);

                // Determine status
                let status = 'upcoming';
                if (!settings.isActive) {
                    status = 'disabled';
                } else if (currentTime < startDate) {
                    status = 'upcoming';
                } else if (currentTime >= startDate && currentTime <= endDate) {
                    status = 'active';
                } else {
                    status = 'ended';
                }

                const election = {
                    id: '1',
                    name: settings.electionTitle || 'Wachemo University Election',
                    startDate: startDate.toLocaleString(),
                    endDate: endDate.toLocaleString(),
                    duration: calculateDuration(startDate, endDate),
                    status: status,
                    isActive: settings.isActive,
                    votingActive: settings.votingActive,
                };

                setElections([election]);
            }
        } catch (error) {
            console.error('Error fetching elections:', error);
            toast.error('Failed to load election data');
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = (start, end) => {
        const durationMs = end - start;
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let durationStr = '';
        if (days > 0) durationStr += `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) durationStr += `${durationStr ? ', ' : ''}${hours} hour${hours > 1 ? 's' : ''}`;

        return durationStr || 'Less than 1 hour';
    };

    // Fetch voting settings on mount and refresh periodically
    useEffect(() => {
        fetchElections();

        // Refresh status every minute for real-time updates
        const interval = setInterval(() => {
            fetchElections();
        }, 60000); // Update every minute

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const handleStartStop = async (id) => {
        if (updating) return;

        setUpdating(true);
        try {
            const currentElection = elections.find(e => e.id === id);
            if (!currentElection) return;

            // Toggle the isActive status
            const newIsActive = !currentElection.isActive;

            const response = await api.post(`/api/voting/settings`, {
                isActive: newIsActive,
            });

            if (response.data.success) {
                toast.success(
                    newIsActive
                        ? 'Voting has been ENABLED'
                        : 'Voting has been DISABLED'
                );
                // Refresh election data
                await fetchElections();
            } else {
                toast.error(response.data.message || 'Failed to update voting status');
            }
        } catch (error) {
            console.error('Error updating voting status:', error);
            toast.error('Failed to update voting status. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const columns = [
        {
            field: "name",
            headerName: "ELECTION NAME",
            flex: 1.5,
            cellClassName: "name-column--cell",
        },
        {
            field: "startDate",
            headerName: "START DATE & TIME",
            flex: 1.5,
        },
        {
            field: "endDate",
            headerName: "END DATE & TIME",
            flex: 1.5,
        },
        {
            field: "duration",
            headerName: "DURATION",
            flex: 1,
        },
        {
            field: "status",
            headerName: "STATUS",
            flex: 1,
            renderCell: ({ row: { status } }) => {
                let bgColor, textColor, statusText;
                switch (status) {
                    case 'active':
                        bgColor = colors.greenAccent[600];
                        textColor = colors.grey[100];
                        statusText = 'ACTIVE';
                        break;
                    case 'upcoming':
                        bgColor = colors.blueAccent[600];
                        textColor = colors.grey[100];
                        statusText = 'UPCOMING';
                        break;
                    case 'ended':
                        bgColor = colors.redAccent[600];
                        textColor = colors.grey[100];
                        statusText = 'ENDED';
                        break;
                    case 'disabled':
                        bgColor = colors.grey[700];
                        textColor = colors.grey[100];
                        statusText = 'DISABLED';
                        break;
                    default:
                        bgColor = colors.grey[600];
                        textColor = colors.grey[100];
                        statusText = status.toUpperCase();
                }
                return (
                    <Box
                        sx={{
                            backgroundColor: bgColor,
                            color: textColor,
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        {statusText}
                    </Box>
                );
            },
        },
        {
            headerName: "ACTION",
            flex: 1,
            renderCell: ({ row: { id, isActive, status } }) => {
                // Only show toggle button if voting is upcoming or active
                if (status === 'ended') {
                    return (
                        <Typography color={colors.grey[400]} sx={{ fontStyle: 'italic' }}>
                            Voting period ended
                        </Typography>
                    );
                }
                return (
                    <Button
                        variant="contained"
                        disabled={updating}
                        sx={{
                            backgroundColor: isActive ? colors.redAccent[600] : colors.greenAccent[600],
                            color: 'white',
                            '&:hover': {
                                backgroundColor: isActive ? colors.redAccent[700] : colors.greenAccent[700],
                            },
                            '&:disabled': {
                                backgroundColor: colors.grey[600],
                            }
                        }}
                        onClick={() => handleStartStop(id)}
                    >
                        {updating ? 'Updating...' : (isActive ? 'Disable Voting' : 'Enable Voting')}
                    </Button>
                );
            },
        },
    ];

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="appNew">
                    <Sidebar />
                    <main className="content">
                        <Topbar />
                        <Box m="0px 20px">
                            <Header title="UPCOMING ELECTIONS / CURRENT ELECTIONS" subtitle="Managing the Elections" />

                            {loading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                                    <CircularProgress />
                                </Box>
                            ) : elections.length === 0 ? (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    No election configured. Please go to <strong>Voting Settings</strong> to set up an election.
                                </Alert>
                            ) : (
                                <Box
                                    m="20px 0 0 0"
                                    height="70vh"
                                    sx={{
                                        "& .MuiDataGrid-root": {
                                            border: "none",
                                        },
                                        "& .MuiDataGrid-cell": {
                                            borderBottom: "none",
                                        },
                                        "& .name-column--cell": {
                                            color: colors.greenAccent[300],
                                        },
                                        "& .MuiDataGrid-columnHeaders": {
                                            backgroundColor: colors.blueAccent[700],
                                            borderBottom: "none",
                                        },
                                        "& .MuiDataGrid-virtualScroller": {
                                            backgroundColor: colors.primary[400],
                                        },
                                        "& .MuiDataGrid-footerContainer": {
                                            borderTop: "none",
                                            backgroundColor: colors.blueAccent[700],
                                        },
                                        "& .MuiCheckbox-root": {
                                            color: `${colors.greenAccent[200]} !important`,
                                        },
                                    }}
                                >
                                    <DataGrid
                                        rows={elections}
                                        columns={columns}
                                        getRowId={(row) => row.id}
                                        disableSelectionOnClick
                                        autoHeight={false}
                                    />
                                </Box>
                            )}
                        </Box>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default UpcomingElection;
