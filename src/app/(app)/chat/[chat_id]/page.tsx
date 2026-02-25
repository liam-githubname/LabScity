'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/supabase/client' // Adjust path as needed
import {
  Paper,
  TextInput,
  ActionIcon,
  ScrollArea,
  Stack,
  Group,
  Text,
  Box,
  Loader,
  Center,
  Container,
  Title,
  Avatar,
  Indicator,
  AppShell,
  NavLink,
} from '@mantine/core'
import { IconSend, IconMessageCircle2 } from '@tabler/icons-react'
import { getOldMessages, getChatsWithPreview, ChatPreview } from '@/components/chat/use-chat' // Adjust path as needed
import { useParams } from 'next/navigation'

// --- TYPES ---
interface Message {
  id: number
  conversation_id: number
  sender_id: string
  content: string
  created_at: string
}

export default function ChatPage() {
  // BECAUSE THIS STUPID CONNECTION WAS BEING RERENDERED WITH EVERY TEXT INPUT THE SHIT AINT WORK
  // all I needed to do was memoize the damn thing
  // and voila shit worky
  const [supabase] = useState(() => createClient())
  const { chat_id } = useParams<{ chat_id: string }>()

  // -- STATE --
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [inputText, setInputText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatPreview[]>([])

  // NEED TO GET ALL THE MESSAGES converations THAT THE USER IS A PART OF
  // Ref for auto-scrolling
  const viewport = useRef<HTMLDivElement>(null)

  useEffect(() => {

    if (!chat_id) return

    const initData = async () => {

      const { data: { user } } = await supabase.auth.getUser()

      if (user) setUserId(user.id)
      // Get Messages
      if (!user) return;

      try {
        // Assuming getOldMessages returns an array of messages
        const data = await getOldMessages(parseInt(chat_id))
        if (data) setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    initData()
  }, [])

  useEffect(() => {

    const initSideBar = async () => {

      try {
        const sidebarData = await getChatsWithPreview();

        if (sidebarData) setChats(sidebarData)
        console.log(sidebarData)
      } catch (error) {
        console.error("issue getting chat preview: ", error);
      }
    }

    initSideBar()
  }, [])

  useEffect(() => {
    //THIS WAS NOT WORKING BECAUSE USERID WASN'T BEING SET BEFORE THE CHANNEL WAS SUBSCRIBED I HAD TO MAKE THE USERID GRAB ON MOUNT INSTEAD OF BEING DEPENDENT
    if (!chat_id || !supabase || !userId) return;

    // 1. Force a unique channel name on every render so they never collide in memory
    const uniqueChannelName = `room:${chat_id}-${Date.now()}`;

    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // The filter is what actually matters to the database, not the channel name
          filter: `conversation_id=eq.${chat_id}`,
        },
        (payload) => {
          console.log('Realtime message received:', payload.new);
          const newMessage = payload.new as Message;
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.error('Channel closed or errored', err);
        }
      });

    return () => {
      console.log(`Cleaning up channel: ${uniqueChannelName}`);
      // 2. Simplify the cleanup. removeChannel handles the unsubscription internally.
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [chat_id, supabase, userId]);

  // 3. AUTO-SCROLL EFFECT
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  // --- HANDLERS ---
  const handleSend = async () => {
    if (!inputText.trim() || !userId || !chat_id) return

    const textToSend = inputText
    setInputText('') // Clear input immediately for UX

    const { error } = await supabase.from('messages').insert({
      conversation_id: parseInt(chat_id),
      sender_id: userId,
      content: textToSend,
    })

    if (error) {
      console.error('Error sending:', error)
      setInputText(textToSend) // Restore text on error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // --- RENDER ---
  // Show loader only if we haven't determined the user yet
  if (!userId) return <Center h="100vh"><Loader /></Center>
  if (!chat_id) return <Center h="100vh"><Loader /></Center>

  return (
    <AppShell
      navbar={{ width: 320, breakpoint: 'sm' }}
      padding={0}
    >
      {/* ======================================= */}
      {/* SIDEBAR AREA (Tests getChatsWithPreview) */}
      {/* ======================================= */}
      <AppShell.Navbar p="md" bg="transparent">
        <Paper
          radius="lg"
          shadow="sm"
          h="100%"
          withBorder
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box p="md" pb="sm" style={{ display: 'flex', justifyContent: 'center' }}>
        <Title order={3} c="navy.8" ta="center">
          My Conversations
        </Title>
      </Box>

          {/* Search bar */}
          <Box px="md" pb="md">
            <TextInput
              placeholder="Search"
              radius="xl"
              size="md"
            />
          </Box>

          <ScrollArea flex={1}>
            {chats.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">No chats found.</Text>
              </Center>
            ) : (
              chats.map((chat) => (
                <NavLink
                  key={chat.conversation_id}
                  href={`/chat/${chat.conversation_id}`}
                  active={chat.conversation_id + "" === chat_id}
                  c="navy.8"
                  px="md"
                  py="sm"
                  label={
                    <Text fw={600}>
                      {chat.name || `Chat #${chat.conversation_id}`}
                    </Text>
                  }
                  description={
                    <Text size="xs" c="dimmed">
                      {chat.message?.content as string || 'No messages yet'}
                    </Text>
                  }
                  leftSection={
                    <Avatar
                      radius="xl"
                      size="md"
                    />
                  }
                  style={{
                    borderRadius: 12,
                    margin: '4px 8px',
                  }}
                />
              ))
            )}
          </ScrollArea>
        </Paper>
      </AppShell.Navbar>

      {/* ======================================= */}
      {/* MAIN CHAT AREA (Tests Realtime & Inserts) */}
      {/* ======================================= */}
      <AppShell.Main>
        {!chat_id ? (
          <Center h="100vh">
            <Text c="dimmed">Select a chat from the sidebar to start testing.</Text>
          </Center>
        ) : (
          <Container fluid h="100vh" p={0}>
            <Stack h="100%" gap={0} bg="gray.0">

              {/* HEADER */}
              <Paper p="md" shadow="sm" radius="lg" withBorder style={{ zIndex: 10 }}>
                <Stack gap={4} align="center">
                  {/* Chat Room Title - centered */}
                  <Title order={3} c="navy.8" style={{ margin: 0 }}>
                    Chat Room {chat_id}
                  </Title>

                  <Group align="center" style={{ gap: 6 }}>
                    <Indicator
                      color={isConnected ? 'green' : 'yellow'}
                      size={8}
                      processing
                    />
                    <Text size="xs" c="dimmed">
                      {isConnected ? 'Live' : 'Connecting...'}
                    </Text>
                  </Group>
                </Stack>
              </Paper>

              {/* MESSAGES AREA */}
              <ScrollArea flex={1} p="md" viewportRef={viewport}>
                <Stack gap="md">
                  {messages.length === 0 && (
                    <Center h={200}>
                      <Text c="dimmed" size="sm">No messages yet. Say hello!</Text>
                    </Center>
                  )}

                  {messages.map((msg) => {
                    const isMe = msg.sender_id === userId
                    return (
                      <Group key={msg.id} justify={isMe ? 'flex-end' : 'flex-start'} align="flex-end" gap="xs">
                        {!isMe && <Avatar radius="xl" size="md" />}

                        <Paper
                          p="sm"
                          px="md"
                          radius="lg"
                          bg={isMe ? 'gray.6' : 'gray.2'}
                          c={isMe ? 'gray.2' : 'navy.8'}
                          shadow="sm"
                          style={{
                            maxWidth: '70%',
                          }}
                        >
                          <Text size="sm">{msg.content}</Text>
                        </Paper>
                      </Group>
                    )
                  })}
                </Stack>
              </ScrollArea>

              {/* INPUT AREA */}
              <Paper p="md" withBorder radius="md">
                <Group align="flex-end">
                  <TextInput
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ flex: 1 }}
                    radius="md" 
                    size="md"
                    disabled={!isConnected}
                  />
                  <ActionIcon
                    size="lg"
                    variant="filled"
                    color="blue"
                    radius="xl"
                    onClick={handleSend}
                    disabled={!inputText.trim() || !isConnected}
                  >
                    <IconSend size="1.1rem" />
                  </ActionIcon>
                </Group>
              </Paper>

            </Stack>
          </Container>
        )}
      </AppShell.Main>
    </AppShell>
  )
}
