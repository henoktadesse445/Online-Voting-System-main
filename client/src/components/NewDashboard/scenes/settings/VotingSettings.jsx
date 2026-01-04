import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Switch, FormControlLabel, Alert, Paper, IconButton, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../newComponents/Header";
import api from '../../../../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const VotingSettings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [settings, setSettings] = useState({
        startDate: '',
        endDate: '',
        isActive: true,
        electionTitle: 'Wachemo University Election',
        votingActive: false,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    // Update current time every second for live countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Helper function to format date for datetime-local input (uses LOCAL time, not UTC)
    const formatLocalDateTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const fetchSettings = async () => {
        try {
            const response = await api.get(`/api/voting/settings`);
            if (response.data.success) {
                const s = response.data.settings;
                // Format dates for datetime-local input using LOCAL time
                const startDate = formatLocalDateTime(s.startDate);
                const endDate = formatLocalDateTime(s.endDate);

                setSettings({
                    ...s,
                    startDate,
                    endDate,
                });
            }
        } catch (error) {
            console.error('Error fetching voting settings:', error);
            toast.error('Failed to load voting settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const adminId = currentUser?._id;

            const response = await api.post(`/api/voting/settings`, {
                startDate: settings.startDate,
                endDate: settings.endDate,
                isActive: settings.isActive,
                electionTitle: settings.electionTitle,
                adminId: adminId,
                skipAutoReset: true, // Prevent automatic reset when saving settings
            });

            if (response.data.success) {
                toast.success('Voting settings saved successfully!');

                // Update with response data
                const s = response.data.settings;
                const startDate = formatLocalDateTime(s.startDate);
                const endDate = formatLocalDateTime(s.endDate);

                setSettings({
                    ...s,
                    startDate,
                    endDate,
                });
            } else {
                toast.error(response.data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving voting settings:', error);
            const message = error.response?.data?.message || 'Failed to save voting settings';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const startDate = settings.startDate ? new Date(settings.startDate) : null;
    const endDate = settings.endDate ? new Date(settings.endDate) : null;
    const isVotingActive = settings.isActive && startDate && endDate && currentTime >= startDate && currentTime <= endDate;
    const hasNotStarted = startDate && currentTime < startDate;
    const hasEnded = endDate && currentTime > endDate;

    // Calculate total duration
    const calculateDuration = () => {
        if (!startDate || !endDate) return null;
        const durationMs = endDate - startDate;
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        let durationStr = '';
        if (days > 0) durationStr += `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) durationStr += `${durationStr ? ', ' : ''}${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0 && days === 0) durationStr += `${durationStr ? ', ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;

        return durationStr || 'Less than 1 minute';
    };

    const totalDuration = calculateDuration();
    const timeRemaining = isVotingActive && endDate ? endDate - currentTime : null;
    const timeUntilStart = hasNotStarted && startDate ? startDate - currentTime : null;

    const formatTime = (ms) => {
        if (!ms || ms <= 0) return '0 seconds';
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (seconds > 0 && days === 0) result += `${seconds}s`;

        return result.trim() || 'Less than 1 second';
    };

    // Show loading state after all hooks are called
    if (loading) {
        return (
            <Box m="20px">
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <IconButton
                        onClick={() => navigate('/Admin')}
                        sx={{
                            backgroundColor: colors.blueAccent[600],
                            color: colors.grey[100],
                            '&:hover': {
                                backgroundColor: colors.blueAccent[700],
                            },
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Header title="VOTING SETTINGS" subtitle="Configure voting period and duration" />
                </Box>
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <Typography>Loading settings...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <IconButton
                    onClick={() => navigate('/Admin')}
                    sx={{
                        backgroundColor: colors.blueAccent[600],
                        color: colors.grey[100],
                        '&:hover': {
                            backgroundColor: colors.blueAccent[700],
                        },
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Header title="VOTING SETTINGS" subtitle="Configure voting period and duration" />
            </Box>

            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    backgroundColor: colors.primary[400],
                    mt: 2,
                }}
            >
                {/* Voting Duration Summary Card */}
                {startDate && endDate && (
                    <Paper
                        elevation={2}
                        sx={{
                            p: 3,
                            mb: 3,
                            backgroundColor: colors.blueAccent[800],
                            border: `2px solid ${colors.blueAccent[600]}`,
                        }}
                    >
                        <Typography variant="h4" color={colors.grey[100]} sx={{ mb: 2, fontWeight: 'bold' }}>
                            Voting Period Summary
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                                    Start Date & Time:
                                </Typography>
                                <Typography variant="h5" color={colors.greenAccent[400]} sx={{ fontWeight: 'bold' }}>
                                    {startDate.toLocaleString()}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                                    End Date & Time:
                                </Typography>
                                <Typography variant="h5" color={colors.redAccent[400]} sx={{ fontWeight: 'bold' }}>
                                    {endDate.toLocaleString()}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                                    Total Duration:
                                </Typography>
                                <Typography variant="h5" color={colors.blueAccent[400]} sx={{ fontWeight: 'bold' }}>
                                    {totalDuration}
                                </Typography>
                            </Box>
                            {isVotingActive && timeRemaining && (
                                <Box>
                                    <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                                        Time Remaining:
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[400]} sx={{ fontWeight: 'bold' }}>
                                        {formatTime(timeRemaining)}
                                    </Typography>
                                </Box>
                            )}
                            {hasNotStarted && timeUntilStart && (
                                <Box>
                                    <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                                        Starts In:
                                    </Typography>
                                    <Typography variant="h5" color={colors.blueAccent[400]} sx={{ fontWeight: 'bold' }}>
                                        {formatTime(timeUntilStart)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                )}

                {/* Status Alert */}
                <Alert
                    severity={
                        isVotingActive ? 'success' :
                            hasNotStarted ? 'info' :
                                hasEnded ? 'warning' :
                                    !settings.isActive ? 'error' : 'info'
                    }
                    sx={{ mb: 3 }}
                >
                    {isVotingActive && `Voting is currently ACTIVE (${formatTime(timeRemaining)} remaining)`}
                    {hasNotStarted && `Voting has not started yet. It will begin on ${startDate?.toLocaleString()} (in ${formatTime(timeUntilStart)})`}
                    {hasEnded && `Voting has ended on ${endDate?.toLocaleString()}`}
                    {!settings.isActive && 'Voting is DISABLED by administrator'}
                </Alert>

                {/* Quick Action Buttons */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<PlayCircleOutlineIcon />}
                        onClick={async () => {
                            if (saving) return;

                            // Set start time to 1 minute ago to ensure immediate activation
                            // This accounts for any timezone, network delay, or clock sync issues
                            const now = new Date();
                            const startDate = new Date(now.getTime() - 60000); // 1 minute ago for safety
                            // Set end time to 7 days from now (default duration)
                            const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                            // Format using LOCAL time (not UTC) to ensure correct minutes and seconds
                            const startDateString = formatLocalDateTime(startDate);
                            const endDateString = formatLocalDateTime(endDate);

                            setSaving(true);
                            try {
                                const response = await api.post(`/api/voting/settings`, {
                                    startDate: startDateString,
                                    endDate: endDateString,
                                    isActive: true,
                                });
                                if (response.data.success) {
                                    toast.success('Voting started NOW! Duration: 7 days');
                                    await fetchSettings();
                                }
                            } catch (error) {
                                console.error('Error starting voting:', error);
                                toast.error('Failed to start voting now');
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving}
                        sx={{
                            backgroundColor: colors.blueAccent[600],
                            color: 'white',
                            flex: 1,
                            minWidth: '180px',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: colors.blueAccent[700],
                            },
                        }}
                    >
                        Start Voting Now
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={async () => {
                            try {
                                const response = await api.post(`/api/voting/settings`, {
                                    isActive: true,
                                    skipAutoReset: true, // Only toggle status, don't reset data
                                });
                                if (response.data.success) {
                                    toast.success('Voting ENABLED');
                                    await fetchSettings();
                                }
                            } catch (error) {
                                toast.error('Failed to enable voting');
                            }
                        }}
                        disabled={saving || settings.isActive}
                        sx={{
                            backgroundColor: colors.greenAccent[600],
                            color: 'white',
                            flex: 1,
                            minWidth: '150px',
                            '&:hover': {
                                backgroundColor: colors.greenAccent[700],
                            },
                            '&:disabled': {
                                backgroundColor: colors.greenAccent[800],
                                color: colors.grey[400],
                            },
                        }}
                    >
                        Enable Voting
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<StopIcon />}
                        onClick={async () => {
                            try {
                                const response = await api.post(`/api/voting/settings`, {
                                    isActive: false,
                                    skipAutoReset: true, // Only toggle status, don't reset data
                                });
                                if (response.data.success) {
                                    toast.success('Voting DISABLED');
                                    await fetchSettings();
                                }
                            } catch (error) {
                                toast.error('Failed to disable voting');
                            }
                        }}
                        disabled={saving || !settings.isActive}
                        sx={{
                            backgroundColor: colors.redAccent[600],
                            color: 'white',
                            flex: 1,
                            minWidth: '150px',
                            '&:hover': {
                                backgroundColor: colors.redAccent[700],
                            },
                            '&:disabled': {
                                backgroundColor: colors.redAccent[800],
                                color: colors.grey[400],
                            },
                        }}
                    >
                        Disable Voting
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchSettings}
                        sx={{
                            borderColor: colors.grey[100],
                            color: colors.grey[100],
                            minWidth: '150px',
                            '&:hover': {
                                borderColor: colors.grey[300],
                                backgroundColor: colors.primary[500],
                            },
                        }}
                    >
                        Refresh Status
                    </Button>
                </Box>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Election Title"
                        name="electionTitle"
                        value={settings.electionTitle}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: colors.primary[500],
                            },
                        }}
                    />

                    <TextField
                        label="Voting Start Date & Time"
                        name="startDate"
                        type="datetime-local"
                        value={settings.startDate}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: colors.primary[500],
                            },
                        }}
                    />

                    <TextField
                        label="Voting End Date & Time"
                        name="endDate"
                        type="datetime-local"
                        value={settings.endDate}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{
                            '& .MuiFilledInput-root': {
                                backgroundColor: colors.primary[500],
                            },
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.isActive}
                                onChange={handleChange}
                                name="isActive"
                                color="secondary"
                            />
                        }
                        label={
                            <Typography color={colors.grey[100]}>
                                Enable Voting
                            </Typography>
                        }
                    />

                    <Box display="flex" gap={2} mt={2}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                                backgroundColor: colors.greenAccent[600],
                                '&:hover': {
                                    backgroundColor: colors.greenAccent[700],
                                },
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={fetchSettings}
                            sx={{
                                borderColor: colors.grey[100],
                                color: colors.grey[100],
                            }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>

        </Box>
    );
};

export default VotingSettings;

