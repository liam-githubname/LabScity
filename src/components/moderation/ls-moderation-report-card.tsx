"use client";

// TODO: hyperlinks to report and reportee urls

import {
  type ModerationReportItem,
} from "@/lib/actions/moderation";
import { Button, Card, Stack, Text, Title, Image, Group, Divider, Flex, Badge } from "@mantine/core";
import { IconFlagFilled, IconReport, IconSpeakerphone, IconTrash, IconX } from "@tabler/icons-react";

interface LSModerationReportCardProps {
  report: ModerationReportItem;
}

export function LSModerationReportCard({ report }: LSModerationReportCardProps) {
  const handleDismiss = async () => {
    // TODO: implement
  };

  const handleDeletePost = async () => {
    // TODO: implement
  };

  const handleBanUser = async () => {
    // TODO: implement
  };

  return (
    <Card
      bg="gray.0"
      padding="md"
      radius="md"
      shadow="lg"
      style={{ overflow: "hidden" }}
    >
      <Flex gap="sm" align="center" justify="start">
        <Text>
          <Text span fz={"h2"} fw={"lighter"} c={"gray.6"}>{"#"}</Text>
          <Text span fz={"h2"} fw={"bold"} c={"gray.9"}>{report.reportId}</Text>
        </Text>

        {report.type &&
          <Badge tt="none" size="lg" color="red">
            <Text style={{ whiteSpace: "nowrap" }}>{report.type}</Text>
          </Badge>
        }
      </Flex>

      { /* reporter -> reportee */}
      <Flex direction="row" gap={8} c="gray.6">
        <Text>{report.reporterName}</Text>
        <IconSpeakerphone width={18} />
        <Text fw="bold" c="red">{report.reportedUserName}</Text>
      </Flex>


      <Text span c={"gray.6"}>
        {new Date(report.createdAt).toLocaleString("en-US",
          { dateStyle: "long", timeStyle: "short" }
        )}
      </Text>

      <Stack gap={4} my={6}>

        {/* other info about the report */}

        <Text c={"gray.9"}>
          {/* report type */}

          {/* show comment report in addition to type if received comment id with it */}
          <Text span c={"gray.6"}>{report.commentId ? <span>Comment Report</span> : null}</Text>
        </Text>

        <Divider my={8} />

        <Group gap={12}>
          <Text>
            <Text span c="red" fw="bold">{report.reportedUserName}{": "}</Text>
            <Text
              span c={"gray.7"}
            >
              {`"${report.postText ?? "(no post text)"}"`}
            </Text>
          </Text>

          {/* post media */}
          {report.postMediaUrl &&
            <Image
              src={report.postMediaUrl}
              radius={"sm"}
              alt="Reported post media"
            />
          }
        </Group>

        <Card bg="gray.2" c="gray.7" shadow="none" radius="sm" mt={4}>
          <Text>
            <Text span fw="bold">{report.reporterName}{"'s Context: "}</Text>
            <Text
              span
              c={"gray.6"}
            >
              {`"${report.additionalContext ?? "(none provided"}"`}
            </Text>
          </Text>
        </Card>

      </Stack>

      {/* actions */}
      <Flex direction={"row"} gap={2} mt={8}>
        <Button flex={1} leftSection={<IconTrash width={18} />} color={"red"} p={4} onClick={handleDeletePost}>Delete</Button>
        {report.reportedUserId &&
          <Button flex={1} leftSection={<IconX width={18} />} color={"red"} p={4} onClick={handleBanUser}>Ban User</Button>

        }
        <Button flex={1} variant={"filled"} color={"gray.6"} p={4} onClick={handleDismiss}>Dismiss</Button>
      </Flex>

    </Card >
  );
}
