import { Box, Button, Typography, useTheme, Card, CardContent, Alert } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../newComponents/Header";
import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../../helper";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const OTPDistribution = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleDistributeOTPs = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to send OTPs to all registered users? This will send emails to all voters and candidates."
        );

        if (!confirmed) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(`${BASE_URL}/api/admin/distributeOTPs`);

            if (response.data.success) {
                setResult(response.data.results);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            console.error("Error distributing OTPs:", err);
            setError(err.response?.data?.message || "Failed to distribute OTPs");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box m="20px">
            <Header
                title="OTP DISTRIBUTION"
                subtitle="Send login credentials to all users before election"
            />

            <Box mt="20px">
                <Card sx={{ backgroundColor: colors.primary[400], p: 3 }}>
                    <CardContent>
                        <Typography variant="h4" gutterBottom>
                            Pre-Election OTP Distribution
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 3, color: colors.grey[100] }}>
                            This function will automatically generate and send One-Time Passwords (OTPs) to all registered users.
                            Each user will receive an email containing their username (Student ID) and OTP for first-time login.
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>Important:</strong> OTPs will be valid for 7 days. Users must complete their first login
                                before the election using these credentials. Upon OTP verification, users will be required to set
                                a secure password. A unique Vote ID will be generated after password setup.
                            </Typography>
                        </Alert>

                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<SendIcon />}
                                onClick={handleDistributeOTPs}
                                disabled={loading}
                                sx={{
                                    backgroundColor: colors.blueAccent[700],
                                    color: colors.grey[100],
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    padding: "10px 20px",
                                }}
                            >
                                {loading ? "Sending OTPs..." : "Distribute OTPs to All Users"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Results Display */}
                {result && (
                    <Card sx={{ backgroundColor: colors.primary[400], p: 3, mt: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <CheckCircleOutlineIcon sx={{ color: colors.greenAccent[500], fontSize: 40, mr: 2 }} />
                                <Typography variant="h4" color={colors.greenAccent[500]}>
                                    Distribution Complete
                                </Typography>
                            </Box>

                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
                                <Card sx={{ backgroundColor: colors.primary[500], p: 2 }}>
                                    <Typography variant="h6" color={colors.grey[100]}>Total Users</Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {result.total}
                                    </Typography>
                                </Card>

                                <Card sx={{ backgroundColor: colors.primary[500], p: 2 }}>
                                    <Typography variant="h6" color={colors.grey[100]}>Successfully Sent</Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {result.sent}
                                    </Typography>
                                </Card>

                                <Card sx={{ backgroundColor: colors.primary[500], p: 2 }}>
                                    <Typography variant="h6" color={colors.grey[100]}>Failed</Typography>
                                    <Typography variant="h3" fontWeight="bold" color={result.failed > 0 ? colors.redAccent[500] : colors.greenAccent[500]}>
                                        {result.failed}
                                    </Typography>
                                </Card>
                            </Box>

                            {result.errors && result.errors.length > 0 && (
                                <Box mt={2}>
                                    <Typography variant="h6" color={colors.redAccent[500]} gutterBottom>
                                        Errors:
                                    </Typography>
                                    {result.errors.map((error, index) => (
                                        <Alert severity="error" key={index} sx={{ mb: 1 }}>
                                            <strong>{error.user}:</strong> {error.error}
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {error && (
                    <Card sx={{ backgroundColor: colors.primary[400], p: 3, mt: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <ErrorOutlineIcon sx={{ color: colors.redAccent[500], fontSize: 40, mr: 2 }} />
                                <Box>
                                    <Typography variant="h4" color={colors.redAccent[500]}>
                                        Distribution Failed
                                    </Typography>
                                    <Typography variant="body1" color={colors.grey[100]} mt={1}>
                                        {error}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card sx={{ backgroundColor: colors.primary[400], p: 3, mt: 3 }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            📋 How It Works
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2, color: colors.grey[100] }}>
                            <strong>1. Distribution:</strong> Click the button above to send OTPs to all registered users.
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2, color: colors.grey[100] }}>
                            <strong>2. Email Delivery:</strong> Each user receives an email with their Student ID and OTP.
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2, color: colors.grey[100] }}>
                            <strong>3. First Login:</strong> Users log in with their Student ID and OTP in the single credential field.
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2, color: colors.grey[100] }}>
                            <strong>4. Password Setup:</strong> After OTP verification, users must set a secure password (mandatory).
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 2, color: colors.grey[100] }}>
                            <strong>5. Vote ID Generation:</strong> Upon successful password setup, a unique Vote ID is automatically generated.
                        </Typography>

                        <Typography variant="body2" sx={{ color: colors.grey[100] }}>
                            <strong>6. Subsequent Logins:</strong> After first login, users simply enter their password in the same credential field (no OTP needed).
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default OTPDistribution;
