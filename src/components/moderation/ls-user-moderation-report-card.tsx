"use client";

import Link from "next/link";
import {
	type UserModerationReportItem,
	dismissUserReportAction,
	banUserFromUserReportAction,
} from "@/lib/actions/moderation";
import { Button, Card, Text, Flex, Badge, Divider } from "@mantine/core";
import { IconSpeakerphone, IconX } from "@tabler/icons-react";

interface LSUserModerationReportCardProps {
	report: UserModerationReportItem;
	resolved?: boolean;
}

export function LSUserModerationReportCard({
	report,
	resolved = false,
}: LSUserModerationReportCardProps) {
	const handleDismiss = async () => {
		const formData = new FormData();
		formData.append("reportId", String(report.reportId));
		await dismissUserReportAction(formData);
	};

	const handleBanUser = async () => {
		const formData = new FormData();
		if (report.reportedUserId) {
			formData.append("reportedUserId", report.reportedUserId);
		}
		formData.append("reportId", String(report.reportId));
		await banUserFromUserReportAction(formData);
	};

	return (
		<>
			<style>{`
        .hover-underline:hover {
          text-decoration: underline;
        }
      `}</style>
			<Card bg="gray.0" padding="md" radius="md" shadow="lg" style={{ overflow: "hidden" }}>
				<Flex gap="sm" align="center" justify="start">
					<Text>
						<Text span fz={"h2"} fw={"lighter"} c={"gray.6"}>{"#"}</Text>
						<Text span fz={"h2"} fw={"bold"} c={"gray.9"}>{report.reportId}</Text>
					</Text>
					{report.type && (
						<Badge tt="none" size="lg" color="red">
							<Text style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{report.type}</Text>
						</Badge>
					)}
					{resolved && report.status && (
						<Badge tt="capitalize" size="lg" color="gray">
							<Text style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{report.status}</Text>
						</Badge>
					)}
				</Flex>

				{/* reporter → reported user */}
				<Flex direction="row" gap={8} c="gray.6" align="center">
					{report.reporterId ? (
						<Link href={`/profile/${report.reporterId}`} style={{ textDecoration: "none" }}>
							<Text c="gray.6" style={{ cursor: "pointer" }} className="hover-underline">
								{report.reporterName}
							</Text>
						</Link>
					) : (
						<Text>{report.reporterName}</Text>
					)}
					<IconSpeakerphone width={18} />
					{report.reportedUserId ? (
						<Link href={`/profile/${report.reportedUserId}`} style={{ textDecoration: "none" }}>
							<Text fw="bold" c="red" style={{ cursor: "pointer" }} className="hover-underline">
								{report.reportedUserName}
							</Text>
						</Link>
					) : (
						<Text fw="bold" c="red">{report.reportedUserName}</Text>
					)}
				</Flex>

				<Text span c={"gray.6"}>
					{new Date(report.createdAt).toLocaleString("en-US", {
						dateStyle: "long",
						timeStyle: "short",
					})}
				</Text>

				<Divider my={8} />

				<Card bg="gray.2" c="gray.7" shadow="none" radius="sm" mt={4}>
					<Text>
						<Text span fw="bold">{report.reporterName}{"'s Context: "}</Text>
						<Text span c={"gray.6"}>
							{`"${report.additionalContext ?? "(none provided)"}"`}
						</Text>
					</Text>
				</Card>

				{!resolved && (
					<Flex direction={"row"} gap={2} mt={8}>
						{report.reportedUserId && (
							<Button
								flex={1}
								leftSection={<IconX width={18} />}
								color={"red"}
								c="gray.0"
								p={4}
								onClick={handleBanUser}
							>
								Ban User
							</Button>
						)}
						<Button
							flex={1}
							variant={"filled"}
							color={"gray.6"}
							c="gray.0"
							p={4}
							onClick={handleDismiss}
						>
							Dismiss
						</Button>
					</Flex>
				)}
			</Card>
		</>
	);
}
