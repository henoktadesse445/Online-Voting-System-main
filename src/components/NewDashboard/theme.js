import { createContext, useState, useMemo, useEffect } from "react";
import { createTheme } from '@mui/material/styles';

export const tokens = (mode) => ({
    ...(mode === "dark" ? {
        grey: {
            100: "#e0e0e0",
            200: "#c2c2c2",
            300: "#a3a3a3",
            400: "#858585",
            500: "#666666",
            600: "#525252",
            700: "#3d3d3d",
            800: "#292929",
            900: "#141414"
        },
        primary: {
            100: "#d0d1d5",
            200: "#a1a4ab",
            300: "#727681",
            400: "#1F2A40", // Slightly lighter for cards
            500: "#141b2d", // Main side/header
            600: "#101624",
            700: "#0c101b",
            800: "#080b12",
            900: "#040509"
        },
        greenAccent: {
            100: "#dbf5ee",
            200: "#b7ebde",
            300: "#94e2cd",
            400: "#70d8bd",
            500: "#4cceac",
            600: "#3da58a",
            700: "#2e7c67",
            800: "#1e5245",
            900: "#0f2922"
        },
        redAccent: {
            100: "#f8dcdb",
            200: "#f1b9b7",
            300: "#e99592",
            400: "#e2726e",
            500: "#db4f4a",
            600: "#af3f3b",
            700: "#832f2c",
            800: "#58201e",
            900: "#2c100f"
        },
        blueAccent: {
            100: "#e1e2fe",
            200: "#c3c6fd",
            300: "#a4a9fc",
            400: "#868dfb",
            500: "#6870fa",
            600: "#535ac8",
            700: "#3e4396",
            800: "#2a2d64",
            900: "#151632"
        }
    } : {
        grey: {
            100: "#141414",
            200: "#292929",
            300: "#3d3d3d",
            400: "#525252",
            500: "#666666",
            600: "#858585",
            700: "#a3a3a3",
            800: "#c2c2c2",
            900: "#e0e0e0",
        },
        primary: {
            100: "#040509",
            200: "#080b12",
            300: "#0c101b",
            400: "#ffffff", // White for cards (pop against light bg)
            500: "#fcfcfc", // Light Background
            600: "#434957",
            700: "#727681",
            800: "#a1a4ab",
            900: "#d0d1d5",
        },
        greenAccent: {
            100: "#0f2922",
            200: "#1e5245",
            300: "#2e7c67",
            400: "#3da58a",
            500: "#4cceac",
            600: "#70d8bd",
            700: "#94e2cd",
            800: "#b7ebde",
            900: "#dbf5ee",
        },
        redAccent: {
            100: "#2c100f",
            200: "#58201e",
            300: "#832f2c",
            400: "#af3f3b",
            500: "#db4f4a",
            600: "#e2726e",
            700: "#e99592",
            800: "#f1b9b7",
            900: "#f8dcdb",
        },
        blueAccent: {
            100: "#151632",
            200: "#2a2d64",
            300: "#3e4396",
            400: "#535ac8",
            500: "#6870fa",
            600: "#868dfb",
            700: "#a4a9fc",
            800: "#c3c6fd",
            900: "#e1e2fe",
        }
    })
})

// mui theme settings
export const themeSettings = (mode) => {
    const colors = tokens(mode);
    return {
        palette: {
            mode: mode,
            ...(mode === "dark" ? {
                primary: {
                    main: colors.primary[500],
                },
                secondary: {
                    main: colors.greenAccent[500],
                },
                neutral: {
                    dark: colors.grey[700],
                    main: colors.grey[500],
                    light: colors.grey[100],
                },
                background: {
                    default: colors.primary[500],
                    paper: colors.primary[400],
                }
            } : {
                primary: {
                    main: colors.primary[100],
                },
                secondary: {
                    main: colors.greenAccent[500],
                },
                neutral: {
                    dark: colors.grey[700],
                    main: colors.grey[500],
                    light: colors.grey[100],
                },
                background: {
                    default: "#fcfcfc",
                    paper: "#ffffff",
                }
            }),
        },
        typography: {
            fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
            fontSize: 14, // Increased from 12px for better readability
            h1: {
                fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.2,
            },
            h2: {
                fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.3,
            },
            h3: {
                fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.4,
            },
            h4: {
                fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
                fontSize: 20,
                fontWeight: 600,
                lineHeight: 1.5,
            },
            h5: {
                fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.5,
            },
            h6: {
                fontFamily: ["Outfit", "Inter", "sans-serif"].join(","),
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.6,
            },
            body1: {
                fontSize: 14,
                lineHeight: 1.6,
            },
            body2: {
                fontSize: 13,
                lineHeight: 1.6,
            }
        },
        spacing: 8, // 8px base unit
        shape: {
            borderRadius: 12, // Consistent border radius
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        padding: "10px 20px",
                        fontSize: "14px",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        }
                    },
                    contained: {
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }
                }
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: "16px",
                        boxShadow: mode === "dark"
                            ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                            : "0 4px 20px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s ease-in-out",
                    }
                }
            },
            MuiCardContent: {
                styleOverrides: {
                    root: {
                        padding: "24px",
                        "&:last-child": {
                            paddingBottom: "24px",
                        }
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: "12px",
                    },
                    elevation1: {
                        boxShadow: mode === "dark"
                            ? "0 2px 8px rgba(0, 0, 0, 0.2)"
                            : "0 2px 8px rgba(0, 0, 0, 0.06)",
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                        }
                    }
                }
            },
            MuiDataGrid: {
                styleOverrides: {
                    root: {
                        border: "none",
                        borderRadius: "12px",
                    },
                    cell: {
                        borderBottom: `1px solid ${mode === "dark" ? colors.primary[500] : colors.grey[800]}`,
                        fontSize: "14px",
                        padding: "12px 16px",
                    },
                    columnHeaders: {
                        backgroundColor: mode === "dark"
                            ? "rgba(134, 141, 251, 0.1)"
                            : "rgba(134, 141, 251, 0.05)",
                        borderBottom: `2px solid ${mode === "dark" ? colors.primary[500] : colors.grey[700]}`,
                        fontSize: "14px",
                        fontWeight: "bold",
                    },
                    row: {
                        "&:hover": {
                            backgroundColor: mode === "dark"
                                ? "rgba(134, 141, 251, 0.05)"
                                : "rgba(134, 141, 251, 0.03)",
                        }
                    }
                }
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            transform: "scale(1.1)",
                        }
                    }
                }
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: "8px",
                        fontWeight: 500,
                    }
                }
            }
        }
    }
}

// context for color mode
export const ColorModeContext = createContext({
    toggleColorMode: () => {

    }
});

export const useMode = () => {
    const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () =>
                setMode((prev) => (prev === "light" ? "dark" : "light"))
        }),
        []
    );

    useEffect(() => {
        localStorage.setItem("theme", mode);
        if (mode === "light") {
            document.body.classList.add("light-mode");
        } else {
            document.body.classList.remove("light-mode");
        }
    }, [mode]);

    const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

    return [theme, colorMode];
}