import { Box, Button } from "@mantine/core";

export default function ViewSelector() {
  // TODO: Finish this!!!
  return (
    <Box
      my={14}
      px={14}
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <Button variant="transparent" c="navy.8" size="md">Posts</Button>
      <Button variant="transparent" c="navy.6" size="md">Publications</Button>
      <Button variant="transparent" c="navy.6" size="md">Projects</Button>
    </Box>
  )
}
