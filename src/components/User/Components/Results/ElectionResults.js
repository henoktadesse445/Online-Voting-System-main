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
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        mb: 4,
                        backgroundColor: colors.primary[400],
                        textAlign: 'center',
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
                        <TrendingUp sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
                        <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">
                        Live Election Results
                        </Typography>
                    </Box>
                    <Typography variant="h6" color={colors.grey[300]} mb={3}>
                        Real-time voting results - Auto-updates every 10 seconds
                    </Typography>
                    
                    <Box display="flex" justifyContent="center" gap={3} mb={3} sx={{ flexWrap: 'wrap' }}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                backgroundColor: colors.blueAccent[700],
                                minWidth: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <People sx={{ fontSize: 30, color: colors.grey[100] }} />
                            <Box>
                                <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                                    {candidates.length}
                                </Typography>
                                <Typography variant="body2" color={colors.grey[300]}>
                                    Candidates
                                </Typography>
                            </Box>
                        </Paper>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                backgroundColor: colors.greenAccent[700],
                                minWidth: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <EmojiEvents sx={{ fontSize: 30, color: colors.grey[100] }} />
                            <Box>
                                <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                                    {totalVotes}
                                </Typography>
                                <Typography variant="body2" color={colors.grey[300]}>
                                    Total Votes
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>

                    <Button 
                        variant="contained"
                        onClick={() => fetchResults(true)}
                        disabled={refreshing}
                        startIcon={<Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
                        sx={{
                            backgroundColor: colors.blueAccent[600],
                            color: colors.grey[100],
                            '&:hover': {
                                backgroundColor: colors.blueAccent[700],
                            },
                            mb: 2,
                        }}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh Now'}
                    </Button>
                    <Typography variant="body2" color={colors.grey[300]}>
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                </Paper>

                {/* Winners by Position (After Election) */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        mb: 4,
                        backgroundColor: colors.primary[400],
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <EmojiEvents sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
                        <Box>
                            <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                                Winners by Position
                            </Typography>
                            <Typography variant="body2" color={colors.grey[300]} sx={{ mt: 0.5 }}>
                                Positions are automatically assigned after election ends based on vote totals
                            </Typography>
                        </Box>
                    </Box>
                    <Grid container spacing={3}>
                        {positions.map((position) => {
                            const winner = winnersByPosition[position];
                            return (
                                <Grid item xs={12} sm={6} md={4} key={position}>
                                    <Paper
                                        elevation={winner ? 4 : 2}
                                        sx={{
                                            p: 3,
                                            backgroundColor: winner ? colors.greenAccent[800] : colors.primary[600],
                                            border: winner ? `3px solid ${colors.greenAccent[500]}` : 'none',
                                            borderRadius: 2,
                                            height: '100%',
                                        }}
                                    >
                                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold" mb={2}>
                                            {position}
                                        </Typography>
                                        {winner && winner.candidate ? (
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                    {winner.candidate.img ? (
                                                        <Box
                                                            component="img"
                                                            src={`${BASE_URL}${winner.candidate.img}`}
                                                            alt={winner.candidate.name}
                                                            sx={{
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: '50%',
                                                                objectFit: 'cover',
                                                                border: `3px solid ${colors.greenAccent[500]}`,
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: '50%',
                                                                backgroundColor: colors.greenAccent[700],
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: colors.grey[100],
                                                                fontSize: '1.8rem',
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            {winner.candidate.name?.charAt(0) || '?'}
                                                        </Box>
                                                    )}
                                                    <Box>
                                                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">
                                                            {winner.candidate.name}
                                                        </Typography>
                                                        <Typography variant="body2" color={colors.grey[300]}>
                                                            {winner.candidate.party || winner.candidate.department || 'Not specified'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body1" color={colors.grey[300]}>
                                                        Votes:
                                                    </Typography>
                                                    <Typography variant="h5" color={colors.greenAccent[400]} fontWeight="bold">
                                                        {winner.voteCount || 0}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    icon={<EmojiEvents />}
                                                    label="Winner!"
                                                    sx={{
                                                        mt: 2,
                                                        backgroundColor: colors.greenAccent[600],
                                                        color: colors.grey[100],
                                                        fontWeight: 'bold',
                                                        width: '100%',
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Typography variant="body1" color={colors.grey[300]} textAlign="center">
                                                Position not assigned yet (wait for election to end)
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>

                {/* All Candidates Results */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        mb: 4,
                        backgroundColor: colors.primary[400],
                    }}
                >
                    <Typography variant="h4" color={colors.grey[100]} fontWeight="bold" mb={3}>
                        All Candidates Results
                    </Typography>
                    <Grid container spacing={3}>
                        {candidates.length === 0 ? (
                            <Grid item xs={12}>
                                <Paper
                                    elevation={3}
                                    sx={{
                                        p: 5,
                                        textAlign: 'center',
                                        backgroundColor: colors.primary[400],
                                    }}
                                >
                                    <Typography variant="h5" color={colors.grey[100]} gutterBottom>
                                        No candidates registered yet
                                    </Typography>
                                    <Typography variant="body1" color={colors.grey[300]}>
                                        Check back later for election results
                                    </Typography>
                                </Paper>
                            </Grid>
                        ) : (
                            candidates.map((candidate, index) => (
                            <Grid item xs={12} sm={6} md={4} key={candidate._id}>
                                <Paper
                                    elevation={index === 0 ? 6 : 3}
                                    sx={{
                                        p: 3,
                                        backgroundColor: colors.primary[400],
                                        border: index === 0 ? `3px solid ${colors.greenAccent[600]}` : 'none',
                                        borderRadius: 2,
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: 6,
                                        },
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                                        <Box
                                            sx={{
                                                fontSize: '2rem',
                                                minWidth: '50px',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                                {getRankIcon(index)}
                                        </Box>
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
                                                        border: `3px solid ${colors.blueAccent[500]}`,
                                                    }}
                                                    />
                                                ) : (
                                                <Box
                                                    sx={{
                                                        width: 60,
                                                        height: 60,
                                                        borderRadius: '50%',
                                                        backgroundColor: colors.blueAccent[600],
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: colors.grey[100],
                                                        fontSize: '1.8rem',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {candidate.name?.charAt(0) || '?'}
                                                </Box>
                                            )}
                                        </Box>
                                        <Box flexGrow={1}>
                                            <Typography variant="h6" color={colors.grey[100]} fontWeight="bold" noWrap>
                                                {candidate.name || 'Unknown'}
                                            </Typography>
                                            <Typography variant="body2" color={colors.grey[300]}>
                                                {candidate.party || candidate.department || 'Not specified'}
                                            </Typography>
                                            {candidate.position && (
                                                <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold" sx={{ mt: 0.5 }}>
                                                    Position: {candidate.position}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="body1" color={colors.grey[300]} fontWeight="bold">
                                                Votes:
                                            </Typography>
                                            <Typography variant="h5" color={colors.greenAccent[400]} fontWeight="bold">
                                                {candidate.votes || 0}
                                            </Typography>
                                        </Box>
                                        
                                        <Box mb={2}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseFloat(getPercentage(candidate.votes || 0))}
                                                sx={{
                                                    height: 25,
                                                    borderRadius: 2,
                                                    backgroundColor: colors.primary[600],
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor:
                                                            index === 0 ? colors.greenAccent[500] :
                                                            index === 1 ? colors.blueAccent[500] :
                                                            index === 2 ? colors.redAccent[500] :
                                                            colors.grey[600],
                                                        borderRadius: 2,
                                                    },
                                                }}
                                            />
                                            <Typography 
                                                variant="body2" 
                                                color={colors.grey[100]} 
                                                mt={0.5}
                                                textAlign="center"
                                                fontWeight="bold"
                                            >
                                                {getPercentage(candidate.votes || 0)}%
                                            </Typography>
                                        </Box>
                                            
                                            {index === 0 && totalVotes > 0 && (
                                            <Chip
                                                icon={<EmojiEvents />}
                                                label="Currently Leading!"
                                                sx={{
                                                    backgroundColor: colors.greenAccent[600],
                                                    color: colors.grey[100],
                                                    fontWeight: 'bold',
                                                    width: '100%',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        ))
                    )}
                </Grid>
                </Paper>

                {/* Footer Note */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 3,
                        mt: 5,
                        textAlign: 'center',
                        backgroundColor: colors.primary[400],
                    }}
                >
                    <Typography variant="body1" color={colors.grey[100]}>
                                <strong>Note:</strong> Results are updated in real-time. 
                                The final results will be announced after the voting period ends.
                    </Typography>
                </Paper>
            </Container>
        </Box>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default ElectionResults;

