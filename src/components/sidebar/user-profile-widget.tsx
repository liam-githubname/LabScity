import { Paper, Avatar, Text, Group } from "@mantine/core";
import { User } from "@/lib/types/feed";
import classes from "./user-profile-widget.module.css";

interface UserProfileWidgetProps {
	user?: User;
}

export function UserProfileWidget({ user }: UserProfileWidgetProps) {
	// Static placeholder data for now
	const displayUser: User = user || {
		id: "1",
		first_name: "John",
		last_name: "Doe",
		research_interests: ["Physics", "Quantum Computing"],
		avatar_url: null,
	};

	return (
		<Paper
			bg="gray.0"
			p="md"
			radius="lg"
			className={classes.card}
		>
			<Group gap="sm" align="center">
				<Avatar
					size={41}
					radius="xl"
					color="navy.7"
					src={displayUser.avatar_url || undefined}
				>
					{displayUser.first_name[0]}
					{displayUser.last_name[0]}
				</Avatar>
				<Text
					c="navy.8"
					fw={600}
					className={classes.userName}
				>
					{displayUser.first_name} {displayUser.last_name}
				</Text>
			</Group>
		</Paper>
	);
}
