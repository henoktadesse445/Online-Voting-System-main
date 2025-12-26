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
      p="24px" // Updated to 24px (3 spacing units)
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: "16px",
        boxShadow: theme.palette.mode === "dark"
          ? "0 4px 20px rgba(0, 0, 0, 0.3)"
          : "0 4px 20px rgba(0, 0, 0, 0.08)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.palette.mode === "dark"
            ? "0 8px 32px rgba(0, 0, 0, 0.4)"
            : "0 8px 32px rgba(0, 0, 0, 0.12)",
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{ color: colors.grey[100], mb: "8px" }} // Updated margin
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