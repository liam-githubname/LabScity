"use client";

import { Box } from "@mantine/core";
import classes from "./header.module.css";

export function Header() {
	return (
		<Box
			component="header"
			bg="gray.0"
			className={classes.header}
		/>
	);
}
