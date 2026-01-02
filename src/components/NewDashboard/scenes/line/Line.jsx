import { Box, useTheme } from "@mui/material";
import LineChart from "../../newComponents/LineChart";
import Header from "../../newComponents/Header";

const Line = () => {
    return (
        <Box m="20px">
            <Header title="Line Chart" subtitle="Simple Line Chart" />
            <Box height="75vh">
                <LineChart />
            </Box>
        </Box>
    )
};

export default Line;
