"use client";

import { useState } from "react";
import {
  Tabs,
  Stack,
  Text,
  TextInput,
  Badge,
  Group,
  Button,
  Loader,
  Divider,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { ModerationReportItem, UserModerationReportItem } from "@/lib/actions/moderation";
import {
  getResolvedFeedReportsAction,
  getResolvedUserReportsAction,
} from "@/lib/actions/moderation";
import { LSModerationReportCard } from "./ls-moderation-report-card";
import { LSUserModerationReportCard } from "./ls-user-moderation-report-card";

interface LSModerationQueueProps {
  feedReports: ModerationReportItem[];
  userReports: UserModerationReportItem[];
}

const USER_REPORT_TYPES = [
  "Impersonation",
  "Inappropriate Name",
  "Inappropriate Profile Picture",
  "Inappropriate Banner",
  "Harassment/Hate",
  "Spam/Scam",
  "Sexual Content",
  "Other",
];

const FEED_REPORT_TYPES = [
  "Harassment/Hate",
  "Spam/Scam",
  "Violence/Harm",
  "Sexual Content",
  "Misinformation",
  "Impersonation/Stolen Intellectual Property",
  "Other",
];

type FilterableReport = {
  reportId: number;
  reporterName: string | null;
  reportedUserName: string | null;
  type: string | null;
};

interface ResolvedSectionProps<T extends FilterableReport> {
  resolvedReports: T[] | null;
  isLoading: boolean;
  onLoad: () => void;
  searchName: string;
  onSearchName: (v: string) => void;
  committedSearch: string;
  onCommitSearch: () => void;
  selectedTypes: string[];
  onToggleType: (t: string) => void;
  allTypes: string[];
  renderCard: (report: T) => React.ReactNode;
}

function ResolvedSection<T extends FilterableReport>({
  resolvedReports,
  isLoading,
  onLoad,
  searchName,
  onSearchName,
  committedSearch,
  onCommitSearch,
  selectedTypes,
  onToggleType,
  allTypes,
  renderCard,
}: ResolvedSectionProps<T>) {
  const filtered = resolvedReports
    ? resolvedReports.filter((r) => {
      const nameMatch =
        !committedSearch ||
        r.reporterName?.toLowerCase().includes(committedSearch.toLowerCase()) ||
        r.reportedUserName?.toLowerCase().includes(committedSearch.toLowerCase());
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(r.type ?? "");
      return nameMatch && typeMatch;
    })
    : [];

  return (
    <Stack gap="md" mt="xl">
      <Divider
        label={
          <Text fw="bold" c="gray.6">
            Resolved Reports
          </Text>
        }
        labelPosition="left"
      />

      <TextInput
        leftSection={<IconSearch size={16} />}
        placeholder="Search by reporter or reported user name..."
        value={searchName}
        onChange={(e) => onSearchName(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onCommitSearch(); }}
        rightSection={
          <Button size="compact-sm" variant="subtle" color="gray" onClick={onCommitSearch} fz="md">
            Search
          </Button>
        }
        rightSectionWidth={72}
        w="100%"
        maw={560}
        mx={0}
        styles={{ input: { fontSize: "var(--mantine-font-size-md)" } }}
      />

      {allTypes.length > 0 && (
        <Group gap="xs" wrap="wrap">
          {allTypes.map((type) => (
            <Badge
              key={type}
              tt="none"
              size="lg"
              variant="outline"
              color={selectedTypes.includes(type) ? "red" : "gray"}
              style={{ cursor: "pointer" }}
              onClick={() => onToggleType(type)}
            >
              <Text style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{type}</Text>
            </Badge>
          ))}
        </Group>
      )}

      {resolvedReports === null ? (
        <Button variant="subtle" color="gray" size="sm" onClick={onLoad} loading={isLoading} fz="md">
          Load resolved reports
        </Button>
      ) : isLoading ? (
        <Loader size="sm" />
      ) : filtered.length === 0 ? (
        <Text c="gray.5">
          No resolved reports match your search.
        </Text>
      ) : (
        <Stack>{filtered.map((report) => renderCard(report))}</Stack>
      )}
    </Stack>
  );
}

export function LSModerationQueue({ feedReports, userReports }: LSModerationQueueProps) {
  const [activeTab, setActiveTab] = useState<string | null>("feed");

  // Feed resolved state
  const [resolvedFeed, setResolvedFeed] = useState<ModerationReportItem[] | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedSearchName, setFeedSearchName] = useState("");
  const [feedCommittedSearch, setFeedCommittedSearch] = useState("");
  const [feedSelectedTypes, setFeedSelectedTypes] = useState<string[]>([]);

  // User resolved state
  const [resolvedUsers, setResolvedUsers] = useState<UserModerationReportItem[] | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersSearchName, setUsersSearchName] = useState("");
  const [usersCommittedSearch, setUsersCommittedSearch] = useState("");
  const [usersSelectedTypes, setUsersSelectedTypes] = useState<string[]>([]);

  const loadResolvedFeed = async () => {
    setIsLoadingFeed(true);
    const result = await getResolvedFeedReportsAction();
    if (result.success) setResolvedFeed(result.data);
    setIsLoadingFeed(false);
  };

  const loadResolvedUsers = async () => {
    setIsLoadingUsers(true);
    const result = await getResolvedUserReportsAction();
    if (result.success) setResolvedUsers(result.data);
    setIsLoadingUsers(false);
  };

  const toggleFeedType = (type: string) =>
    setFeedSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );

  const toggleUserType = (type: string) =>
    setUsersSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );

  // Merge active + resolved types for filter tags
  const feedTypes = Array.from(
    new Set([
      ...FEED_REPORT_TYPES,
      ...(feedReports.map((r) => r.type).filter(Boolean) as string[]),
      ...(resolvedFeed?.map((r) => r.type).filter(Boolean) as string[] ?? []),
    ]),
  );

  const userTypes = Array.from(
    new Set([
      ...USER_REPORT_TYPES,
      ...(userReports.map((r) => r.type).filter(Boolean) as string[]),
      ...(resolvedUsers?.map((r) => r.type).filter(Boolean) as string[] ?? []),
    ]),
  );

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="feed">
          Feed Reports{feedReports.length > 0 ? ` (${feedReports.length})` : ""}
        </Tabs.Tab>
        <Tabs.Tab value="users">
          User Reports{userReports.length > 0 ? ` (${userReports.length})` : ""}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="feed" pt="md">
        {feedReports.length === 0 ? (
          <Text c="gray.5" fz="sm">No open feed reports.</Text>
        ) : (
          <Stack>
            {feedReports.map((report) => (
              <LSModerationReportCard key={report.reportId} report={report} />
            ))}
          </Stack>
        )}

        <ResolvedSection
          resolvedReports={resolvedFeed}
          isLoading={isLoadingFeed}
          onLoad={loadResolvedFeed}
          searchName={feedSearchName}
          onSearchName={setFeedSearchName}
          committedSearch={feedCommittedSearch}
          onCommitSearch={() => setFeedCommittedSearch(feedSearchName)}
          selectedTypes={feedSelectedTypes}
          onToggleType={toggleFeedType}
          allTypes={feedTypes}
          renderCard={(report) => (
            <LSModerationReportCard key={report.reportId} report={report} resolved />
          )}
        />
      </Tabs.Panel>

      <Tabs.Panel value="users" pt="md">
        {userReports.length === 0 ? (
          <Text c="gray.5" fz="sm">No open user reports.</Text>
        ) : (
          <Stack>
            {userReports.map((report) => (
              <LSUserModerationReportCard key={report.reportId} report={report} />
            ))}
          </Stack>
        )}

        <ResolvedSection
          resolvedReports={resolvedUsers}
          isLoading={isLoadingUsers}
          onLoad={loadResolvedUsers}
          searchName={usersSearchName}
          onSearchName={setUsersSearchName}
          committedSearch={usersCommittedSearch}
          onCommitSearch={() => setUsersCommittedSearch(usersSearchName)}
          selectedTypes={usersSelectedTypes}
          onToggleType={toggleUserType}
          allTypes={userTypes}
          renderCard={(report) => (
            <LSUserModerationReportCard key={report.reportId} report={report} resolved />
          )}
        />
      </Tabs.Panel>
    </Tabs>
  );
}
