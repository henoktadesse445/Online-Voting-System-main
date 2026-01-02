import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import './New.css'
import { useTheme } from "@mui/material";
import { tokens } from "./theme";
import { Outlet } from "react-router-dom";


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
                <Outlet />
            </main>
        </div>
    )
}

export default New;