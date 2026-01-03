import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    useTheme,
    Zoom
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { tokens } from '../NewDashboard/theme';

const ConfirmationModal = ({ open, onClose, onConfirm, title, message, warning }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            TransitionComponent={Zoom}
            PaperProps={{
                sx: {
                    backgroundColor: colors.primary[400],
                    backgroundImage: 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    maxWidth: '500px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <WarningAmberIcon sx={{ color: colors.redAccent[500], fontSize: '2rem' }} />
                <Typography variant="h3" fontWeight="700" color={colors.grey[100]}>
                    {title}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ mt: 1 }}>
                {warning && (
                    <Box
                        sx={{
                            backgroundColor: 'rgba(255, 82, 82, 0.1)',
                            borderLeft: `4px solid ${colors.redAccent[500]}`,
                            p: 2,
                            mb: 2,
                            borderRadius: '4px'
                        }}
                    >
                        <Typography variant="body1" color={colors.redAccent[400]} fontWeight="600">
                            {warning}
                        </Typography>
                    </Box>
                )}
                <Typography variant="h5" color={colors.grey[200]} lineHeigt="1.6">
                    {message}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: colors.grey[100],
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '10px 24px',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    sx={{
                        backgroundColor: colors.redAccent[600],
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '700',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        '&:hover': {
                            backgroundColor: colors.redAccent[700],
                        }
                    }}
                >
                    Confirm Reset
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationModal;
