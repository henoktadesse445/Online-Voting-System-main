import { Box, Button, Typography, useTheme, Card, CardContent, Grid } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../newComponents/Header";
import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../../helper";
import { DataGrid } from "@mui/x-data-grid";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

const VotingReport = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/api/votingReport`);
            if (response.data.success) {
                setReportData(response.data.report);
            } else {
                setError("Failed to load report");
            }
        } catch (err) {
            console.error("Error fetching report:", err);
            setError("Error loading voting report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!reportData) return;

        // Create a printable version
        const printWindow = window.open('', '_blank');
        const reportHTML = generateReportHTML();

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.focus();

        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const generateReportHTML = () => {
        if (!reportData) return '';

        const { summary, candidateResults, voteDetails, positionBreakdown, statistics } = reportData;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Voting Report - Wachemo University</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
          }
          h2 {
            color: #34495e;
            margin-top: 30px;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .summary-card {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            color: #7f8c8d;
            font-size: 14px;
          }
          .summary-card p {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #95a5a6;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>Wachemo University Voting System - Election Report</h1>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Registered Voters</h3>
            <p>${summary.totalVoters}</p>
          </div>
          <div class="summary-card">
            <h3>Total Votes Cast</h3>
            <p>${summary.totalVotesCast}</p>
          </div>
          <div class="summary-card">
            <h3>Voter Turnout</h3>
            <p>${summary.turnoutPercentage}%</p>
          </div>
          <div class="summary-card">
            <h3>Total Candidates</h3>
            <p>${summary.totalCandidates}</p>
          </div>
        </div>

        <h2>Candidate Results</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Student ID</th>
              <th>Department</th>
              <th>Position</th>
              <th>Votes</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${candidateResults.map((candidate, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${candidate.name}</td>
                <td>${candidate.studentId}</td>
                <td>${candidate.department}</td>
                <td>${candidate.position}</td>
                <td>${candidate.votes}</td>
                <td>${candidate.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Vote Details (Audit Trail)</h2>
        <table>
          <thead>
            <tr>
              <th>Vote ID</th>
              <th>Candidate</th>
              <th>Position</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${voteDetails.slice(0, 50).map(vote => `
              <tr>
                <td>${vote.voteId}</td>
                <td>${vote.candidateName}</td>
                <td>${vote.position}</td>
                <td>${new Date(vote.timestamp).toLocaleString()}</td>
              </tr>
            `).join('')}
            ${voteDetails.length > 50 ? `<tr><td colspan="4" style="text-align: center; font-style: italic;">... and ${voteDetails.length - 50} more votes</td></tr>` : ''}
          </tbody>
        </table>

        <div class="footer">
          <p>Report Generated: ${new Date(summary.reportGeneratedAt).toLocaleString()}</p>
          <p>Election Date: ${new Date(summary.electionDate).toLocaleDateString()}</p>
          <p>Wachemo University Online Voting System</p>
        </div>
      </body>
      </html>
    `;
    };

    // Columns for candidate results table
    const candidateColumns = [
        { field: "rank", headerName: "Rank", width: 80 },
        { field: "name", headerName: "Name", width: 200 },
        { field: "studentId", headerName: "Student ID", width: 130 },
        { field: "department", headerName: "Department", width: 180 },
        { field: "position", headerName: "Position", width: 180 },
        { field: "votes", headerName: "Votes", width: 100 },
        { field: "percentage", headerName: "Percentage", width: 120 },
    ];

    // Columns for vote details table
    const voteColumns = [
        { field: "voteId", headerName: "Vote ID", width: 200 },
        { field: "candidateName", headerName: "Candidate", width: 200 },
        { field: "position", headerName: "Position", width: 180 },
        { field: "timestamp", headerName: "Timestamp", width: 200 },
    ];

    if (loading) {
        return (
            <Box m="20px">
                <Header title="VOTING REPORT" subtitle="Loading report data..." />
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box m="20px">
                <Header title="VOTING REPORT" subtitle="Error loading report" />
                <Typography color="error">{error}</Typography>
                <Button variant="contained" onClick={fetchReport} sx={{ mt: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (!reportData) {
        return (
            <Box m="20px">
                <Header title="VOTING REPORT" subtitle="No data available" />
            </Box>
        );
    }

    const { summary, candidateResults, voteDetails, statistics } = reportData;

    // Prepare data for DataGrid
    const candidateRows = candidateResults.map((candidate, index) => ({
        id: candidate.id,
        rank: index + 1,
        name: candidate.name,
        studentId: candidate.studentId,
        department: candidate.department,
        position: candidate.position,
        votes: candidate.votes,
        percentage: `${candidate.percentage}%`,
    }));

    const voteRows = voteDetails.map((vote, index) => ({
        id: index,
        voteId: vote.voteId,
        candidateName: vote.candidateName,
        position: vote.position,
        timestamp: new Date(vote.timestamp).toLocaleString(),
    }));

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="VOTING REPORT" subtitle="Comprehensive Election Results and Statistics" />
                <Button
                    sx={{
                        backgroundColor: colors.blueAccent[700],
                        color: colors.grey[100],
                        fontSize: "14px",
                        fontWeight: "bold",
                        padding: "10px 20px",
                    }}
                    onClick={handleDownloadPDF}
                >
                    <DownloadOutlinedIcon sx={{ mr: "10px" }} />
                    Download PDF Report
                </Button>
            </Box>

            {/* Summary Statistics */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: colors.primary[400] }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" color={colors.grey[100]}>
                                        Total Voters
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {summary.totalVoters}
                                    </Typography>
                                </Box>
                                <PeopleOutlinedIcon sx={{ fontSize: 40, color: colors.greenAccent[600] }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: colors.primary[400] }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" color={colors.grey[100]}>
                                        Votes Cast
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {summary.totalVotesCast}
                                    </Typography>
                                </Box>
                                <HowToVoteOutlinedIcon sx={{ fontSize: 40, color: colors.greenAccent[600] }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: colors.primary[400] }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" color={colors.grey[100]}>
                                        Turnout
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {summary.turnoutPercentage}%
                                    </Typography>
                                </Box>
                                <PercentOutlinedIcon sx={{ fontSize: 40, color: colors.greenAccent[600] }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: colors.primary[400] }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" color={colors.grey[100]}>
                                        Candidates
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {summary.totalCandidates}
                                    </Typography>
                                </Box>
                                <EmojiEventsOutlinedIcon sx={{ fontSize: 40, color: colors.greenAccent[600] }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Candidate Results Table */}
            <Box
                mt="40px"
                height="400px"
                sx={{
                    "& .MuiDataGrid-root": {
                        border: "none",
                    },
                    "& .MuiDataGrid-cell": {
                        borderBottom: "none",
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
                }}
            >
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Candidate Results
                </Typography>
                <DataGrid rows={candidateRows} columns={candidateColumns} />
            </Box>

            {/* Vote Details Table */}
            <Box
                mt="40px"
                height="400px"
                sx={{
                    "& .MuiDataGrid-root": {
                        border: "none",
                    },
                    "& .MuiDataGrid-cell": {
                        borderBottom: "none",
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
                }}
            >
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Vote Details (Audit Trail with Vote IDs)
                </Typography>
                <DataGrid rows={voteRows} columns={voteColumns} />
            </Box>

            {/* Statistics */}
            <Box mt="40px">
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Additional Statistics
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                            <Typography variant="h6" color={colors.grey[100]}>
                                Average Votes per Candidate
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                {statistics.averageVotesPerCandidate}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                            <Typography variant="h6" color={colors.grey[100]}>
                                Highest Votes
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                {statistics.highestVotes}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ backgroundColor: colors.primary[400], p: 2 }}>
                            <Typography variant="h6" color={colors.grey[100]}>
                                Lowest Votes
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                {statistics.lowestVotes}
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Report Info */}
            <Box mt="40px" p="20px" sx={{ backgroundColor: colors.primary[400], borderRadius: "4px" }}>
                <Typography variant="h6" color={colors.grey[100]}>
                    Report Information
                </Typography>
                <Typography variant="body2" color={colors.grey[100]} mt={1}>
                    Report Generated: {new Date(summary.reportGeneratedAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" color={colors.grey[100]}>
                    Election Date: {new Date(summary.electionDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color={colors.grey[100]} mt={2}>
                    This report includes Vote IDs for audit trail purposes. All votes are tracked securely.
                </Typography>
            </Box>
        </Box>
    );
};

export default VotingReport;
