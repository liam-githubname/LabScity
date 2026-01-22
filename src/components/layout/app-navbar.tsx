"use client";

import { ActionIcon, Box, Group } from "@mantine/core";
import { IconFlaskFilled, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", icon: IconFlaskFilled },
  { href: "/profile", icon: IconUser },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <Box
      h={60}
      bg="gray.7"
      style={{
        borderTop: "1px solid lightgray",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1001
      }}
    >
      <Group h="100%" justify="space-around" align="center">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ActionIcon
              key={item.href}
              component={Link}
              href={item.href}
              variant="transparent"
              size="lg"
              c={isActive ? "gray.0" : "gray.5"}
              style={{ transition: "color 0.2s" }}
            >
              <item.icon size={24} />
            </ActionIcon>
          );
        })}
      </Group>
    </Box>
  );
}
