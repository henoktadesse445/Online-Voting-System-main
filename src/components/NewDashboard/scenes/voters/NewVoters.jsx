
import { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import {BASE_URL} from '../../../../helper'


const Team = () => {
    const [theme, colorMode] = useMode();
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const colors = tokens(theme.palette.mode);

    const columns = [
        {
            field: "img",
            headerName: "PHOTO",
            flex: 0.5,
            renderCell: ({ row: { img } }) => {
                const photoUrl = img ? `${BASE_URL}${img}` : null;
                return (
                    <Box
                        width="100%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        {photoUrl ? (
                            <img 
                                src={photoUrl} 
                                alt="voter" 
                                style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%',
                                    objectFit: 'cover' 
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: colors.primary[400],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />
                        )}
                    </Box>
                );
            },
        },
        {
            field: "name",
            headerName: "NAME",
            flex: 1,
            cellClassName: "name-column--cell",
        },
        {
            field: "voterId",
            headerName: "STUDENT ID",
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "email",
            headerName: "EMAIL",
            flex: 1.5,
        },
        {
            field: "college",
            headerName: "COLLEGE",
            flex: 1,
        },
        {
            field: "department",
            headerName: "DEPARTMENT",
            flex: 1,
        },
        {
            field: "voteStatus",
            headerName: "VOTE STATUS",
            flex: 0.8,
            renderCell: ({ row: { voteStatus } }) => {
                return (
                    <Box
                        width="100%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                        borderRadius="4px"
                        backgroundColor={
                            voteStatus ? colors.greenAccent[600] : colors.redAccent[600]
                        }
                    >
                        <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
                            {voteStatus ? "Voted" : "Not Voted"}
                        </Typography>
                    </Box>
                );
            },
        },
    ];
    
    const fetchVoters = () => {
        setLoading(true);
        console.log('Fetching voters from:', `${BASE_URL}/getVoter`);
        axios.get(`${BASE_URL}/getVoter`)
            .then((response) => {
                console.log('Voters response:', response.data);
                if (response.data.success) {
                    const votersData = response.data.voter || [];
                    console.log(`Loaded ${votersData.length} voters:`, votersData.map(v => v.name));
                    setVoters(votersData);
                } else {
                    console.error("Failed to fetch voters:", response.data.message);
                    setVoters([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching voter data:", err);
                alert('Failed to load voters. Please check the console for details.');
                setLoading(false);
            });
    };
    
    useEffect(() => {
        fetchVoters();
    }, [])
    return (<ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="appNew">
                <Sidebar />
                <main className="content">
                    <Topbar />
                    <Box m="0px 20px">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                            <Header title="VOTERS" subtitle="Managing the Voters" />
                            <IconButton 
                                onClick={fetchVoters}
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
                                title="Refresh voters list"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                        <Box
                            m="20px 0 0 0"
                            height="70vh"
                            // width="160vh"
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
                                rows={voters} 
                                columns={columns} 
                                getRowId={(row) => row._id}
                                loading={loading}
                                initialState={{
                                    pagination: {
                                        paginationModel: { pageSize: 10 },
                                    },
                                }}
                                pageSizeOptions={[5, 10, 25, 50]}
                            />
                        </Box>
                    </Box>
                </main>
            </div>
        </ThemeProvider>
    </ColorModeContext.Provider>

    )

};

export default Team;

