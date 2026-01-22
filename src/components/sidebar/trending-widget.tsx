import { Paper, Text, Stack } from "@mantine/core";
import classes from "./trending-widget.module.css";

interface TrendingWidgetProps {
	hashtags?: string[];
}

export function TrendingWidget({ hashtags }: TrendingWidgetProps) {
	// Static placeholder data for now
	const displayHashtags = hashtags || [
		"#QuantumPhysics",
		"#MachineLearning",
		"#ClimateScience",
		"#Biotechnology",
		"#Astrophysics",
	];

	return (
		<Paper
			bg="gray.0"
			p="md"
			radius="lg"
			className={classes.card}
		>
			<Stack gap="md">
				<Text
					c="navy.8"
					fw={600}
					className={classes.trendingTitle}
				>
					Trending
				</Text>
				<Stack gap="xs">
					{displayHashtags.map((hashtag, index) => (
						<Text
							key={index}
							c="navy.8"
							fw={600}
							className={classes.hashtag}
						>
							{hashtag}
						</Text>
					))}
				</Stack>
			</Stack>
		</Paper>
	);
}
