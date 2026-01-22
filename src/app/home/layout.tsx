import { Box } from "@mantine/core";
import { Header } from "@/components/layout/header";
import classes from "./layout.module.css";

export default function HomeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Box className={classes.container} bg="gray.2">
			<Header />
			<Box className={classes.grid}>
				<Box className={classes.feed}>
					{children}
				</Box>
				<Box className={classes.rightSidebar}>
					{/* Right sidebar (~35%) - Trending and User profile will go here */}
				</Box>
			</Box>
		</Box>
	);
}
