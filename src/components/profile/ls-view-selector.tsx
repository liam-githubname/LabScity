import { Box, Button } from "@mantine/core";

export default function LSViewSelector() {
  // TODO: Finish this!!!
  return (
    <Box
      my={6}
      px={5}
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <Button variant="transparent" c="navy.7" size="md">Posts</Button>
      <Button variant="transparent" c="navy.5" size="md">Publications</Button>
      <Button variant="transparent" c="navy.5" size="md">Projects</Button>
    </Box>
  )
}
