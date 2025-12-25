import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import CountUp from "react-countup";
import ProgressCircle from "./ProgressCircle";

const StatBox = ({ title, subtitle, icon, progress, increase }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      width="100%"
      p="20px"
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: "16px",
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: `0 8px 30px 0 ${colors.primary[500]}`,
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{ color: colors.grey[100], mb: "5px" }}
          >
            <CountUp end={title} duration={3.5} />
          </Typography>
          <Typography variant="h6" sx={{ color: colors.greenAccent[500], fontWeight: 500 }}>
            {subtitle}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: "rgba(134, 141, 251, 0.1)",
            p: "12px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {icon}
        </Box>
      </Box>
    </Box>
  );
};

export default StatBox;