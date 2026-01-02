import { useEffect, useState } from 'react';
import { Box, Typography, TextField, MenuItem, IconButton, Paper, Stack, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert, useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Header from '../../newComponents/Header';
import { DataGrid } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from "@mui/icons-material/Send";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import { Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StudentListInfo = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Upload State
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [file, setFile] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [uploadError, setUploadError] = useState('');

    // OTP Distribution State
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpResult, setOtpResult] = useState(null);
    const [otpError, setOtpError] = useState(null);
    const [openOtpDialog, setOpenOtpDialog] = useState(false);

    const [columns, setColumns] = useState([
        { field: 'studentId', headerName: 'STUDENT ID', flex: 1 },
        { field: 'name', headerName: 'NAME', flex: 1.2 },
        { field: 'email', headerName: 'EMAIL', flex: 1.6 },
        { field: 'department', headerName: 'DEPARTMENT', flex: 1 },
        { field: 'cgpa', headerName: 'CGPA', flex: 0.5, type: 'number' },
        { field: 'status', headerName: 'STATUS', flex: 0.8 },
        { field: 'createdAt', headerName: 'CREATED', flex: 1, valueGetter: (value, row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
    ]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (status) q.append('status', status);
            if (search) q.append('search', search);
            const url = `${BASE_URL}/api/studentList${q.toString() ? `?${q.toString()}` : ''}`;
            const resp = await axios.get(url);

            if (resp.data && resp.data.success) {
                const studentData = resp.data.students || [];
                setRows(studentData);
                setTotal(resp.data.totalCount || 0);

                // --- 📊 Dynamic Column Generation ---
                if (studentData.length > 0) {
                    // Get all unique keys from the first record (or iterate a few to be safe)
                    // We'll prioritize standard columns, then add the rest
                    const firstRow = studentData[0];
                    const keys = Object.keys(firstRow).filter(k =>
                        !['_id', '__v', 'updatedAt', 'status', 'createdAt', 'studentId', 'name', 'email', 'department', 'cgpa'].includes(k)
                    );

                    const dynamicCols = keys.map(key => ({
                        field: key,
                        headerName: key.toUpperCase(),
                        flex: 1,
                        // Simple assumption: if it looks like a number, treat as number
                        type: typeof firstRow[key] === 'number' ? 'number' : 'string'
                    }));

                    // Reconstruct columns: Standard first -> Dynamic -> Status/Date last
                    const newColumns = [
                        { field: 'studentId', headerName: 'STUDENT ID', flex: 1 },
                        { field: 'name', headerName: 'NAME', flex: 1.2 },
                        { field: 'email', headerName: 'EMAIL', flex: 1.6 },
                        // Insert dynamic columns here
                        ...dynamicCols,
                        { field: 'status', headerName: 'STATUS', flex: 0.8 },
                        { field: 'createdAt', headerName: 'CREATED', flex: 1, valueGetter: (value, row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
                    ];
                    setColumns(newColumns);
                }
            } else {
                setRows([]);
                setTotal(0);
            }
        } catch (err) {
            console.error('Error fetching student list:', err);
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onApplyFilters = () => fetchStudents();

    const handleDeleteAll = async () => {
        setDeleteLoading(true);
        try {
            const resp = await axios.delete(`${BASE_URL}/api/studentList`);
            if (resp.data && resp.data.success) {
                alert(`Successfully deleted ${resp.data.deletedCount} students from the list.`);
                setOpenDeleteDialog(false);
                fetchStudents(); // Refresh the list
            } else {
                alert('Failed to delete students: ' + (resp.data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error deleting all students:', err);
            alert('Error deleting students: ' + (err.response?.data?.message || err.message));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCloseDialog = () => {
        if (!deleteLoading) {
            setOpenDeleteDialog(false);
        }
    };

    // Upload Handlers
    const handleFileChange = (e) => {
        const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setFile(f);
        setUploadResult(null);
        setUploadError('');
    };

    const handleUpload = async () => {
        try {
            if (!file) {
                setUploadError('Please select a CSV file to upload');
                return;
            }
            setUploadLoading(true);
            setUploadError('');
            setUploadResult(null);
            const formData = new FormData();
            formData.append('file', file);
            const resp = await axios.post(`${BASE_URL}/api/studentList/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadResult(resp.data);
            if (resp.data && resp.data.success) {
                fetchStudents(); // Refresh list on success
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Upload failed';
            setUploadError(msg);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleCloseUploadDialog = () => {
        if (!uploadLoading) {
            setOpenUploadDialog(false);
            setUploadResult(null);
            setUploadError('');
        }
    };

    const handleDistributeOTPs = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to send OTPs to all registered users? This will send emails to all voters and candidates."
        );

        if (!confirmed) return;

        setOtpLoading(true);
        setOtpError(null);
        setOtpResult(null);
        setOpenOtpDialog(true); // Open dialog to show progress/results

        try {
            const response = await axios.post(`${BASE_URL}/api/admin/distributeOTPs`);

            if (response.data.success) {
                setOtpResult(response.data.results);
                toast.success(`✅ OTPs distributed successfully! Sent to ${response.data.results.sent} students.`, {
                    position: "top-right",
                    autoClose: 5000,
                });
            } else {
                setOtpError(response.data.message);
                toast.error(response.data.message || "Failed to distribute OTPs");
            }
        } catch (err) {
            console.error("Error distributing OTPs:", err);
            const errorMsg = err.response?.data?.message || "Failed to distribute OTPs";
            setOtpError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleCloseOtpDialog = () => {
        if (!otpLoading) {
            setOpenOtpDialog(false);
            setOtpResult(null);
            setOtpError(null);
        }
    };

    return (
        <>
            <Box m="20px">
                <Header title="Student List" subtitle="Information about uploaded/authorized students" />
                <Paper elevation={3} sx={{ p: 2, backgroundColor: colors.primary[400] }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <TextField
                            label="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ID, name or email"
                            size="small"
                        />
                        <TextField
                            select
                            label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            size="small"
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </TextField>
                        <IconButton onClick={onApplyFilters} title="Refresh" disabled={loading}
                            sx={{
                                backgroundColor: colors.blueAccent[700],
                                color: colors.grey[100],
                                '&:hover': { backgroundColor: colors.blueAccent[600] },
                                '&:disabled': { backgroundColor: colors.grey[800], color: colors.grey[600] }
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => setOpenUploadDialog(true)}
                            disabled={loading}
                            sx={{ ml: 1 }}
                        >
                            Upload CSV
                        </Button>
                        <Button
                            variant="contained"
                            sx={{
                                ml: 1,
                                backgroundColor: colors.greenAccent[600],
                                '&:hover': { backgroundColor: colors.greenAccent[700] }
                            }}
                            startIcon={<SendIcon />}
                            onClick={handleDistributeOTPs}
                            disabled={loading || otpLoading}
                        >
                            Distribute OTPs
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setOpenDeleteDialog(true)}
                            disabled={loading || total === 0}
                            sx={{ ml: 1 }}
                        >
                            Delete All
                        </Button>
                        <Typography sx={{ ml: 'auto' }} color={colors.grey[100]}>
                            Total: {total}
                        </Typography>
                    </Stack>
                </Paper>

                <Box
                    m="20px 0 0 0"
                    height="70vh"
                    sx={{
                        '& .MuiDataGrid-root': { border: 'none' },
                        '& .MuiDataGrid-cell': { borderBottom: 'none' },
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: colors.blueAccent[700], borderBottom: 'none' },
                        '& .MuiDataGrid-virtualScroller': { backgroundColor: colors.primary[400] },
                        '& .MuiDataGrid-footerContainer': { borderTop: 'none', backgroundColor: colors.blueAccent[700] },
                    }}
                >
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        getRowId={(row) => row._id}
                        loading={loading}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        pageSizeOptions={[5, 10, 25, 50]}
                    />
                    {!loading && rows.length === 0 && (
                        <Paper elevation={0} sx={{ p: 3, mt: 2, backgroundColor: colors.primary[500] }}>
                            <Typography color={colors.grey[100]}>
                                No students found. Use <strong>Upload Student List</strong> to import CSV.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Box>
            <ToastContainer />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDialog}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ color: colors.grey[100], backgroundColor: colors.primary[400] }}>
                    Delete All Students?
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: colors.primary[400] }}>
                    <DialogContentText id="delete-dialog-description" sx={{ color: colors.grey[100] }}>
                        Are you sure you want to delete all {total} students from the list? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ backgroundColor: colors.primary[400] }}>
                    <Button onClick={handleCloseDialog} disabled={deleteLoading} sx={{ color: colors.grey[100] }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAll} color="error" variant="contained" disabled={deleteLoading} autoFocus>
                        {deleteLoading ? 'Deleting...' : 'Delete All'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog
                open={openUploadDialog}
                onClose={handleCloseUploadDialog}
                aria-labelledby="upload-dialog-title"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="upload-dialog-title" sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
                    Upload Student List (CSV)
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: colors.primary[400] }}>
                    <Box mt={2}>
                        <Typography color={colors.grey[100]} mb={2}>
                            Select a file (CSV or Excel) to upload.
                            <br />
                            System will auto-detect columns.
                            <br />
                            <strong>Required:</strong> Student ID
                            <br />
                            <strong>Recommended:</strong> Name, Email, Department, CGPA
                            <br />
                            <em>(You can include any other columns)</em>
                        </Typography>

                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                            <input
                                type="file"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ color: colors.grey[100] }}
                                disabled={uploadLoading}
                            />
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleUpload}
                                disabled={uploadLoading || !file}
                                startIcon={<CloudUploadIcon />}
                            >
                                {uploadLoading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </Box>

                        {uploadError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>
                        )}

                        {uploadResult && uploadResult.success && (
                            <Box>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Upload completed! {uploadResult.imported} imported, {uploadResult.skipped} skipped.
                                </Alert>

                                {Array.isArray(uploadResult.errors) && uploadResult.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography color="error" variant="h6">Errors ({uploadResult.errors.length})</Typography>
                                        <Paper sx={{ p: 2, mt: 1, maxHeight: 200, overflow: 'auto', backgroundColor: colors.primary[500] }}>
                                            {uploadResult.errors.slice(0, 50).map((e, idx) => (
                                                <Typography key={idx} color={colors.grey[100]} variant="body2" sx={{ mb: 0.5 }}>
                                                    • {e.studentId || 'Row ' + e.row}: {e.error}
                                                </Typography>
                                            ))}
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ backgroundColor: colors.primary[400] }}>
                    <Button onClick={handleCloseUploadDialog} sx={{ color: colors.grey[100] }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* OTP Distribution Results Dialog */}
            <Dialog
                open={openOtpDialog || otpLoading} // Keep open while loading
                onClose={handleCloseOtpDialog}
                aria-labelledby="otp-dialog-title"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="otp-dialog-title" sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
                    OTP Distribution
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: colors.primary[400] }}>
                    {otpLoading ? (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={5}>
                            <CircularProgress size={60} color="secondary" />
                            <Typography variant="h6" color={colors.grey[100]} mt={2}>
                                Sending OTPs to all users... This may take a moment.
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            {otpResult && (
                                <Box>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <CheckCircleOutlineIcon sx={{ color: colors.greenAccent[500], fontSize: 40, mr: 2 }} />
                                        <Typography variant="h4" color={colors.greenAccent[500]}>
                                            Distribution Complete
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={3} sx={{ mb: 2 }}>
                                        <Grid item xs={12} sm={4}>
                                            <Card sx={{ backgroundColor: "rgba(134, 141, 251, 0.05)", p: 2, textAlign: "center", border: `1px solid ${colors.primary[500]}` }}>
                                                <Typography variant="subtitle1" color={colors.grey[300]}>Total Users</Typography>
                                                <Typography variant="h3" fontWeight="bold" color={colors.blueAccent[300]}>{otpResult.total}</Typography>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Card sx={{ backgroundColor: "rgba(76, 206, 172, 0.05)", p: 2, textAlign: "center", border: `1px solid ${colors.primary[500]}` }}>
                                                <Typography variant="subtitle1" color={colors.grey[300]}>Sent</Typography>
                                                <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>{otpResult.sent}</Typography>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Card sx={{ backgroundColor: otpResult.failed > 0 ? "rgba(219, 79, 74, 0.05)" : "rgba(76, 206, 172, 0.05)", p: 2, textAlign: "center", border: `1px solid ${colors.primary[500]}` }}>
                                                <Typography variant="subtitle1" color={colors.grey[300]}>Failed</Typography>
                                                <Typography variant="h3" fontWeight="bold" color={otpResult.failed > 0 ? colors.redAccent[500] : colors.greenAccent[500]}>{otpResult.failed}</Typography>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    {otpResult.errors && otpResult.errors.length > 0 && (
                                        <Box mt={2}>
                                            <Typography variant="h6" color={colors.redAccent[500]} gutterBottom>Errors:</Typography>
                                            <Paper sx={{ p: 2, maxHeight: 150, overflow: 'auto', backgroundColor: colors.primary[500] }}>
                                                {otpResult.errors.map((error, index) => (
                                                    <Typography key={index} variant="body2" color={colors.grey[200]} sx={{ mb: 0.5 }}>
                                                        <strong>{error.user}:</strong> {error.error}
                                                    </Typography>
                                                ))}
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {otpError && (
                                <Box display="flex" alignItems="center" p={2}>
                                    <ErrorOutlineIcon sx={{ color: colors.redAccent[500], fontSize: 40, mr: 2 }} />
                                    <Box>
                                        <Typography variant="h5" color={colors.redAccent[500]}>Distribution Failed</Typography>
                                        <Typography variant="body1" color={colors.grey[100]}>{otpError}</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ backgroundColor: colors.primary[400] }}>
                    <Button onClick={handleCloseOtpDialog} sx={{ color: colors.grey[100] }} disabled={otpLoading}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default StudentListInfo;
