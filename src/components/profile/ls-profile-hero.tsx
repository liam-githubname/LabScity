import {
  Group,
  Badge,
  Button,
  Text,
  Image,
  Avatar,
  Card,
  Box,
  Modal,
  TextInput,
  Autocomplete,
  TagsInput,
  Textarea,
  Stack,
  Anchor,
  ActionIcon,
  FileButton,
  Loader,
} from "@mantine/core";
import { IconCamera, IconPencil, IconTrash } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SCIENCE_CATEGORIES, SKILL_OPTIONS } from "@/lib/constants/options";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@/lib/validations/profile";

const modalHeaderHeight = 120;

/** Form values: skill and articles always arrays (schema defaults). */
type EditProfileFormValues = Omit<UpdateProfileValues, "skill" | "articles"> & {
  skill: string[];
  articles: { title: string; url: string }[];
};

const defaultEditValues: EditProfileFormValues = {
  firstName: "",
  lastName: "",
  about: "",
  workplace: "",
  occupation: "",
  fieldOfInterest: "",
  skill: [],
  articles: [],
};

/** Normalize so skill and articles are always arrays for form default/reset. */
function toFormDefaults(v: UpdateProfileValues): EditProfileFormValues {
  return { ...v, skill: v.skill ?? [], articles: v.articles ?? [] };
}

/**
 * Controlled edit-profile modal and trigger button.
 * Includes staged pfp + header editing at the top — images are only uploaded on Save.
 */
export interface LSEditProfileModalProps {
  opened: boolean;
  onClose: () => void;
  initialValues?: UpdateProfileValues;
  onSubmit?: (values: UpdateProfileValues) => void;
  isSubmitting?: boolean;
  /** Current saved profile picture URL (for display before a new file is staged). */
  profilePicURL?: string;
  /** Current saved header image URL. */
  profileHeaderImageURL?: string;
  /** Called on Save with the staged file if user picked one. */
  onProfilePicSelect?: (file: File | null) => void;
  /** Called on Save with the staged file if user picked one. */
  onProfileHeaderSelect?: (file: File | null) => void;
  isUploadingProfilePic?: boolean;
  isUploadingProfileHeader?: boolean;
}

