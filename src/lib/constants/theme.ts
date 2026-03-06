"use client";

import { createTheme } from "@mantine/core";

/** Mantine theme: Konkhmer Sleokchher font, navy and gray color palettes, primary color "navy". */
export const theme = createTheme({
  // NOTE: the font used by this should be imported somewhere; inter is pulled in the root layout.tsx file
  fontFamily: "Inter, sans-serif", // loaded via next/font in root layout
  colors: {
    navy: [
      "#EFF4F6", // card bg/btn text  (navy.0)
      "#E7F0F8",
      "#D8E0E8", // page background   (navy.2)
      "#CFE1F1",
      "#9CC3E2",
      "#6AA4D3", // tertiary text     (navy.5) e.g. post timestamp
      "#3885C4", // secondary text    (navy.6) e.g. post action buttons
      "#07386A", // primary text/navy (navy.7) e.g. profiles name — darkest shade
      "#07386A", // (unused, mirrors navy.7)
      "#07386A", // (unused, mirrors navy.7)
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
