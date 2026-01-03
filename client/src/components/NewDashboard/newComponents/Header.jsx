import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box mb="30px" sx={{ borderLeft: `6px solid ${colors.greenAccent[500]}`, pl: 3, py: 1, borderRadius: "2px" }}>
      <Typography
        variant="h2"
        color={colors.grey[100]}
        fontWeight="900"
        sx={{ m: "0 0 5px 0", letterSpacing: "1px" }}
      >
        {title}
      </Typography>
      <Typography variant="h5" color={colors.greenAccent[400]} sx={{ fontWeight: 600 }}>
        {subtitle}
      </Typography>
    </Box>
  );
};

export default Header;