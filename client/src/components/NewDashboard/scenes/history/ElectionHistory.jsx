import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, useTheme } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { tokens } from "../../theme";
import Header from "../../newComponents/Header";
import api from '../../../../api';
import { toast } from 'react-toastify';
import HistoryIcon from '@mui/icons-material/History';

const ElectionHistory = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/api/admin/election-history`);
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load election history');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box m="20px">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Header title="ELECTION HISTORY" subtitle="Archive of past election results" />
            </Box>

            {loading ? (
                <Typography>Loading history...</Typography>
            ) : history.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" mt={10} color={colors.grey[300]}>
                    <HistoryIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5">No archived elections found.</Typography>
                    <Typography variant="body2">Archive an election from Voting Settings to see it here.</Typography>
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                    {history.map((record) => (
                        <Paper key={record._id} elevation={2} sx={{ backgroundColor: colors.primary[400] }}>
                            <Accordion sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box display="flex" flexDirection="column" width="100%">
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h5" color={colors.greenAccent[500]} fontWeight="bold">
                                                {record.electionTitle}
                                            </Typography>
                                            <Typography variant="body2" color={colors.grey[300]}>
                                                Archived: {new Date(record.archivedAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" gap={3} mt={1}>
                                            <Typography variant="body2" color={colors.grey[100]}>
                                                Total Votes: <strong>{record.totalVotes}</strong>
                                            </Typography>
                                            <Typography variant="body2" color={colors.grey[100]}>
                                                Period: {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Candidate</TableCell>
                                                    <TableCell>Party/Dept</TableCell>
                                                    <TableCell>Position</TableCell>
                                                    <TableCell align="right">Votes</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {record.results.map((candidate, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell component="th" scope="row" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {candidate.img && <Avatar src={candidate.img} sx={{ width: 24, height: 24 }} />}
                                                            {candidate.name}
                                                        </TableCell>
                                                        <TableCell>{candidate.party || candidate.department}</TableCell>
                                                        <TableCell>
                                                            {candidate.position ? (
                                                                <Chip label={candidate.position} size="small" color="primary" />
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography fontWeight="bold" color={colors.blueAccent[400]}>
                                                                {candidate.votes}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ElectionHistory;
