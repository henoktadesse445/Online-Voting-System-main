import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Button, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DescriptionIcon from "@mui/icons-material/Description";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PendingCandidates = () => {
    const [theme, colorMode] = useMode();
    const [pendingCandidates, setPendingCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const colors = tokens(theme.palette.mode);

    const showSuccessToast = (message) => toast.success(message, {
        className: "toast-message",
    });

    const showErrorToast = (message) => toast.error(message, {
        className: "toast-message",
    });

    const fetchPendingCandidates = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/api/pendingCandidates`);
            if (response.data.success) {
                setPendingCandidates(response.data.candidates);
            }
        } catch (err) {
            console.error("Error fetching pending candidates:", err);
            showErrorToast("Failed to fetch pending candidates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCandidates();
    }, []);

    const handleApprove = async (id, name) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/approveCandidate/${id}`);
            if (response.data.success) {
                showSuccessToast(`Candidate ${name} has been approved!`);
                fetchPendingCandidates(); // Refresh the list
            } else {
                showErrorToast(response.data.message || "Failed to approve candidate");
            }
        } catch (err) {
            console.error("Error approving candidate:", err);
            showErrorToast(err.response?.data?.message || "Failed to approve candidate");
        }
    };

    const handleReject = async (id, name) => {
        if (!window.confirm(`Are you sure you want to reject ${name}'s candidacy?`)) {
            return;
        }
        try {
            const response = await axios.post(`${BASE_URL}/api/rejectCandidate/${id}`);
            if (response.data.success) {
                showSuccessToast(`Candidate ${name} has been rejected.`);
                fetchPendingCandidates(); // Refresh the list
            } else {
                showErrorToast(response.data.message || "Failed to reject candidate");
            }
        } catch (err) {
            console.error("Error rejecting candidate:", err);
            showErrorToast(err.response?.data?.message || "Failed to reject candidate");
        }
    };

    const columns = [
        {
            field: "img",
            headerName: "PHOTO",
            width: 100,
            renderCell: ({ row: { img } }) => {
                return (
                    <Box
                        width="60%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                    >
                        {img ? (
                            <img
                                src={`${BASE_URL}${img}`}
                                alt="Candidate"
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
                            />
                        ) : (
                            <span>No image</span>
                        )}
                    </Box>
                );
            },
        },
        {
            field: "name",
            headerName: "CANDIDATE NAME",
            flex: 1,
            cellClassName: "name-column--cell",
        },
        {
            field: "email",
            headerName: "EMAIL",
            flex: 1,
            cellClassName: "name-column--cell",
        },
        {
            field: "voterId",
            headerName: "STUDENT ID",
            flex: 1,
        },
        {
            field: "department",
            headerName: "DEPARTMENT",
            flex: 1,
        },
        {
            field: "bio",
            headerName: "BIO",
            flex: 1.5,
            cellClassName: "name-column--cell",
        },
        {
            field: "cgpa",
            headerName: "CGPA",
            width: 100,
            type: "number",
        },
        {
            field: "createdAt",
            headerName: "APPLIED DATE",
            flex: 1,
            renderCell: ({ row: { createdAt, _id } }) => {
                let dateToUse = createdAt;

                // If createdAt doesn't exist, extract date from MongoDB _id (which contains creation timestamp)
                if (!dateToUse && _id) {
                    try {
                        // Extract timestamp from MongoDB ObjectId (first 8 characters are timestamp)
                        const timestamp = parseInt(_id.substring(0, 8), 16) * 1000;
                        dateToUse = new Date(timestamp);
                    } catch (error) {
                        console.error('Error extracting date from _id:', error);
                    }
                }

                if (!dateToUse) {
                    return <Typography variant="body2" color={colors.grey[500]}>N/A</Typography>;
                }

                try {
                    const date = new Date(dateToUse);
                    if (isNaN(date.getTime())) {
                        return <Typography variant="body2" color={colors.grey[500]}>Invalid Date</Typography>;
                    }
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (error) {
                    return <Typography variant="body2" color={colors.grey[500]}>N/A</Typography>;
                }
            },
        },
        {
            field: "status",
            headerName: "STATUS",
            width: 120,
            renderCell: () => {
                return (
                    <Chip
                        label="Pending"
                        sx={{
                            backgroundColor: colors.blueAccent[700],
                            color: colors.grey[100],
                        }}
                    />
                );
            },
        },
        {
            field: "documents",
            headerName: "DOCUMENTS",
            flex: 1.2,
            renderCell: ({ row }) => {
                return (
                    <Box display="flex" gap="5px">
                        {row.symbol && (
                            <Button
                                variant="outlined"
                                startIcon={<DescriptionIcon />}
                                size="small"
                                onClick={() => window.open(`${BASE_URL}${row.symbol}`, '_blank')}
                                sx={{
                                    borderColor: colors.blueAccent[600],
                                    color: colors.blueAccent[600],
                                    '&:hover': {
                                        borderColor: colors.blueAccent[700],
                                        backgroundColor: colors.blueAccent[50],
                                    },
                                }}
                            >
                                Proposal
                            </Button>
                        )}
                        {row.authenticatedDocument && (
                            <Button
                                variant="outlined"
                                startIcon={<DescriptionIcon />}
                                size="small"
                                onClick={() => window.open(`${BASE_URL}${row.authenticatedDocument}`, '_blank')}
                                sx={{
                                    borderColor: colors.orangeAccent?.[600] || colors.blueAccent[600],
                                    color: colors.orangeAccent?.[600] || colors.blueAccent[600],
                                    '&:hover': {
                                        borderColor: colors.orangeAccent?.[700] || colors.blueAccent[700],
                                        backgroundColor: colors.orangeAccent?.[50] || colors.blueAccent[50],
                                    },
                                }}
                            >
                                Document
                            </Button>
                        )}
                        {!row.symbol && !row.authenticatedDocument && (
                            <Typography variant="body2" color={colors.grey[500]}>
                                No documents
                            </Typography>
                        )}
                    </Box>
                );
            },
        },
        {
            field: "actions",
            headerName: "ACTIONS",
            flex: 1.5,
            renderCell: ({ row }) => {
                return (
                    <Box display="flex" gap="10px">
                        <Button
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            sx={{
                                backgroundColor: colors.greenAccent[600],
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: colors.greenAccent[700],
                                },
                            }}
                            onClick={() => handleApprove(row._id, row.name)}
                            size="small"
                        >
                            Approve
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CancelIcon />}
                            sx={{
                                backgroundColor: colors.redAccent[600],
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: colors.redAccent[700],
                                },
                            }}
                            onClick={() => handleReject(row._id, row.name)}
                            size="small"
                        >
                            Reject
                        </Button>
                    </Box>
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
                        <ToastContainer />
                        <Box m="0px 20px">
                            <Header
                                title="PENDING CANDIDATE APPLICATIONS"
                                subtitle="Review and approve candidate registrations"
                            />
                            <Box
                                m="20px 0 0 0"
                                height="75vh"
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
                                {pendingCandidates.length === 0 && !loading ? (
                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                        height="100%"
                                        flexDirection="column"
                                    >
                                        <Typography variant="h4" color={colors.grey[300]}>
                                            No pending applications
                                        </Typography>
                                        <Typography variant="h6" color={colors.grey[500]} sx={{ mt: 1 }}>
                                            All candidate applications have been reviewed.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <DataGrid
                                        rows={pendingCandidates}
                                        columns={columns}
                                        getRowId={(row) => row._id}
                                        loading={loading}
                                        disableRowSelectionOnClick
                                    />
                                )}
                            </Box>
                        </Box>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default PendingCandidates;
