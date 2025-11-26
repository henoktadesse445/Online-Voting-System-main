import { useState } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode, tokens } from '../../theme';
import Header from '../../newComponents/Header';
import Topbar from '../global/Topbar';
import Sidebar from '../global/Sidebar';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';

const StudentListUpload = () => {
  const [theme, colorMode] = useMode();
  const colors = tokens(theme.palette.mode);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        setError('Please select a CSV file to upload');
        return;
      }
      setLoading(true);
      setError('');
      setResult(null);
      const formData = new FormData();
      formData.append('file', file);
      const resp = await axios.post(`${BASE_URL}/api/studentList/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(resp.data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="appNew">
          <Sidebar />
          <main className="content">
            <Topbar />
            <Box m="20px">
              <Header title="Upload Student List" subtitle="Import authorized students via CSV" />
              <Paper elevation={3} sx={{ p: 3, backgroundColor: colors.primary[400] }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <input type="file" accept=".csv" onChange={handleFileChange} />
                  <Button variant="contained" onClick={handleUpload} disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload'}
                  </Button>
                </Box>
                <Typography sx={{ mt: 2 }} color={colors.grey[100]}>
                  Expected CSV headers: FirstName,LastName,StudentID,Department
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                )}
                {result && result.success && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="success">Upload completed</Alert>
                    <Box sx={{ mt: 1 }}>
                      <Typography color={colors.grey[100]}>Imported: {result.imported}</Typography>
                      <Typography color={colors.grey[100]}>Skipped: {result.skipped}</Typography>
                      {Array.isArray(result.errors) && result.errors.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography color={colors.grey[100]}>Errors: {result.errors.length}</Typography>
                          <Paper sx={{ p: 2, mt: 1, backgroundColor: colors.primary[500] }}>
                            {result.errors.slice(0, 10).map((e, idx) => (
                              <Typography key={idx} color={colors.grey[100]}>
                                Row {e.row}: {e.studentId} - {e.error}
                              </Typography>
                            ))}
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default StudentListUpload;