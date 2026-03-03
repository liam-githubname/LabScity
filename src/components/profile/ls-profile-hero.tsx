import { Group, Badge, Button, Text, Image, Card, Box, Avatar, Popover, TextInput, Input, Select, Autocomplete, MultiSelect, Textarea, Stack, FileButton, Loader } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";

import { useDisclosure } from '@mantine/hooks';
import { Modal } from '@mantine/core';
import { useForm } from "@mantine/form"

const profileHeaderHeight = 164;

const LSEditProfilePopover = () => {
  const [opened, { open, close }] = useDisclosure(false) // TODO: what is this doing?

  const editProfileForm = useForm({
    mode: "uncontrolled", // WARNING: SHOULD SWITCH TO CONTROLLED?
    initialValues: {
      firstName: "",
      lastName: "",
      about: "",
      institution: "",
      fieldOfInterest: "",
      skills: []
    },
  })

  const handleSave = (values: any) => { // TODO: type
    // TODO: FILL THIS IN WITH REAL API STUFF
    console.log("Saving profile info: ", values)
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Edit Profile">
        <form onSubmit={editProfileForm.onSubmit((values) => handleSave(values))}>
          <Stack gap={12}>

            <Group grow>
              {/* grow makes children take up equal width */}
              <TextInput
                withAsterisk
                label="First Name"
                key={editProfileForm.key("firstName")}
                {...editProfileForm.getInputProps("firstName")} // this PATTERN automatically inserts additional props to prevent desync
              />
              <TextInput
                withAsterisk
                label="Last Name"
                key={editProfileForm.key("lastName")}
                {...editProfileForm.getInputProps("lastName")}
              />
            </Group>
            <Textarea
              label="About"
              placeholder="Lorem ipsum dolor sit amet..."
              description="Max 256 characters" // WARNING: this limit is arbitrary! but we should def have one
              key={editProfileForm.key("about")}
              {...editProfileForm.getInputProps("about")}
            />

            {/* WARNING: HOW DO THESE FOLLOWING WORK WITH THEIR DATATYPE ? */}

            <Autocomplete
              label="Institution"
              placeholder="Select..."
              data={["University of Central Florida", "University of Florida", "Harvard", "School of Rock"]} // TODO: What to do if lots of entries?
              key={editProfileForm.key("institution")}
              {...editProfileForm.getInputProps("institution")}
            />
            <Autocomplete
              label="Field of Interest"
              placeholder="Select..."
              data={["ECMAScript", "JavaScript", "MORE JavaScript"]} // TODO: what to do if lots of entries? ... SELECT SEARCHABLE and LIMIT
              key={editProfileForm.key("fieldOfInterest")}
              {...editProfileForm.getInputProps("fieldOfInterest")}
            />
            <MultiSelect
              label="Your Skills"
              placeholder="Select Multiple..."
              data={["Web Dev", "C++", "Microbiology", "Unemployment"]}
              key={editProfileForm.key("skills")}
              {...editProfileForm.getInputProps("skills")}
            />
            <Button type="submit">Save</Button>
          </Stack>
        </form>
      </Modal >

      <Button radius="xl" variant="filled" color="navy.6" onClick={open}>
        <IconPencil size={18} />
      </Button>
    </>
  )
}

interface LSProfileHeroProps {
  profileName: string,
  profileInstitution: string,
  profileRole: string,
  profileResearchInterest: string,
  profileAbout?: string,
  profileSkills?: string[],
  profileHeaderImageURL?: string,
  profilePicURL?: string,
  isOwnProfile?: boolean,
  onProfilePicSelect?: (file: File | null) => void,
  isUploadingProfilePic?: boolean,
  onProfileHeaderSelect?: (file: File | null) => void,
  isUploadingProfileHeader?: boolean,
}

{/*Needs to be refactored if we want conditional rendering of the hero based on the status of the query if we don't want to wrap it in an another component*/ }
export default function LSProfileHero({
  profileName,
  profileInstitution,
  profileRole,
  profileResearchInterest,
  profileAbout,
  profileSkills,
  profileHeaderImageURL,
  profilePicURL,
  isOwnProfile = false,
  onProfilePicSelect,
  isUploadingProfilePic = false,
  onProfileHeaderSelect,
  isUploadingProfileHeader = false,
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
            <Text c="navy.6" size="md">{profileRole}, {profileInstitution}</Text>
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
            <LSEditProfilePopover />
          </Box>
        </Box>
      </Box>
    </Card >
  );
};
