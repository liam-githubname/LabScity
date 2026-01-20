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
      "#6AA4D3",
      "#3885C4",
      "#073869", // primary Navy (button background)
      "#07386A", // primary text
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