"use client";

// TODO: hyperlinks to report and reportee urls

import Link from "next/link";
import {
  type ModerationReportItem,
  dismissReportAction,
  deleteReportedPostAction,
  banUserAction,
} from "@/lib/actions/moderation";
import { Button, Card, Stack, Text, Title, Image, Group, Divider, Flex, Badge } from "@mantine/core";
import { IconFlagFilled, IconReport, IconSpeakerphone, IconTrash, IconX } from "@tabler/icons-react";

interface LSModerationReportCardProps {
  report: ModerationReportItem;
  resolved?: boolean;
}

export function LSModerationReportCard({ report, resolved = false }: LSModerationReportCardProps) {
  const isCommentReport = Boolean(report.commentId);
  const displayedText = isCommentReport ? report.commentText : report.postText;

  const handleDismiss = async () => {
    const formData = new FormData();
    formData.append("reportId", String(report.reportId));
    await dismissReportAction(formData);
  };

  const handleDeletePost = async () => {
    const formData = new FormData();
    formData.append("reportId", String(report.reportId));
    formData.append("postId", String(report.postId));
    if (report.commentId) {
      formData.append("commentId", String(report.commentId));
    }
    await deleteReportedPostAction(formData);
  };

  const handleBanUser = async () => {
    const formData = new FormData();
    if (report.reportedUserId) {
      formData.append("reportedUserId", report.reportedUserId);
    }
    formData.append("reportId", String(report.reportId));
    await banUserAction(formData);
  };

  return (
    <>
      <style>{`
        .hover-underline:hover {
          text-decoration: underline;
        }
      `}</style>
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
            <Text style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{report.type}</Text>
          </Badge>
        }
        {resolved && report.status &&
          <Badge tt="capitalize" size="lg" color="gray">
            <Text style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{report.status}</Text>
          </Badge>
        }
      </Flex>

      { /* reporter -> reportee */}
      <Flex direction="row" gap={8} c="gray.6">
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

        <Stack gap={12}>
          <Link href={`/posts/${report.postId}`} style={{ textDecoration: "none" }}>
            <Text style={{ cursor: "pointer" }}>
              <Text span c="red" fw="bold">{report.reportedUserName}{": "}</Text>
              <Text
                span c={"gray.7"}
              >
                {`"${displayedText ?? (isCommentReport ? "(no comment text)" : "(no post text)")}"`}
              </Text>
            </Text>
          </Link>

          {/* post media */}
          {report.postMediaUrl && !isCommentReport &&
            <Link href={`/posts/${report.postId}`}>
              <Image
                src={report.postMediaUrl}
                radius={"sm"}
                alt="Reported post media"
                w="100%"
                maw={500}
                fit="contain"
                style={{ cursor: "pointer", maxWidth: "100%" }}
              />
            </Link>
          }
        </Stack>

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
    {!resolved && (
      <Flex direction={"row"} gap={2} mt={8}>
        <Button flex={1} leftSection={<IconTrash width={18} />} color={"red"} c="gray.0" p={4} onClick={handleDeletePost}>{isCommentReport ? "Delete Comment" : "Delete Post"}</Button>
        {report.reportedUserId &&
          <Button flex={1} leftSection={<IconX width={18} />} color={"red"} c="gray.0" p={4} onClick={handleBanUser}>Ban User</Button>
        }
        <Button flex={1} variant={"filled"} color={"gray.6"} c="gray.0" p={4} onClick={handleDismiss}>Dismiss</Button>
      </Flex>
    )}
    </Card >
    </>
  );
}
