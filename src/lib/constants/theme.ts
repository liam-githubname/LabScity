"use client";

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: 'Konkhmer Sleokchher, sans-serif',
  colors: {
    navy: [
      "#EFF4F6", // card background, button text
      "#E7F0F8",
      "#D8E0E8", // page background
      "#CFE1F1",
      "#9CC3E2",
      "#6AA4D3", // tertiary text   (navy.5) e.g. post timestamp
      "#3885C4", // secondary text  (navy.6) e.g. post action buttons
      "#07386A", // primary text    (navy.7) e.g. name in profile
      "#07386A", // primary navy    (navy.8) e.g. button background --- SAME AS .7?
      "#06325E",
    ],
    gray: [
      "#FFFFFF", // white (input backgrounds)
      "#F8F9FA",
      "#EFF4F6", // card background
      "#D8E0E8", // page background
      "#C1C9D1",
      "#9AA2AA",
      "#63809F", // secondary text/placeholder
      "#4A5F7A",
      "#364A5C",
      "#2A3A47",
    ],
  },
  primaryColor: "navy",
});
