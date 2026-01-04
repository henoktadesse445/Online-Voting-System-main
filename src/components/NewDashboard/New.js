import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import NewDashBoard from "./scenes/dashboard/NewDashBoard";
import './New.css'
import { useTheme } from "@mui/material";
import { tokens } from "./theme";


/*

*/
function New() {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <div className="appNew" style={{ backgroundColor: colors.primary[500] }}>
            <Sidebar />
            <main className="content">
                <Topbar />
                <NewDashBoard />
            </main>
        </div>
    )
}

export default New;