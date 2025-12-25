
import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Avatar, Tooltip, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import { Button } from '@mui/material';


const NewCandidates = () => {
    const [theme, colorMode] = useMode();
    const [candidate, setCandidate] = useState([]);
    const [loading, setLoading] = useState(true);
    const colors = tokens(theme.palette.mode);

    // Fetch candidates
    const fetchCandidates = () => {
        setLoading(true);
        axios.get(`${BASE_URL}/getCandidate?t=${new Date().getTime()}`)
            .then((response) => {
                setCandidate(response.data.candidate || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching data: ", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

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
            cellClassName: "name-column--cell",
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
            field: "bio",
            headerName: "BIO",
            flex: 2,
            minWidth: 250,
            renderCell: ({ row: { bio } }) => {
                const bioText = bio || 'No bio provided';
                const truncatedBio = bioText.length > 100 ? `${bioText.substring(0, 100)}...` : bioText;

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
            field: "party",
            headerName: "DEPARTMENT",
            flex: 1,
            minWidth: 150,
            renderCell: ({ row: { party } }) => (
                <Typography variant="body2" color={colors.grey[100]}>
                    {party || 'N/A'}
                </Typography>
            ),
        },
        {
            field: "age",
            headerName: "AGE",
            flex: 0.5,
            minWidth: 80,
            type: "number",
            headerAlign: "center",
            align: "center",
            renderCell: ({ row: { age } }) => (
                <Typography variant="body2" color={colors.grey[100]}>
                    {age || 'N/A'}
                </Typography>
            ),
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
                        <Box m="0px 20px">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                                <Header title="CANDIDATES INFORMATION" subtitle="Managing the Candidates" />
                                <IconButton
                                    onClick={fetchCandidates}
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
                                    title="Refresh candidates list"
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
                                        fontSize: "14px",
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
                                <DataGrid
                                    rows={candidate}
                                    columns={columns}
                                    getRowId={(row) => row._id}
                                    loading={loading}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { pageSize: 10 },
                                        },
                                    }}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    disableRowSelectionOnClick
                                />
                            </Box>
                        </Box>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default NewCandidates;
