import { Box } from "@mui/material";
import Header from "../../newComponents/Header";
import VoterbyAge from "../../newComponents/VoterbyAge";
import VoterbyState from "../../newComponents/VoterbyState";

const Pie = () => {
    return (
        <Box display="grid" gridTemplateColumns="1fr 1fr">
            <Box m="20px">
                <Header title="Voters According to Age Group" />
                <Box height="71vh" mt="30px">
                    <VoterbyAge />
                </Box>
            </Box>
            <Box m="20px">
                <Header title="Voters from Different States" />
                <Box height="71vh" mt="30px">
                    <VoterbyState />
                </Box>
            </Box>
        </Box>
    )
};

export default Pie;
