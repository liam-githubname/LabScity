import { Box, Stack } from "@mantine/core";
import { Header } from "@/components/layout/header";
import { UserProfileWidget } from "@/components/sidebar/user-profile-widget";
import { TrendingWidget } from "@/components/sidebar/trending-widget";
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
					<Stack gap="md">
						<UserProfileWidget />
						<TrendingWidget />
					</Stack>
				</Box>
			</Box>
		</Box>
	);
}
