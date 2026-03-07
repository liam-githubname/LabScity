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

const profileHeaderHeight = 164;

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

/**
 * Controlled edit-profile modal and trigger button.
 * Parent supplies initialValues, onSubmit, and open/close state; form uses Workplace/Occupation.
 */
export interface LSEditProfileModalProps {
  opened: boolean;
  onClose: () => void;
  initialValues?: UpdateProfileValues;
  onSubmit?: (values: UpdateProfileValues) => void;
  isSubmitting?: boolean;
}

/** Normalize so skill and articles are always arrays for form default/reset. */
function toFormDefaults(v: UpdateProfileValues): EditProfileFormValues {
  return { ...v, skill: v.skill ?? [], articles: v.articles ?? [] };
}

export function LSEditProfileModal({
  opened,
  onClose,
  initialValues = defaultEditValues,
  onSubmit = () => {},
  isSubmitting = false,
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

  const handleSave = (data: EditProfileFormValues) => {
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
      onClose={onClose}
      title="Edit Profile"
      centered
      size="lg"
      yOffset="5vh"
      styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" } }}
    >
      <form onSubmit={handleSubmit(handleSave)}>
        <Stack gap={12}>
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
                placeholder="Select or type your own..."
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

/**
 * Props for LSProfileHero.
 *
 * @param profileName - Display name (used for avatar initials when profilePicURL missing).
 * @param profileResearchInterest - Subtitle (e.g. first research interest).
 * @param profileAbout - Optional "About" section text.
 * @param profileSkill - Optional list of skill badges.
 * @param profileArticles - Optional list of { title, url }; first 3 shown inline, rest in modal.
 * @param profileHeaderImageURL - Banner/header image URL.
 * @param profilePicURL - Avatar image URL.
 * @param occupation - Job title (replaces legacy profileRole).
 * @param workplace - Institution/employer (replaces legacy profileInstitution).
 * @param isOwnProfile - If true, show Edit and upload overlays; otherwise show Follow/Unfollow.
 * @param onProfilePicSelect - When set (own profile), file selection triggers profile pic upload.
 * @param isUploadingProfilePic - Shows loader on avatar overlay while uploading.
 * @param onProfileHeaderSelect - When set (own profile), file selection triggers banner upload.
 * @param isUploadingProfileHeader - Shows loader on banner overlay while uploading.
 * @param onOpenEditProfile - When own profile: called when user clicks Edit (parent opens modal).
 * @param editModalOpened - Edit modal controlled open state.
 * @param onEditModalClose - Edit modal close handler.
 * @param editInitialValues - Form initial values for the edit modal.
 * @param onEditSubmit - Edit form submit handler.
 * @param isEditSubmitting - Edit form submitting state.
 * @param isFollowing - When viewing others: current follow state.
 * @param onToggleFollow - When viewing others: follow/unfollow action.
 * @param isTogglePending - When viewing others: follow mutation pending state.
 */
export interface LSProfileHeroProps {
  profileName: string;
  profileResearchInterest: string;
  profileAbout?: string;
  profileSkill?: string[];
  profileArticles?: { title: string; url: string }[];
  profileHeaderImageURL?: string;
  profilePicURL?: string;
  occupation?: string;
  workplace?: string;
  isOwnProfile: boolean;
  onProfilePicSelect?: (file: File | null) => void;
  isUploadingProfilePic?: boolean;
  onProfileHeaderSelect?: (file: File | null) => void;
  isUploadingProfileHeader?: boolean;
  onOpenEditProfile?: () => void;
  editModalOpened?: boolean;
  onEditModalClose?: () => void;
  editInitialValues?: UpdateProfileValues;
  onEditSubmit?: (values: UpdateProfileValues) => void;
  isEditSubmitting?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  isTogglePending?: boolean;
}

/**
 * Profile hero card: banner image, avatar, name, research interest, occupation/workplace,
 * about, skills, and articles. First 3 articles inline; "Show all X articles" opens a scrollable modal (60vh).
 * Own profile: Edit button and LSEditProfileModal; hover overlays on avatar/banner for upload (overlay z-index 130
 * above avatar so the camera/Edit overlay is visible). Other profile: Follow/Unfollow button.
 */
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
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isArticlesModalOpen, setIsArticlesModalOpen] = useState(false);

  const avatarInitials = profileName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card shadow="sm" padding="none" radius="md">

      <Box mb={-64} pos="relative" style={{ zIndex: 110 }}>
        {isOwnProfile && onProfileHeaderSelect ? (
          <FileButton onChange={onProfileHeaderSelect} accept="image/jpeg,image/png,image/webp,image/gif">
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
                  bg="gray"
                  w="100%"
                  h={profileHeaderHeight}
                  src={profileHeaderImageURL}
                  fallbackSrc="https://placehold.co/600x100?text=Header"
                />
                {(isHeaderHovered || isUploadingProfileHeader) ? (
                  <Box
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      gap: 4,
                    }}
                  >
                    {isUploadingProfileHeader ? (
                      <Loader size="xs" color="white" />
                    ) : (
                      <>
                        <IconCamera size={20} />
                        Change banner
                      </>
                    )}
                  </Box>
                ) : null}
              </button>
            )}
          </FileButton>
        ) : (
          <Image
            bg="gray"
            w="100%"
            h={profileHeaderHeight}
            src={profileHeaderImageURL}
            fallbackSrc="https://placehold.co/600x100?text=Header"
          />
        )}
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
          {/* Avatar shows profile image or initials when missing; z-index keeps it atop header */}
          {isOwnProfile && onProfilePicSelect ? (
            <FileButton onChange={onProfilePicSelect} accept="image/jpeg,image/png,image/webp,image/gif">
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
                    zIndex: 120,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    overflow: "hidden",
                  }}
                >
                  <Avatar
                    src={profilePicURL || undefined}
                    size={80}
                    radius="xl"
                    color="navy.7"
                    bg={profilePicURL ? undefined : "navy.7"}
                  >
                    {avatarInitials}
                  </Avatar>
                  {/* Overlay z-index 130 so it sits above the avatar/button and remains visible. */}
                  {(isAvatarHovered || isUploadingProfilePic) ? (
                    <Box
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 130,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 600,
                        gap: 2,
                      }}
                    >
                      {isUploadingProfilePic ? (
                        <Loader size="xs" color="white" />
                      ) : (
                        <>
                          <IconCamera size={18} />
                          Edit
                        </>
                      )}
                    </Box>
                  ) : null}
                </button>
              )}
            </FileButton>
          ) : (
            <Avatar
              src={profilePicURL || undefined}
              size={80}
              radius="xl"
              color="navy.7"
              bg={profilePicURL ? undefined : "navy.7"}
              style={{ position: "relative", zIndex: 120 }}
            >
              {avatarInitials}
            </Avatar>
          )}
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
          {profileAbout &&
            <Box mb={12}>
              <Text c="navy.7" fw={600}>About</Text>
              <Text c="navy.7">{profileAbout}</Text>
            </Box>
          }
          {(profileSkill && profileSkill.length > 0) &&
            <Box mb={12}>
              <Text c="navy.7" fw={600} mb={8}>
                Skills
              </Text>
              <Group gap={8}>
                {(profileSkill.map((skill, i) => {
                  return (
                    <Badge key={i} color="navy.6" variant="light">
                      {skill}
                    </Badge>
                  )
                }))}
              </Group>
            </Box>
          }
          {/* Articles: first 3 inline; "Show all X" opens modal to avoid unbounded list growth. */}
          {(profileArticles && profileArticles.length > 0) && (
            <Box mb={12}>
              <Text c="navy.7" fw={600} mb={8}>
                Articles
              </Text>
              <Stack gap={6}>
                {profileArticles.slice(0, 3).map((article, i) => (
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
                  onClick={() => setIsArticlesModalOpen(true)}
                >
                  {`Show all ${profileArticles.length} articles`}
                </Button>
              )}
              <Modal
                opened={isArticlesModalOpen}
                onClose={() => setIsArticlesModalOpen(false)}
                title="Articles"
                centered
                size="md"
                styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
              >
                <Stack gap={8}>
                  {profileArticles.map((article, i) => (
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
              </Modal>
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
    </Card >
  );
};
