import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Button, Chip, Avatar, Tooltip, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../newComponents/Header";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DescriptionIcon from "@mui/icons-material/Description";
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PendingCandidates = () => {
    const theme = useTheme();
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
            const response = await axios.get(`${BASE_URL}/api/pendingCandidates?t=${new Date().getTime()}`);
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
                showSuccessToast(`✅ ${name} has been approved!`);
                fetchPendingCandidates();
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
                showSuccessToast(`❌ ${name} has been rejected.`);
                fetchPendingCandidates();
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
            flex: 0.5,
            minWidth: 80,
            renderCell: ({ row: { img, name } }) => {
                const photoUrl = img ? `${BASE_URL}${img}` : null;
                return (
                    <Box
                        width="100%"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        p="5px"
                    >
                        <Avatar
                            src={photoUrl}
                            alt={name || "Candidate"}
                            sx={{
                                width: 50,
                                height: 50,
                                border: `2px solid ${colors.primary[300]}`,
                                backgroundColor: photoUrl ? 'transparent' : colors.primary[400],
                                color: colors.grey[100],
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}
                        >
                            {!photoUrl && (name ? name.charAt(0).toUpperCase() : '?')}
                        </Avatar>
                    </Box>
                );
            },
        },
        {
            field: "name",
            headerName: "NAME",
            flex: 1,
            minWidth: 150,
            renderCell: ({ row: { name } }) => (
                <Typography
                    variant="body1"
                    fontWeight="600"
                    color={colors.greenAccent[300]}
                >
                    {name || 'N/A'}
                </Typography>
            ),
        },
        {
            field: "email",
            headerName: "EMAIL",
            flex: 1.2,
            minWidth: 180,
            renderCell: ({ row: { email } }) => (
                <Typography variant="body2" color={colors.grey[100]}>
                    {email || 'N/A'}
                </Typography>
            ),
        },
        {
            field: "voterId",
            headerName: "STUDENT ID",
            flex: 0.8,
            minWidth: 120,
            renderCell: ({ row: { voterId } }) => (
                <Typography variant="body2" color={colors.grey[100]}>
                    {voterId || 'N/A'}
                </Typography>
            ),
        },
        {
            field: "department",
            headerName: "DEPARTMENT",
            flex: 1,
            minWidth: 150,
            renderCell: ({ row: { department } }) => (
                <Typography variant="body2" color={colors.grey[100]}>
                    {department || 'N/A'}
                </Typography>
            ),
        },
        {
            field: "position",
            headerName: "POSITION",
            flex: 1,
            minWidth: 150,
            renderCell: ({ row: { position } }) => (
                <Chip
                    label={position || 'Not Assigned'}
                    size="small"
                    sx={{
                        backgroundColor: position ? colors.greenAccent[700] : colors.grey[700],
                        color: colors.grey[100],
                        fontWeight: 'bold',
                    }}
                />
            ),
        },
        {
            field: "bio",
            headerName: "BIO",
            flex: 1.5,
            minWidth: 200,
            renderCell: ({ row: { bio } }) => {
                const bioText = bio || 'No bio provided';
                const truncatedBio = bioText.length > 80 ? `${bioText.substring(0, 80)}...` : bioText;

                return (
                    <Tooltip title={bioText} arrow placement="top">
                        <Typography
                            variant="body2"
                            color={colors.grey[100]}
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                '&:hover': {
                                    color: colors.greenAccent[400]
                                }
                            }}
                        >
                            {truncatedBio}
                        </Typography>
                    </Tooltip>
                );
            },
        },
        {
            field: "cgpa",
            headerName: "CGPA",
            flex: 0.5,
            minWidth: 80,
            type: "number",
            headerAlign: "center",
            align: "center",
            renderCell: ({ row: { cgpa } }) => (
                <Typography variant="body2" color={colors.grey[100]} fontWeight="600">
                    {cgpa || 'N/A'}
                </Typography>
            ),
        },
        {
            field: "createdAt",
            headerName: "APPLIED",
            flex: 0.8,
            minWidth: 120,
            renderCell: ({ row: { createdAt, _id } }) => {
                let dateToUse = createdAt;

                if (!dateToUse && _id) {
                    try {
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
                        return <Typography variant="body2" color={colors.grey[500]}>Invalid</Typography>;
                    }
                    return (
                        <Typography variant="body2" color={colors.grey[100]}>
                            {date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </Typography>
                    );
                } catch (error) {
                    return <Typography variant="body2" color={colors.grey[500]}>N/A</Typography>;
                }
            },
        },
        {
            field: "status",
            headerName: "STATUS",
            flex: 0.6,
            minWidth: 100,
            renderCell: () => {
                return (
                    <Chip
                        label="Pending"
                        size="small"
                        sx={{
                            backgroundColor: colors.blueAccent[700],
                            color: colors.grey[100],
                            fontWeight: 'bold',
                        }}
                    />
                );
            },
        },
        {
            field: "documents",
            headerName: "DOCUMENTS",
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: ({ row }) => {
                return (
                    <Box display="flex" gap={1} flexWrap="wrap">
                        {row.symbol && (
                            <Button
                                variant="outlined"
                                startIcon={<DescriptionIcon />}
                                size="small"
                                onClick={() => window.open(`${BASE_URL}${row.symbol}`, '_blank')}
                                sx={{
                                    borderColor: colors.blueAccent[600],
                                    color: colors.blueAccent[600],
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    '&:hover': {
                                        borderColor: colors.blueAccent[700],
                                        backgroundColor: 'rgba(104, 112, 250, 0.1)',
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
                                    borderColor: colors.greenAccent[600],
                                    color: colors.greenAccent[600],
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    '&:hover': {
                                        borderColor: colors.greenAccent[700],
                                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    },
                                }}
                            >
                                Document
                            </Button>
                        )}
                        {!row.symbol && !row.authenticatedDocument && (
                            <Typography variant="body2" color={colors.grey[500]} fontSize="12px">
                                None
                            </Typography>
                        )}
                    </Box>
                );
            },
        },
        {
            field: "actions",
            headerName: "ACTIONS",
            flex: 1.2,
            minWidth: 180,
            sortable: false,
            renderCell: ({ row }) => {
                return (
                    <Box display="flex" gap={1} width="100%">
                        <Button
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            size="small"
                            onClick={() => handleApprove(row._id, row.name)}
                            sx={{
                                backgroundColor: colors.greenAccent[600],
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                padding: '6px 12px',
                                '&:hover': {
                                    backgroundColor: colors.greenAccent[700],
                                },
                            }}
                        >
                            Approve
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CancelIcon />}
                            size="small"
                            onClick={() => handleReject(row._id, row.name)}
                            sx={{
                                backgroundColor: colors.redAccent[600],
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                padding: '6px 12px',
                                '&:hover': {
                                    backgroundColor: colors.redAccent[700],
                                },
                            }}
                        >
                            Reject
                        </Button>
                    </Box>
                );
            },
        },
    ];

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Box m="0px 20px">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                    <Header
                        title="PENDING CANDIDATE APPLICATIONS"
                        subtitle="Review and approve candidate registrations"
                    />
                    <IconButton
                        onClick={fetchPendingCandidates}
                        disabled={loading}
                        sx={{
                            backgroundColor: colors.blueAccent[700],
                            color: colors.grey[100],
                            '&:hover': {
                                backgroundColor: colors.blueAccent[600],
                            },
                            '&:disabled': {
                                backgroundColor: colors.grey[800],
                                color: colors.grey[600],
                            }
                        }}
                        title="Refresh pending applications"
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>
                <Box
                    m="20px 0 0 0"
                    height="72vh"
                    sx={{
                        "& .MuiDataGrid-root": {
                            border: "none",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        },
                        "& .MuiDataGrid-cell": {
                            borderBottom: `1px solid ${colors.primary[500]}`,
                            display: 'flex',
                            alignItems: 'center',
                        },
                        "& .name-column--cell": {
                            color: colors.greenAccent[300],
                            fontWeight: "600",
                        },
                        "& .MuiDataGrid-columnHeaders": {
                            backgroundColor: colors.blueAccent[700],
                            borderBottom: "none",
                            fontSize: "13px",
                            fontWeight: "bold",
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
                        "& .MuiDataGrid-row:hover": {
                            backgroundColor: "rgba(104, 112, 250, 0.05)",
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
                            sx={{
                                backgroundColor: colors.primary[400],
                                borderRadius: "16px",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            }}
                        >
                            <Typography variant="h3" color={colors.grey[300]} fontWeight="bold">
                                No Pending Applications
                            </Typography>
                            <Typography variant="h6" color={colors.grey[500]} sx={{ mt: 2 }}>
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
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 10 },
                                },
                            }}
                            pageSizeOptions={[5, 10, 25, 50]}
                            rowHeight={70}
                        />
                    )}
                </Box>
            </Box>
        </>
    );
};

export default PendingCandidates;
