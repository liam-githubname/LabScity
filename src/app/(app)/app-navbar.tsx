"use client";

import { Button, Flex } from "@mantine/core";
import {
  IconFlaskFilled,
  IconGavel,
  IconMessageFilled,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/app/use-is-mobile";

const baseNavigation = [
  { href: "/home", icon: IconFlaskFilled, label: "Home" },
  { href: "/profile", icon: IconUser, label: "Profile" },
  { href: "/chat", icon: IconMessageFilled, label: "Chat" },
  { href: "/groups", icon: IconUsers, label: "Groups" },
];

const moderatorNavItem = { href: "/moderation", icon: IconGavel, label: "Moderation" };

interface LSAppNavbarProps {
  mobileHeight: number;
  desktopWidth: number;
  userId: string;
  isModerator: boolean;
}

export default function LSAppNavbar({
  mobileHeight,
  desktopWidth,
  userId,
  isModerator,
}: LSAppNavbarProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const navigation = isModerator ? [...baseNavigation, moderatorNavItem] : baseNavigation;

  function getHref(item: (typeof navigation)[number]): string {
    if (item.href === "/profile") {
      return `/profile/${userId}`;
    }
    return item.href;
  }

  function isActive(item: (typeof navigation)[number]) {
    if (item.href === "/profile") {
      return pathname.startsWith(`/profile/${userId}`);
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <Flex
      bg="navy.7"
      pos="fixed"
      // stretch down screen if desktop ( side ); stretch across if mobile
      w={isMobile ? "100%" : desktopWidth}
      h={isMobile ? mobileHeight : "100%"}
      direction={isMobile ? "row" : "column"}
      align={isMobile ? "center" : "flex-start"}
      justify="center"
      p={8}
      gap={16}
      {...(isMobile && { bottom: 0 })}
      style={{ zIndex: 10 }}
    >
      {navigation.map((item) => {
        const active = isActive(item);
        const href = getHref(item);

        return (
          <Button
            key={item.href}
            href={href}
            component={Link}
            leftSection={<item.icon size={28} />}
            c={active ? "gray.0" : "navy.5"}
            variant="transparent"
          >
            {!isMobile && item.label}
          </Button>
        );
      })}
    </Flex>
  );
}