export function LSEditProfileModal({
  opened,
  onClose,
  initialValues = defaultEditValues,
  onSubmit = () => { },
  isSubmitting = false,
  profilePicURL,
  profileHeaderImageURL,
  onProfilePicSelect,
  onProfileHeaderSelect,
  isUploadingProfilePic = false,
  isUploadingProfileHeader = false,
}: LSEditProfileModalProps) {
  const defaults = toFormDefaults(initialValues);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(updateProfileSchema) as Resolver<EditProfileFormValues>,
    mode: "onBlur",
    defaultValues: defaults,
  });

  useEffect(() => {
    if (opened) {
      form.reset(toFormDefaults(initialValues));
    }
  }, [opened, initialValues]);

  // Staged image state — held locally until Save is clicked
  const [stagedPicFile, setStagedPicFile] = useState<File | null>(null);
  const [stagedPicPreview, setStagedPicPreview] = useState<string | null>(null);
  const [stagedHeaderFile, setStagedHeaderFile] = useState<File | null>(null);
  const [stagedHeaderPreview, setStagedHeaderPreview] = useState<string | null>(null);

  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const handlePicStage = (file: File | null) => {
    if (stagedPicPreview) URL.revokeObjectURL(stagedPicPreview);
    setStagedPicFile(file);
    setStagedPicPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleHeaderStage = (file: File | null) => {
    if (stagedHeaderPreview) URL.revokeObjectURL(stagedHeaderPreview);
    setStagedHeaderFile(file);
    setStagedHeaderPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleClose = () => {
    if (stagedPicPreview) URL.revokeObjectURL(stagedPicPreview);
    if (stagedHeaderPreview) URL.revokeObjectURL(stagedHeaderPreview);
    setStagedPicFile(null);
    setStagedPicPreview(null);
    setStagedHeaderFile(null);
    setStagedHeaderPreview(null);
    onClose();
  };

  const handleSave = (data: EditProfileFormValues) => {
    // Trigger uploads only on Save — staged previews stay alive until close to avoid flicker
    if (stagedPicFile) onProfilePicSelect?.(stagedPicFile);
    if (stagedHeaderFile) onProfileHeaderSelect?.(stagedHeaderFile);
    onSubmit(data);
  };

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "articles",
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Profile"
      centered
      size="lg"
      yOffset="5vh"
      styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" } }}
    >
      <form onSubmit={handleSubmit(handleSave)}>
        <Stack gap={12}>
          {/* Header + PFP with hover-to-edit */}
          <Box pos="relative" mb={52}>
            {/* Header */}
            <FileButton onChange={handleHeaderStage} accept="image/jpeg,image/png,image/webp,image/gif">
              {(props) => (
                <button
                  type="button"
                  {...props}
                  onMouseEnter={() => setIsHeaderHovered(true)}
                  onMouseLeave={() => setIsHeaderHovered(false)}
                  style={{
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    width: "100%",
                    display: "block",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    lineHeight: 0,
                  }}
                >
                  <Image
                    w="100%"
                    radius="lg"
                    h={modalHeaderHeight}
                    src={stagedHeaderPreview ?? profileHeaderImageURL}
                    fallbackSrc="https://placehold.co/600x100?text=Header"
                  />
                  {(isHeaderHovered || isUploadingProfileHeader) ? (
                    <Box
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        borderRadius: "var(--mantine-radius-lg)",
                      }}
                    >
                      {isUploadingProfileHeader ? (
                        <Loader size="xs" color="white" />
                      ) : (
                        <IconCamera size={20} />
                      )}
                    </Box>
                  ) : null}
                </button>
              )}
            </FileButton>

            {/* PFP overlapping header */}
            <Box style={{ position: "absolute", bottom: -40, left: 16 }}>
              <FileButton onChange={handlePicStage} accept="image/jpeg,image/png,image/webp,image/gif">
                {(props) => (
                  <button
                    type="button"
                    {...props}
                    onMouseEnter={() => setIsAvatarHovered(true)}
                    onMouseLeave={() => setIsAvatarHovered(false)}
                    style={{
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                      position: "relative",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      overflow: "hidden",
                    }}
                  >
                    <Avatar
                      src={stagedPicPreview ?? profilePicURL ?? undefined}
                      size={80}
                      radius="xl"
                      color="navy.7"
                    />
                    {(isAvatarHovered || isUploadingProfilePic) ? (
                      <Box
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        {isUploadingProfilePic ? (
                          <Loader size="xs" color="white" />
                        ) : (
                          <IconCamera size={18} />
                        )}
                      </Box>
                    ) : null}
                  </button>
                )}
              </FileButton>
            </Box>
          </Box>

          {/* Text form fields */}
          <Group grow>
            <TextInput
              withAsterisk
              label="First Name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <TextInput
              withAsterisk
              label="Last Name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </Group>
          <Textarea
            label="About"
            placeholder="Tell others about yourself..."
            description="Max 256 characters"
            error={errors.about?.message}
            {...register("about")}
          />
          <Controller
            name="workplace"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete
                label="Workplace"
                placeholder="Select or type..."
                data={["University of Central Florida", "University of Florida", "Harvard", "School of Rock"]}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="occupation"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete
                label="Occupation"
                placeholder="Select or type..."
                data={["Researcher", "Professor", "PhD Student", "Engineer"]}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="fieldOfInterest"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete
                label="Field of Interest"
                placeholder="Select or type..."
                data={[...SCIENCE_CATEGORIES]}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="skill"
            control={control}
            render={({ field, fieldState }) => (
              <TagsInput
                label="Your Skills"
                placeholder={!field.value?.length ? "Select or type your own..." : ""}
                data={[...SKILL_OPTIONS]}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />

          <Text fw={600} size="sm">
            Articles
          </Text>
          {fields.map((field, index) => (
            <Group key={field.id} align="flex-start" wrap="nowrap">
              <TextInput
                placeholder="Title"
                style={{ flex: 1 }}
                error={errors.articles?.[index]?.title?.message}
                {...register(`articles.${index}.title`)}
              />
              <TextInput
                placeholder="https://..."
                style={{ flex: 1 }}
                error={errors.articles?.[index]?.url?.message}
                {...register(`articles.${index}.url`)}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                mt={4}
                onClick={() => remove(index)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
          {errors.articles?.root?.message && (
            <Text c="red" size="xs">
              {errors.articles.root.message}
            </Text>
          )}
          <Button
            variant="light"
            color="navy"
            size="xs"
            onClick={() => append({ title: "", url: "" })}
            disabled={fields.length >= 30}
          >
            Add Article
          </Button>

          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

const profileHeaderHeight = 164;

export interface LSProfileHeroProps {
  profileName: string;
  profileResearchInterest: string;
  profileAbout?: string;
  profileSkill?: string[];
  profileArticles?: { title: string; url: string }[];
  profileHeaderImageURL?: string;
  profilePicURL?: string;
  /** Replaces legacy profileRole / profileInstitution. */
  occupation?: string;
  workplace?: string;
  isOwnProfile: boolean;
  onProfilePicSelect?: (file: File | null) => void;
  isUploadingProfilePic?: boolean;
  onProfileHeaderSelect?: (file: File | null) => void;
  isUploadingProfileHeader?: boolean;
  /** When own profile: called when user clicks Edit (parent opens modal). */
  onOpenEditProfile?: () => void;
  /** Edit modal open state and handlers (parent-controlled). */
  editModalOpened?: boolean;
  onEditModalClose?: () => void;
  editInitialValues?: UpdateProfileValues;
  onEditSubmit?: (values: UpdateProfileValues) => void;
  isEditSubmitting?: boolean;
  /** When others' profile: follow state and toggle. */
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  isTogglePending?: boolean;
}

export default function LSProfileHero({
  profileName,
  profileResearchInterest,
  profileAbout,
  profileSkill,
  profileArticles,
  profileHeaderImageURL,
  profilePicURL,
  occupation,
  workplace,
  isOwnProfile,
  onProfilePicSelect,
  isUploadingProfilePic = false,
  onProfileHeaderSelect,
  isUploadingProfileHeader = false,
  onOpenEditProfile,
  editModalOpened = false,
  onEditModalClose,
  editInitialValues,
  onEditSubmit,
  isEditSubmitting = false,
  isFollowing = false,
  onToggleFollow,
  isTogglePending = false,
}: LSProfileHeroProps) {
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(false);

  const avatarInitials = profileName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card shadow="sm" padding="none" radius="md">

      {/* Header — read-only in the hero; editing happens via the modal */}
      <Box mb={-64} pos="relative" style={{ zIndex: 1 }}>
        <Image
          bg="gray"
          w="100%"
          h={profileHeaderHeight}
          src={profileHeaderImageURL}
          fallbackSrc="https://placehold.co/600x100?text=Header"
        />
      </Box>

      <Box p="lg" pos="relative">
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
          }}
          mb={12}
        >
          {/* Avatar — read-only in the hero; editing happens via the modal */}
          <Avatar
            src={profilePicURL || undefined}
            size={80}
            radius="xl"
            color="navy.7"
            bg={profilePicURL ? undefined : "navy.7"}
            style={{ position: "relative", zIndex: 2 }}
          >
            {avatarInitials}
          </Avatar>
          <Stack gap="0">
            <Text c="navy.7" size="xl" fw={600}>{profileName}</Text>
            <Text c="navy.7" size="md">{profileResearchInterest}</Text>
            {(occupation ?? workplace) ? (
              <Text c="navy.6" size="md">
                {[occupation, workplace].filter(Boolean).join(", ")}
              </Text>
            ) : null}
          </Stack>
        </Box>
        <Box mb={12}>
          {profileAbout && (
            <Box mb={12}>
              <Text c="navy.7" fw={600}>About</Text>
              <Text c="navy.7">{profileAbout}</Text>
            </Box>
          )}
          {(profileSkill && profileSkill.length > 0) && (
            <Box mb={12}>
              <Text c="navy.7" fw={600} mb={8}>
                Skills
              </Text>
              <Group gap={8}>
                {profileSkill.map((skill, i) => (
                  <Badge key={i} color="navy.6" variant="light">
                    {skill}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}
          {(profileArticles && profileArticles.length > 0) && (
            <Box mb={12}>
              <Text c="navy.7" fw={600} mb={8}>
                Articles
              </Text>
              <Stack gap={6}>
                {(isArticlesExpanded
                  ? profileArticles
                  : profileArticles.slice(0, 3)
                ).map((article, i) => (
                  <Anchor
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    c="navy.6"
                    size="sm"
                    underline="hover"
                  >
                    {article.title}
                  </Anchor>
                ))}
              </Stack>
              {profileArticles.length > 3 && (
                <Button
                  variant="subtle"
                  color="navy"
                  size="xs"
                  mt={4}
                  onClick={() => setIsArticlesExpanded((prev) => !prev)}
                >
                  {isArticlesExpanded
                    ? "Show less"
                    : `Show all ${profileArticles.length} articles`}
                </Button>
              )}
            </Box>
          )}
          <Box
            mt={24}
            mb={12}
            w="100%"
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {isOwnProfile ? (
              <>
                {onOpenEditProfile && (
                  <Button
                    radius="xl"
                    variant="filled"
                    color="navy.6"
                    onClick={onOpenEditProfile}
                  >
                    <IconPencil size={18} />
                  </Button>
                )}
                {editModalOpened !== undefined && onEditModalClose && (
                  <LSEditProfileModal
                    opened={editModalOpened}
                    onClose={onEditModalClose}
                    initialValues={editInitialValues}
                    onSubmit={onEditSubmit}
                    isSubmitting={isEditSubmitting}
                    profilePicURL={profilePicURL}
                    profileHeaderImageURL={profileHeaderImageURL}
                    onProfilePicSelect={onProfilePicSelect}
                    onProfileHeaderSelect={onProfileHeaderSelect}
                    isUploadingProfilePic={isUploadingProfilePic}
                    isUploadingProfileHeader={isUploadingProfileHeader}
                  />
                )}
              </>
            ) : (
              onToggleFollow && (
                <Button
                  radius="xl"
                  variant={isFollowing ? "outline" : "filled"}
                  color="navy.6"
                  onClick={onToggleFollow}
                  loading={isTogglePending}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
