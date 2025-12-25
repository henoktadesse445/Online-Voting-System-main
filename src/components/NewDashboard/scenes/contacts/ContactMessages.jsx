import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
    Alert,
    AlertTitle
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import { tokens } from "../../theme";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReplyIcon from '@mui/icons-material/Reply';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const ContactMessages = () => {
    const [theme, colorMode] = useMode();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openReplyDialog, setOpenReplyDialog] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showEmailConfigAlert, setShowEmailConfigAlert] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await axios.get('/contacts');
            if (response.data.success) {
                setContacts(response.data.contacts);
            } else {
                toast.error('Failed to fetch contact messages');
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            toast.error('Error loading contact messages');
        } finally {
            setLoading(false);
        }
    };

    const handleReplyClick = (contact) => {
        setSelectedContact(contact);
        setReplyMessage('');
        setOpenReplyDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenReplyDialog(false);
        setSelectedContact(null);
        setReplyMessage('');
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim()) {
            toast.error('Please enter a reply message');
            return;
        }

        setSending(true);
        try {
            const response = await axios.post(`/contact/reply/${selectedContact._id}`, {
                replyMessage: replyMessage.trim()
            });

            if (response.data.success) {
                toast.success(response.data.message);
                handleCloseDialog();
                fetchContacts(); // Refresh the list
            } else {
                toast.error(response.data.message || 'Failed to send reply');
            }
        } catch (error) {
            console.error('Error sending reply:', error);

            // Check if it's a credentials error
            const errorMessage = error.response?.data?.message || error.message || '';

            if (errorMessage.includes('Missing credentials') || errorMessage.includes('PLAIN')) {
                // Show detailed setup instructions in dialog
                setShowEmailConfigAlert(true);
                toast.error('Email credentials not configured! Please see the setup instructions.', { autoClose: 5000 });
            } else {
                toast.error(errorMessage || 'Error sending reply. Please check your email configuration.');
            }
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (contactId, newStatus) => {
        try {
            const response = await axios.patch(`/contact/status/${contactId}`, {
                status: newStatus
            });

            if (response.data.success) {
                toast.success('Status updated');
                fetchContacts();
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating status');
        }
    };

    const handleDeleteClick = (contact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!contactToDelete) return;

        try {
            const response = await axios.delete(`/contact/${contactToDelete._id}`);

            if (response.data.success) {
                toast.success('Message deleted successfully');
                setDeleteDialogOpen(false);
                setContactToDelete(null);
                fetchContacts(); // Refresh the list
            } else {
                toast.error(response.data.message || 'Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error('Error deleting message');
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setContactToDelete(null);
    };

    const columns = [
        {
            field: "name",
            headerName: "Name",
            flex: 0.8,
            cellClassName: "name-column--cell",
        },
        {
            field: "email",
            headerName: "Email",
            flex: 1,
        },
        {
            field: "message",
            headerName: "Message",
            flex: 1.5,
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.6,
            renderCell: ({ row }) => {
                return (
                    <Chip
                        label={row.status}
                        size="small"
                        color={
                            row.status === "new"
                                ? "success"
                                : row.status === "read"
                                    ? "primary"
                                    : "default"
                        }
                        sx={{
                            backgroundColor:
                                row.status === "new"
                                    ? colors.greenAccent[600]
                                    : row.status === "read"
                                        ? colors.blueAccent[700]
                                        : colors.grey[700],
                            color: colors.grey[100],
                        }}
                    />
                );
            },
        },
        {
            field: "createdAt",
            headerName: "Date",
            flex: 0.8,
            renderCell: ({ row: { createdAt } }) => {
                return new Date(createdAt).toLocaleString();
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => {
                return (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<ReplyIcon />}
                            onClick={() => handleReplyClick(row)}
                            sx={{
                                backgroundColor: colors.blueAccent[700],
                                color: colors.grey[100],
                                "&:hover": {
                                    backgroundColor: colors.blueAccent[800],
                                },
                            }}
                        >
                            Reply
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteClick(row)}
                            sx={{
                                backgroundColor: '#d32f2f',
                                color: colors.grey[100],
                                "&:hover": {
                                    backgroundColor: '#b71c1c',
                                },
                            }}
                        >
                            Delete
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
                        <Box m="20px">
                            <ToastContainer position="top-right" autoClose={3000} />

                            {/* Back Button */}
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
                                <Header
                                    title="CONTACT MESSAGES"
                                    subtitle="View and reply to contact form submissions"
                                />
                            </Box>
                            <Box
                                m="40px 0 0 0"
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
                                <DataGrid
                                    rows={contacts}
                                    columns={columns}
                                    loading={loading}
                                    getRowId={(row) => row._id}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { pageSize: 10 },
                                        },
                                    }}
                                    pageSizeOptions={[10, 25, 50]}
                                />
                            </Box>

                            {/* Delete Confirmation Dialog */}
                            <Dialog
                                open={deleteDialogOpen}
                                onClose={handleDeleteCancel}
                                maxWidth="sm"
                                fullWidth
                                PaperProps={{
                                    style: {
                                        backgroundColor: colors.primary[400],
                                        color: colors.grey[100],
                                    },
                                }}
                            >
                                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DeleteIcon sx={{ color: '#d32f2f' }} />
                                    <Typography variant="h4">Delete Contact Message?</Typography>
                                </DialogTitle>
                                <DialogContent>
                                    <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#fff3cd', color: '#856404' }}>
                                        <AlertTitle sx={{ color: '#856404', fontWeight: 'bold' }}>Warning</AlertTitle>
                                        This action cannot be undone. The message will be permanently deleted.
                                    </Alert>

                                    {contactToDelete && (
                                        <Box sx={{ backgroundColor: colors.primary[500], p: 2, borderRadius: 1, mt: 2 }}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong style={{ color: colors.greenAccent[400] }}>From:</strong> {contactToDelete.name} ({contactToDelete.email})
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong style={{ color: colors.greenAccent[400] }}>Date:</strong> {new Date(contactToDelete.createdAt).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong style={{ color: colors.greenAccent[400] }}>Message:</strong> {contactToDelete.message}
                                            </Typography>
                                        </Box>
                                    )}
                                </DialogContent>
                                <DialogActions sx={{ p: 2 }}>
                                    <Button
                                        onClick={handleDeleteCancel}
                                        variant="outlined"
                                        sx={{
                                            color: colors.grey[100],
                                            borderColor: colors.grey[700],
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDeleteConfirm}
                                        variant="contained"
                                        sx={{
                                            backgroundColor: '#d32f2f',
                                            color: '#fff',
                                            "&:hover": {
                                                backgroundColor: '#b71c1c',
                                            },
                                        }}
                                    >
                                        Delete Permanently
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            {/* Email Configuration Alert Dialog */}
                            <Dialog
                                open={showEmailConfigAlert}
                                onClose={() => setShowEmailConfigAlert(false)}
                                maxWidth="sm"
                                fullWidth
                                PaperProps={{
                                    style: {
                                        backgroundColor: colors.primary[400],
                                        color: colors.grey[100],
                                    },
                                }}
                            >
                                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ color: '#ff9800' }} />
                                    <Typography variant="h4">Email Configuration Required</Typography>
                                </DialogTitle>
                                <DialogContent>
                                    <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#fff3cd', color: '#856404' }}>
                                        <AlertTitle sx={{ color: '#856404', fontWeight: 'bold' }}>Missing Email Credentials</AlertTitle>
                                        The email reply feature requires email configuration to send messages.
                                    </Alert>

                                    <Typography variant="h6" sx={{ color: colors.greenAccent[400], mb: 2, fontWeight: 'bold' }}>
                                        📋 Quick Setup Steps:
                                    </Typography>

                                    <Box sx={{
                                        backgroundColor: '#1a1a2e',
                                        p: 3,
                                        borderRadius: 2,
                                        mb: 2,
                                        border: `2px solid ${colors.blueAccent[500]}`
                                    }}>
                                        <Typography
                                            variant="body1"
                                            component="div"
                                            sx={{
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                color: '#ffffff',
                                                lineHeight: 1.8
                                            }}
                                        >
                                            <strong style={{ color: colors.greenAccent[400] }}>1. Open file:</strong> server/.env
                                            <br /><br />
                                            <strong style={{ color: colors.greenAccent[400] }}>2. Add these lines:</strong>
                                            <br />
                                            <span style={{ color: '#4fc3f7' }}>   EMAIL_SERVICE</span>=gmail
                                            <br />
                                            <span style={{ color: '#4fc3f7' }}>   EMAIL_USER</span>=your-email@gmail.com
                                            <br />
                                            <span style={{ color: '#4fc3f7' }}>   EMAIL_PASSWORD</span>=your-app-password
                                            <br /><br />
                                            <strong style={{ color: colors.greenAccent[400] }}>3. Get Gmail App Password:</strong>
                                            <br />
                                            • Go to: <span style={{ color: '#ffd700' }}>myaccount.google.com/apppasswords</span>
                                            <br />
                                            • Enable 2-Step Verification
                                            <br />
                                            • Create App Password for "Mail"
                                            <br />
                                            • Copy the 16-character password
                                            <br /><br />
                                            <strong style={{ color: colors.greenAccent[400] }}>4. Restart backend server:</strong>
                                            <br />
                                            <span style={{ color: '#ff6b6b' }}>   cd server</span>
                                            <br />
                                            <span style={{ color: '#ff6b6b' }}>   npm start</span>
                                        </Typography>
                                    </Box>

                                    <Alert severity="info" sx={{ backgroundColor: '#d1ecf1', color: '#0c5460' }}>
                                        <AlertTitle sx={{ color: '#0c5460', fontWeight: 'bold' }}>Need Help?</AlertTitle>
                                        See <strong>EMAIL_REPLY_SETUP_GUIDE.md</strong> for detailed instructions.
                                    </Alert>
                                </DialogContent>
                                <DialogActions sx={{ p: 2 }}>
                                    <Button
                                        onClick={() => setShowEmailConfigAlert(false)}
                                        variant="contained"
                                        sx={{
                                            backgroundColor: colors.blueAccent[700],
                                            "&:hover": {
                                                backgroundColor: colors.blueAccent[800],
                                            },
                                        }}
                                    >
                                        Got It
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            {/* Reply Dialog */}
                            <Dialog
                                open={openReplyDialog}
                                onClose={handleCloseDialog}
                                maxWidth="md"
                                fullWidth
                                PaperProps={{
                                    style: {
                                        backgroundColor: colors.primary[400],
                                        color: colors.grey[100],
                                    },
                                }}
                            >
                                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h4">Reply to {selectedContact?.name}</Typography>
                                    <IconButton onClick={handleCloseDialog}>
                                        <CloseIcon />
                                    </IconButton>
                                </DialogTitle>
                                <DialogContent dividers>
                                    {selectedContact && (
                                        <>
                                            <Box mb={3}>
                                                <Typography variant="h6" color={colors.greenAccent[400]}>
                                                    User Email:
                                                </Typography>
                                                <Typography>{selectedContact.email}</Typography>
                                            </Box>

                                            <Box mb={3}>
                                                <Typography variant="h6" color={colors.greenAccent[400]}>
                                                    Original Message:
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        backgroundColor: colors.primary[500],
                                                        p: 2,
                                                        borderRadius: 1,
                                                        borderLeft: `4px solid ${colors.blueAccent[500]}`,
                                                        mt: 1,
                                                    }}
                                                >
                                                    <Typography>{selectedContact.message}</Typography>
                                                </Box>
                                            </Box>

                                            <Box>
                                                <Typography variant="h6" color={colors.greenAccent[400]} mb={1}>
                                                    Your Reply:
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={6}
                                                    variant="outlined"
                                                    placeholder="Type your reply here..."
                                                    value={replyMessage}
                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            color: colors.grey[100],
                                                            '& fieldset': {
                                                                borderColor: colors.grey[700],
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: colors.blueAccent[500],
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: colors.blueAccent[500],
                                                            },
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        </>
                                    )}
                                </DialogContent>
                                <DialogActions sx={{ p: 2 }}>
                                    <Button
                                        onClick={handleCloseDialog}
                                        variant="outlined"
                                        sx={{
                                            color: colors.grey[100],
                                            borderColor: colors.grey[700],
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSendReply}
                                        variant="contained"
                                        disabled={sending || !replyMessage.trim()}
                                        sx={{
                                            backgroundColor: colors.greenAccent[600],
                                            color: colors.grey[100],
                                            "&:hover": {
                                                backgroundColor: colors.greenAccent[700],
                                            },
                                        }}
                                    >
                                        {sending ? 'Sending...' : 'Send Reply'}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Box>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default ContactMessages;

