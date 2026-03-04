import {
  Group,
  Badge,
  Button,
  Text,
  Image,
  Card,
  Box,
  Modal,
  TextInput,
  Autocomplete,
  MultiSelect,
  Textarea,
  Stack,
  FileButton,
  Loader,
} from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SCIENCE_CATEGORIES, SKILL_OPTIONS } from "@/lib/constants/options";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@/lib/validations/profile";

const profileHeaderHeight = 164;

/** Form values: skills always an array (schema default). */
type EditProfileFormValues = Omit<UpdateProfileValues, "skills"> & {
  skills: string[];
};

/** Default values when parent has not yet wired edit form (e.g. before Commit 4). */
const defaultEditValues: EditProfileFormValues = {
  firstName: "",
  lastName: "",
  about: "",
  workplace: "",
  occupation: "",
  fieldOfInterest: "",
  skills: [],
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

/** Normalize so skills is always an array for form default/reset. */
function toFormDefaults(v: UpdateProfileValues): EditProfileFormValues {
  return { ...v, skills: v.skills ?? [] };
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

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Profile">
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
            name="skills"
            control={control}
            render={({ field, fieldState }) => (
              <MultiSelect
                label="Your Skills"
                placeholder="Select multiple..."
                data={[...SKILL_OPTIONS]}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

export interface LSProfileHeroProps {
  profileName: string;
  profileResearchInterest: string;
  profileAbout?: string;
  profileSkills?: string[];
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
  /** When others' profile: edit modal open state and handlers (parent-controlled). */
  editModalOpened?: boolean;
  onEditModalClose?: () => void;
  editInitialValues?: UpdateProfileValues;
  onEditSubmit?: (values: UpdateProfileValues) => void;
  isEditSubmitting?: boolean;
  /** When others' profile: follow state and toggle. */
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export default function LSProfileHero({
  profileName,
  profileResearchInterest,
  profileAbout,
  profileSkills,
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
}: LSProfileHeroProps) {
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

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
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {isUploadingProfileHeader ? <Loader size="xs" color="white" /> : "Change header"}
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
          {/* use custom placeholder images for header + avatar
              default avatar icon from mantine fucks up z ordering
              this approach ensures image is atop header even if supplied url is bad */}
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
                  <Image
                    src={profilePicURL}
                    fallbackSrc="https://placehold.co/100x100?text=PFP"
                    w={80}
                    h={80}
                    radius="50%"
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
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {isUploadingProfilePic ? <Loader size="xs" color="white" /> : "Change"}
                    </Box>
                  ) : null}
                </button>
              )}
            </FileButton>
          ) : (
            <Image
              src={profilePicURL}
              fallbackSrc="https://placehold.co/100x100?text=PFP"
              w={80}
              h={80}
              radius="50%"
              style={{ position: "relative", zIndex: 120 }}
            />
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
          {(profileSkills && profileSkills.length > 0) &&
            <Box mb={12}>
              <Text c="navy.7" fw={600} mb={8}>
                Skills
              </Text>
              <Group gap={8}>
                {(profileSkills.map((skill, i) => {
                  return (
                    <Badge key={i} color="navy.6" variant="light">
                      {skill}
                    </Badge>
                  )
                }))}
              </Group>
            </Box>
          }
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
