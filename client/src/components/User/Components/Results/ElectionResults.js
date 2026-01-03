import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import UserNavbar from '../../../Navbar/UserNavbar';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Button,
    LinearProgress,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    Refresh,
    TrendingUp,
    People,
    EmojiEvents,
    Person
} from '@mui/icons-material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ColorModeContext, useMode, tokens } from '../../../NewDashboard/theme';
import './ElectionResults.css';

const ElectionResults = () => {
    const [theme, colorMode] = useMode();
    const colors = tokens(theme.palette.mode);
    const [candidates, setCandidates] = useState([]);
    const [winnersByPosition, setWinnersByPosition] = useState({});
    const [loading, setLoading] = useState(true);
    const [totalVotes, setTotalVotes] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);

    const positions = [
        "President",
        "Vice President",
        "Secretary",
        "Finance Officer",
        "Public Relations Officer",
        "Sports & Recreation Officer",
        "Gender and Equality Officer"
    ];

    const fetchResults = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            // Fetch winners by position
            const winnersResponse = await axios.get(`${BASE_URL}/api/winnersByPosition`);
            if (winnersResponse.data.success) {
                setWinnersByPosition(winnersResponse.data.winners);
            }

            // Also fetch all candidates for backward compatibility
            const response = await axios.get(`${BASE_URL}/getCandidate`);
            const candidatesData = response.data.candidate;

            // Sort by votes (highest first)
            const sorted = candidatesData.sort((a, b) => (b.votes || 0) - (a.votes || 0));
            setCandidates(sorted);

            // Calculate total votes
            const total = sorted.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
            setTotalVotes(total);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchResults();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            fetchResults();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const getPercentage = (votes) => {
        if (totalVotes === 0) return 0;
        return ((votes / totalVotes) * 100).toFixed(1);
    };

    const getRankIcon = (index) => {
        return `${index + 1}`;
    };

    const getProgressVariant = (index) => {
        if (index === 0) return 'success';
        if (index === 1) return 'info';
        if (index === 2) return 'warning';
        return 'secondary';
    };

    if (loading) {
        return (
            <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Box sx={{ backgroundColor: colors.primary[500], minHeight: '100vh' }}>
                        <UserNavbar />
                        <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            minHeight="80vh"
                        >
                            <CircularProgress sx={{ color: colors.greenAccent[500], mb: 2 }} />
                            <Typography variant="h6" color={colors.grey[100]}>
                                Loading election results...
                            </Typography>
                        </Box>
                    </Box>
                </ThemeProvider>
            </ColorModeContext.Provider>
        );
    }

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box sx={{ backgroundColor: colors.primary[500], minHeight: '100vh', pb: 4 }}>
                    <UserNavbar />
                    <Container maxWidth="xl" sx={{ pt: 4 }}>
                        {/* Header Section */}
                        <Box className="glass-panel results-header-glass">
                            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
                                <TrendingUp sx={{ fontSize: 48, color: colors.greenAccent[500] }} />
                                <Typography variant="h1">
                                    Live Election Results
                                </Typography>
                            </Box>
                            <Typography variant="h6" color="var(--text-secondary)" mb={4}>
                                Real-time voting results - Auto-updates every 10 seconds
                            </Typography>

                            <Box className="stats-grid">
                                <Box className="stat-card-premium candidates">
                                    <People sx={{ fontSize: 40, color: 'white' }} />
                                    <Box>
                                        <Typography variant="h4">
                                            {candidates.length}
                                        </Typography>
                                        <p>Candidates</p>
                                    </Box>
                                </Box>
                                <Box className="stat-card-premium votes">
                                    <EmojiEvents sx={{ fontSize: 40, color: 'white' }} />
                                    <Box>
                                        <Typography variant="h4">
                                            {totalVotes}
                                        </Typography>
                                        <p>Total Votes</p>
                                    </Box>
                                </Box>
                            </Box>

                            <Button
                                className="btn-refresh-modern"
                                onClick={() => fetchResults(true)}
                                disabled={refreshing}
                                startIcon={<Refresh className={refreshing ? 'spinning' : ''} />}
                                fullWidth={false}
                            >
                                {refreshing ? 'Refreshing...' : 'Refresh Now'}
                            </Button>
                            <Typography variant="body2" color="var(--text-muted)" sx={{ mt: 3, opacity: 0.8 }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </Typography>
                        </Box>

                        {/* Winners by Position (After Election) */}
                        <Box className="glass-panel">
                            <Box display="flex" alignItems="center" gap={2} mb={4}>
                                <EmojiEvents sx={{ fontSize: 40, color: 'var(--color-success)' }} />
                                <Box>
                                    <Typography variant="h4" color="var(--text-primary)" fontWeight="800">
                                        Winners by Position
                                    </Typography>
                                    <Typography variant="body2" color="var(--text-secondary)" sx={{ mt: 0.5 }}>
                                        Positions are automatically assigned after election ends based on vote totals
                                    </Typography>
                                </Box>
                            </Box>
                            <Grid container spacing={4}>
                                {positions.map((position) => {
                                    const winner = winnersByPosition[position];
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={position}>
                                            <Box className={`candidate-result-card ${winner ? 'winner' : ''}`}>
                                                <Typography variant="h6" color="var(--color-primary)" fontWeight="800" mb={3} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    {position}
                                                </Typography>
                                                {winner && winner.candidate ? (
                                                    <Box>
                                                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                                                            {winner.candidate.img ? (
                                                                <Box
                                                                    component="img"
                                                                    src={`${BASE_URL}${winner.candidate.img}`}
                                                                    alt={winner.candidate.name}
                                                                    sx={{
                                                                        width: 70,
                                                                        height: 70,
                                                                        borderRadius: '50%',
                                                                        objectFit: 'cover',
                                                                        border: `3px solid var(--color-success)`,
                                                                        boxShadow: '0 0 15px rgba(76, 206, 172, 0.4)'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        width: 70,
                                                                        height: 70,
                                                                        borderRadius: '50%',
                                                                        background: 'linear-gradient(135deg, var(--color-success), #3ba188)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: 'white',
                                                                        fontSize: '2rem',
                                                                        fontWeight: '800',
                                                                    }}
                                                                >
                                                                    {winner.candidate.name?.charAt(0) || '?'}
                                                                </Box>
                                                            )}
                                                            <Box>
                                                                <Typography variant="h6" color="var(--text-primary)" fontWeight="800">
                                                                    {winner.candidate.name}
                                                                </Typography>
                                                                <Typography variant="body2" color="var(--text-muted)">
                                                                    {winner.candidate.party || winner.candidate.department || 'Not specified'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                            <Typography variant="body2" color="var(--text-secondary)">
                                                                Final Votes:
                                                            </Typography>
                                                            <Typography variant="h4" color="var(--color-success)" fontWeight="900">
                                                                {winner.voteCount || 0}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            icon={<EmojiEvents sx={{ color: 'white !important' }} />}
                                                            label="Elected Official"
                                                            sx={{
                                                                mt: 2,
                                                                background: 'linear-gradient(135deg, var(--color-success), #3ba188)',
                                                                color: 'white',
                                                                fontWeight: '800',
                                                                width: '100%',
                                                                height: 32,
                                                                border: 'none'
                                                            }}
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="150px" sx={{ opacity: 0.6 }}>
                                                        <CircularProgress size={24} sx={{ mb: 2, color: 'var(--text-muted)' }} />
                                                        <Typography variant="body2" color="var(--text-muted)" textAlign="center">
                                                            Outcome Pending
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>

                        {/* All Candidates Results */}
                        <Box className="glass-panel">
                            <Typography variant="h4" color="var(--text-primary)" fontWeight="800" mb={4}>
                                Detailed Candidate Performance
                            </Typography>
                            <Grid container spacing={3}>
                                {candidates.length === 0 ? (
                                    <Grid item xs={12}>
                                        <Box sx={{ p: 10, textAlign: 'center' }}>
                                            <Person sx={{ fontSize: 64, color: 'var(--text-muted)', mb: 2, opacity: 0.3 }} />
                                            <Typography variant="h5" color="var(--text-secondary)">
                                                No data available yet
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ) : (
                                    candidates.map((candidate, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={candidate._id}>
                                            <Box className={`candidate-result-card ${index === 0 ? 'winner' : ''}`}>
                                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                                    <Typography className="rank-display">
                                                        #{index + 1}
                                                    </Typography>
                                                    <Box>
                                                        {candidate.img ? (
                                                            <Box
                                                                component="img"
                                                                src={candidate.img}
                                                                alt={candidate.name}
                                                                sx={{
                                                                    width: 60,
                                                                    height: 60,
                                                                    borderRadius: '50%',
                                                                    objectFit: 'cover',
                                                                    border: `2px solid ${index === 0 ? 'var(--color-success)' : 'var(--color-primary)'}`,
                                                                    boxShadow: 'var(--shadow-sm)'
                                                                }}
                                                            />
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    width: 60,
                                                                    height: 60,
                                                                    borderRadius: '50%',
                                                                    background: index === 0 ? 'linear-gradient(135deg, var(--color-success), #3ba188)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontSize: '1.5rem',
                                                                    fontWeight: 'bold',
                                                                }}
                                                            >
                                                                {candidate.name?.charAt(0) || '?'}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Box flexGrow={1}>
                                                        <Typography variant="h6" color="var(--text-primary)" fontWeight="800" noWrap>
                                                            {candidate.name || 'Unknown'}
                                                        </Typography>
                                                        <Typography variant="body2" color="var(--text-muted)">
                                                            {candidate.party || candidate.department || 'Not specified'}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box className="vote-progress-wrapper">
                                                    <Box className="progress-label-group">
                                                        <Typography variant="body2" color="var(--text-secondary)" fontWeight="700">
                                                            Vote Count: <span style={{ color: index === 0 ? 'var(--color-success)' : 'var(--color-primary)', fontSize: '1.2rem' }}>{candidate.votes || 0}</span>
                                                        </Typography>
                                                        <Typography variant="body2" color="var(--text-primary)" fontWeight="800">
                                                            {getPercentage(candidate.votes || 0)}%
                                                        </Typography>
                                                    </Box>

                                                    <LinearProgress
                                                        variant="determinate"
                                                        className="custom-progress"
                                                        value={parseFloat(getPercentage(candidate.votes || 0))}
                                                    />

                                                    {index === 0 && totalVotes > 0 && (
                                                        <Chip
                                                            icon={<TrendingUp sx={{ color: 'white !important' }} />}
                                                            label="Currently Leading"
                                                            sx={{
                                                                mt: 3,
                                                                background: 'linear-gradient(135deg, var(--color-success), #20c997)',
                                                                color: 'white',
                                                                fontWeight: '800',
                                                                width: '100%',
                                                                borderRadius: '8px',
                                                                height: 36
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))
                                )}
                            </Grid>
                        </Box>

                        {/* Footer Note */}
                        <Box className="glass-panel" sx={{ mt: 2, textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
                            <Typography variant="body1" color="var(--text-secondary)">
                                <strong>Notice:</strong> All data is fetched in real-time from the blockchain. Final verification will be performed automatically once the voting session expires.
                            </Typography>
                        </Box>
                    </Container>
                </Box>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default ElectionResults;

