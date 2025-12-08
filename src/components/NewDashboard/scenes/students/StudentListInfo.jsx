import { useEffect, useState } from 'react';
import { Box, Typography, TextField, MenuItem, IconButton, Paper, Stack } from '@mui/material';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode, tokens } from '../../theme';
import Header from '../../newComponents/Header';
import Topbar from '../global/Topbar';
import Sidebar from '../global/Sidebar';
import { DataGrid } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';

const StudentListInfo = () => {
  const [theme, colorMode] = useMode();
  const colors = tokens(theme.palette.mode);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const columns = [
    { field: 'studentId', headerName: 'STUDENT ID', flex: 1 },
    { field: 'name', headerName: 'NAME', flex: 1.2 },
    { field: 'email', headerName: 'EMAIL', flex: 1.6 },
    { field: 'department', headerName: 'DEPARTMENT', flex: 1 },
    { field: 'status', headerName: 'STATUS', flex: 0.8 },
    { field: 'createdAt', headerName: 'CREATED', flex: 1, valueGetter: (value, row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (status) q.append('status', status);
      if (search) q.append('search', search);
      const url = `${BASE_URL}/api/studentList${q.toString() ? `?${q.toString()}` : ''}`;
      const resp = await axios.get(url);
      if (resp.data && resp.data.success) {
        setRows(resp.data.students || []);
        setTotal(resp.data.totalCount || 0);
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

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="appNew">
          <Sidebar />
          <main className="content">
            <Topbar />
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
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default StudentListInfo;
