import { Box, IconButton, Typography, useTheme, CircularProgress, Button } from "@mui/material";
import { useState, useEffect } from 'react';
import Header from "../../newComponents/Header"
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
// import BarChart from "../../newComponents/BarChart";
// import GeographyChart from "../../newComponents/GeographyChart";
import Result from "../../newComponents/BarChart";
import StatBox from "../../newComponents/StatBox";
import "../../New.css"
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import { toast } from 'react-toastify';

const NewDashboard = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh
    const upcomingElections = [
        { id: '1', name: 'WCU Student President Election', date: '2025-12-01' },
    ];
    const [data, setData] = useState({
        voters: 0,
        candidates: 0,
        voted: 0,
    });
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // Function to manually refresh data
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Function to start new election
    const handleStartNewElection = async () => {
        console.log("🔵 START NEW ELECTION BUTTON CLICKED");

        // Single confirmation dialog
        if (!window.confirm(
            "⚠️ WARNING: This will DELETE ALL VOTES, CANDIDATES, and RESULTS.\n\n" +
            "Student lists and admin accounts will be preserved.\n\n" +
            "Are you sure you want to start a new election?"
        )) {
            console.log("🔴 User cancelled the operation");
            return;
        }

        console.log("✅ User confirmed the operation");

        try {
            console.log("📦 Reading currentUser from localStorage...");
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            console.log("📦 currentUser:", currentUser);

            // Use stored admin ID if available, otherwise use fallback
            let adminId = currentUser?._id || "6766786c4f039103c8120e98";

            if (!currentUser) {
                console.log("⚠️ No stored session found, using fallback admin ID");
            }

            console.log("🔑 Admin ID:", adminId);
            console.log("🌐 BASE_URL:", BASE_URL);
            console.log("🚀 Making POST request to:", `${BASE_URL}/api/admin/start-new-election`);

            const response = await axios.post(`${BASE_URL}/api/admin/start-new-election`, {
                adminId: adminId,
                confirmationCode: 'START_NEW_ELECTION'
            });

            console.log("✅ Response received:", response);
            console.log("📊 Response data:", response.data);

            if (response.data.success) {
                const summary = response.data.summary;
                console.log("🎉 SUCCESS! Summary:", summary);

                toast.success(
                    `✅ New Election Started!\n\n` +
                    `📊 ${summary.votesDeleted} votes cleared\n` +
                    `👥 ${summary.candidatesDeleted} candidates removed\n` +
                    `📝 ${summary.resultsDeleted} results cleared\n` +
                    `🔄 ${summary.votersReset} voters reset`,
                    { autoClose: 5000 }
                );

                // Optimistically update UI immediately for better UX
                console.log("🔄 Updating UI optimistically...");
                setData({
                    voters: data.voters,
                    candidates: 0,
                    voted: 0
                });
                setCandidates([]);

                // Force refresh to get synced data from backend
                setTimeout(() => {
                    console.log("🔄 Refreshing dashboard data...");
                    handleRefresh();
                }, 1000);
            } else {
                console.error("❌ Server returned success=false:", response.data.message);
                toast.error(response.data.message || "Failed to start new election");
            }
        } catch (error) {
            console.error("❌❌❌ CRITICAL ERROR:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response,
                request: error.request,
                config: error.config
            });

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Failed to start new election. Please try again.";

            toast.error(`Error: ${errorMessage}`);
        }
    };

    // Fetch dashboard statistics
    useEffect(() => {
        setLoading(true);
        axios.get(`${BASE_URL}/getDashboardData`)
            .then((response) => {
                const cardData = response.data.DashboardData;
                setData({
                    voters: cardData.voterCount,
                    candidates: cardData.candidateCount,
                    voted: cardData.votersVoted,
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching data: ", err);
                setLoading(false);
            });
    }, [refreshKey]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);
    // Fetch candidates with cache-busting
    useEffect(() => {
        axios.get(`${BASE_URL}/getCandidate`)
            .then((response) => {
                // Sort candidates by votes in descending order
                const sortedCandidates = response.data.candidate.sort((a, b) => {
                    return (b.votes || 0) - (a.votes || 0);
                });
                setCandidates(sortedCandidates);
            })
            .catch(err => {
                console.error("Error fetching candidates: ", err);
            });
    }, [refreshKey]);
    if (loading) {
        return <CircularProgress />;
    }

    return (
        <div className="mainBox">
            <Box m="20px" height="84vh">
                {/* HEADER */}
                <Box display="flex" mb="10px" justifyContent="space-between" alignItems="center" >
                    <Header title="ADMIN DASHBOARD" subtitle="Welcome Administrator" />

                    <Box display="flex" gap={2}>
                        <Button
                            onClick={handleStartNewElection}
                            startIcon={<PlayCircleOutlineIcon />}
                            variant="contained"
                            sx={{
                                backgroundColor: colors.blueAccent[600],
                                color: colors.grey[100],
                                fontSize: "14px",
                                fontWeight: "bold",
                                padding: "10px 20px",
                                '&:hover': {
                                    backgroundColor: colors.blueAccent[700],
                                }
                            }}
                        >
                            Start New Election
                        </Button>
                        <Button
                            onClick={handleRefresh}
                            startIcon={<RefreshIcon />}
                            variant="contained"
                            sx={{
                                backgroundColor: colors.greenAccent[600],
                                color: colors.grey[100],
                                fontSize: "14px",
                                fontWeight: "bold",
                                padding: "10px 20px",
                                '&:hover': {
                                    backgroundColor: colors.greenAccent[700],
                                }
                            }}
                        >
                            Refresh Data
                        </Button>
                    </Box>
                </Box>

                {/* GRID & CHARTS */}
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(12, 1fr)"
                    gridAutoRows="160px"
                    gap="25px"
                >

                    {/* ROW 1 */}
                    <Box
                        gridColumn="span 4"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <StatBox
                            title={data.voters}
                            subtitle="Total Voters"
                            icon={
                                <GroupIcon
                                    sx={{ color: colors.greenAccent[500], fontSize: "35px" }}
                                />
                            }
                        />
                    </Box>
                    <Box
                        gridColumn="span 4"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <StatBox
                            title={data.candidates}
                            subtitle="Total Candidates"
                            icon={
                                <PersonIcon
                                    sx={{ color: colors.greenAccent[500], fontSize: "35px" }}
                                />
                            }
                        />
                    </Box>
                    <Box
                        gridColumn="span 4"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <StatBox
                            title={data.voted}
                            subtitle="Total Voters who have Voted"
                            icon={
                                <HowToVoteIcon
                                    sx={{ color: colors.greenAccent[500], fontSize: "35px" }}
                                />
                            }
                        />
                    </Box>
                    {/* ROW 2 */}
                    <Box
                        gridColumn="span 8"
                        gridRow="span 2"
                        backgroundColor={colors.primary[400]}
                        borderRadius="16px"
                        boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                    >
                        <Box
                            mt="25px"
                            p="0 30px"
                            display="flex "
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Box>
                                <Typography
                                    variant="h4"
                                    fontWeight="700"
                                    color={colors.grey[100]}
                                >
                                    Election Result Real-time
                                </Typography>

                            </Box>
                            <Box>
                                <IconButton>
                                    <DownloadOutlinedIcon
                                        sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                                    />
                                </IconButton>
                            </Box>
                        </Box>
                        <Box height="250px" m="-20px 0 0 0">
                            {/* <LineChart isDashboard={true} /> */}
                            <Result isDashboard={true} />
                        </Box>
                    </Box>
                    <Box
                        gridColumn="span 4"
                        gridRow="span 2"
                        backgroundColor={colors.primary[400]}
                        borderRadius="16px"
                        boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                        overflow="auto"
                    >
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            borderBottom={`2px solid ${colors.primary[500]}`}
                            p="15px"
                        >
                            <Typography color={colors.grey[100]} variant="h4" fontWeight="700">
                                Current Leaders
                            </Typography>
                        </Box>
                        {candidates.map((candidate, i) => (
                            <Box
                                key={`${candidate._id}-${i}`}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                borderBottom={`1px solid ${colors.primary[500]}`}
                                p="15px"
                                sx={{
                                    transition: "background 0.3s ease",
                                    "&:hover": {
                                        backgroundColor: "rgba(104, 112, 250, 0.05)",
                                    }
                                }}
                            >
                                <Box>
                                    <Typography
                                        color={colors.greenAccent[500]}
                                        variant="h5"
                                        fontWeight="600"
                                    >
                                        {candidate.name}
                                    </Typography>
                                    <Typography color={colors.grey[100]} variant="body2">
                                        {candidate.party || "Independent"}
                                    </Typography>
                                </Box>
                                <Box
                                    backgroundColor={colors.greenAccent[500]}
                                    p="5px 12px"
                                    borderRadius="20px"
                                    color={colors.primary[500]}
                                    fontWeight="bold"
                                    fontSize="12px"
                                >
                                    {candidate.votes || 0} votes
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* ROW 3 */}
                    <Box
                        gridColumn="span 8"
                        gridRow="span 2"
                        backgroundColor={colors.primary[400]}
                        p="10px"
                    >
                        <Typography color={colors.grey[100]} variant="h4" fontWeight="600" sx={{ padding: "20px 20px 0 20px" }}>
                            Upcoming Elections
                        </Typography>
                        <Box height="250px" m="5px 0 0 0" overflow="auto">
                            {upcomingElections.map((election, i) => (
                                <Box
                                    key={`${election.id}-${i}`}
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    borderBottom={`4px solid ${colors.primary[500]}`}
                                    p="15px"
                                >
                                    <Box>
                                        <Typography
                                            color={colors.greenAccent[500]}
                                            variant="h5"
                                            fontWeight="600"
                                        >
                                            {election.name}
                                        </Typography>
                                        <Typography color={colors.grey[100]}>
                                            {election.date}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </div>

    )
}

export default NewDashboard;