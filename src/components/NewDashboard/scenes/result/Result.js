import { Box, IconButton, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import BarChart from "../../newComponents/BarChart";
import Header from "../../newComponents/Header";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';

const Result = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCandidates();
        const interval = setInterval(() => {
            fetchCandidates();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/getCandidate`);
            if (response.data.candidate) {
                const sorted = [...response.data.candidate].sort((a, b) => (b.votes || 0) - (a.votes || 0));
                setCandidates(sorted);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);

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
                <Header title="RESULTS" subtitle="Election Result" />
            </Box>

            {/* Summary Cards */}
            <Box display="flex" gap={2} mb={3} sx={{ flexWrap: 'wrap' }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        flex: 1,
                        minWidth: '200px',
                        backgroundColor: colors.blueAccent[700],
                    }}
                >
                    <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                        Total Candidates
                    </Typography>
                    <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                        {candidates.length}
                    </Typography>
                </Paper>
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        flex: 1,
                        minWidth: '200px',
                        backgroundColor: colors.greenAccent[700],
                    }}
                >
                    <Typography variant="h6" color={colors.grey[300]} sx={{ mb: 1 }}>
                        Total Votes
                    </Typography>
                    <Typography variant="h4" color={colors.grey[100]} fontWeight="bold">
                        {totalVotes}
                    </Typography>
                </Paper>
            </Box>

            {/* Bar Chart */}
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: colors.primary[400],
                }}
            >
                <Typography variant="h5" color={colors.grey[100]} sx={{ mb: 2 }}>
                    Votes Distribution Chart
                </Typography>
                <Box height="60vh">
                    <BarChart />
                </Box>
            </Paper>

            {/* Candidate Vote Count Table */}
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    backgroundColor: colors.primary[400],
                }}
            >
                <Typography variant="h5" color={colors.grey[100]} sx={{ mb: 2 }}>
                    Number of Voters per Candidate
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                                    Rank
                                </TableCell>
                                <TableCell sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                                    Candidate Name
                                </TableCell>
                                <TableCell sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                                    Department
                                </TableCell>
                                <TableCell align="center" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                                    Votes Received
                                </TableCell>
                                <TableCell align="center" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                                    Percentage
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: colors.grey[300] }}>
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : candidates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: colors.grey[300] }}>
                                        No candidates found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                candidates.map((candidate, index) => {
                                    const votes = candidate.votes || 0;
                                    const percentage = totalVotes > 0
                                        ? (votes / totalVotes * 100).toFixed(1)
                                        : 0;
                                    return (
                                        <TableRow key={candidate._id}>
                                            <TableCell sx={{ color: colors.grey[100] }}>
                                                <Chip
                                                    label={index + 1}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            index === 0 ? colors.greenAccent[600] :
                                                                index === 1 ? colors.blueAccent[600] :
                                                                    index === 2 ? colors.redAccent[500] :
                                                                        colors.grey[700],
                                                        color: colors.grey[100],
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                                                {candidate.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell sx={{ color: colors.grey[300] }}>
                                                {candidate.party || candidate.department || 'Not specified'}
                                            </TableCell>
                                            <TableCell align="center" sx={{ color: colors.greenAccent[400], fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {votes} {votes === 1 ? 'Vote' : 'Votes'}
                                            </TableCell>
                                            <TableCell align="center" sx={{ color: colors.grey[100], fontWeight: 'medium' }}>
                                                {percentage}%
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default Result;
