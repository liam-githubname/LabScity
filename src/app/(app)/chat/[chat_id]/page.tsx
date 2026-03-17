'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/supabase/client'
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
  Modal,
  NavLink,
  Button
} from '@mantine/core'
import { IconSend, IconInfoCircle, IconPlus } from '@tabler/icons-react'
import { useParams, useRouter } from 'next/navigation'
import { ChatPreview, getChatsWithPreview, getOldMessages } from '@/lib/actions/chat'
import { useCreateChat, useLeaveConversation, useUpdateConversationName } from '@/components/chat/use-chat'
import { searchResult } from '@/lib/types/data'
import { useDebouncedValue } from '@mantine/hooks'
import { searchForUsers, searchUserContent } from '@/lib/actions/data'
import { User } from '@/lib/types/feed'

interface Message {
  id: number
  conversation_id: number
  sender_id: string
  content: string
  created_at: string
}

export default function ChatPage() {
  const [supabase] = useState(() => createClient())
  const { chat_id } = useParams<{ chat_id: string }>()
  const router = useRouter()

  // -- STATE --
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [inputText, setInputText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatPreview[]>([])

  // -- PAGINATION STATE --
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // -- MODAL STATE --
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [newChatModalOpen, setNewChatModalOpen] = useState(false)

  // -- RENAME STATE --
  const [chatName, setChatName] = useState('')

  // Search state
  const [query, setQuery] = useState("");
  const [debounced] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // -- NEW CHAT MUTATION --
  const createChatMutation = useCreateChat()

  // -- LEAVE CHAT MUTATION --
  const leaveConversationMutation = useLeaveConversation()

  // -- RENAME CHAT MUTATION --
  const updateConversationNameMutation = useUpdateConversationName()

  // -- REFS --
  const viewport = useRef<HTMLDivElement>(null)
  // We use this to tell the UI *why* the messages array changed
  const scrollReason = useRef<'init' | 'new_message' | 'pagination'>('init')

  // NOTE: debounced runs automatically after 300ms when query is been updated
  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    // NOTE: debounced is the search query
    // searchForUsers returns User[] - User is defined in types/feed.ts
    searchForUsers({ query: debounced }).then((res) => {
      setResults(res.success ? (res.data ?? []) : []);
      console.log(results)
      setSearching(false);
    });
  }, [debounced]);

  // 1. INIT DATA
  useEffect(() => {
    if (!chat_id) return

    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      if (!user) return;

      try {
        scrollReason.current = 'init' // Tell the UI to scroll to bottom on load

        // Ensure your getOldMessages server action is updated to accept a cursor!
        const data = await getOldMessages(parseInt(chat_id))

        if (!data.data) return;

        if (data.data.length < 50) setHasMore(false) // Assuming limit is 50
        setMessages(data.data)

      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    initData()
  }, [chat_id, supabase])

  // 2. INIT SIDEBAR
  const fetchChats = async () => {
    try {
      const sidebarData = await getChatsWithPreview();
      if (!sidebarData.data) return;
      setChats(sidebarData.data)
    } catch (error) {
      console.error("issue getting chat preview: ", error);
    }
  }

  useEffect(() => {
    fetchChats()
  }, [])

  // 3. REALTIME
  useEffect(() => {
    if (!chat_id || !supabase || !userId) return;

    const uniqueChannelName = `room:${chat_id}-${Date.now()}`;

    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${chat_id}`,
        },
        (payload) => {
          console.log('Realtime message received:', payload.new);
          const newMessage = payload.new as Message;

          scrollReason.current = 'new_message' // Tell UI to snap to bottom
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [chat_id, supabase, userId]);

  // 4. SMART SCROLLING
  useEffect(() => {
    if (!viewport.current) return;

    if (scrollReason.current === 'init' || scrollReason.current === 'new_message') {
      // Smoothly scroll to the very bottom
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
    }
    // If reason is 'pagination', do absolutely nothing. We handle that in loadMore.
  }, [messages])

  // 5. LOAD MORE (PAGINATION)
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0 || !chat_id) return

    setIsLoadingMore(true)
    scrollReason.current = 'pagination' // Stop the auto-scroller from firing

    // The cursor is the timestamp of the oldest message we currently see
    const oldestMessageTimestamp = messages[0].created_at
    const oldScrollHeight = viewport.current?.scrollHeight || 0

    const response = await getOldMessages(parseInt(chat_id), oldestMessageTimestamp)

    if (response.success && response.data) {
      if (response.data.length < 50) setHasMore(false)

      // Prepend old messages
      setMessages(current => [...response.data!, ...current])

      // The Magic Scroll Fix: Keep the scrollbar perfectly still
      setTimeout(() => {
        if (viewport.current) {
          const newScrollHeight = viewport.current.scrollHeight
          viewport.current.scrollTop = newScrollHeight - oldScrollHeight
        }
      }, 0)
    }

    setIsLoadingMore(false)
  }

  // 6. HANDLERS
  const handleSend = async () => {
    if (!inputText.trim() || !userId || !chat_id) return

    const textToSend = inputText
    setInputText('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: parseInt(chat_id),
      sender_id: userId,
      content: textToSend,
    })

    if (error) {
      console.error('Error sending:', error)
      setInputText(textToSend)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // NOTE: This takes in an arry of user_id's
  const handleCreateChat = () => {
    if (!query.trim()) return
    // searchQuery is the user ID to invite — replace with real user lookup later
    createChatMutation.mutate([query.trim()], {
      onSuccess: () => {
        setNewChatModalOpen(false)
        setQuery('')
      }
    })
  }

  if (!chat_id) return <Center h="100vh"><Loader /></Center>

  return (
    <Group align="stretch" gap={0} h="calc(100vh - 60px)" bg="gray.3" style={{ overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <Box w={320} p="md" bg="gray.3" style={{ flexShrink: 0, height: '100%' }}>
        <Paper
          radius="lg"
          shadow="sm"
          h="100%"
          withBorder
          bg="gray.2"
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <Box p="md" pb="sm" style={{ display: 'flex', justifyContent: 'center' }}>
            <Title order={3} c="navy.7" ta="center">
              My Conversations
            </Title>
          </Box>

          <Box px="md" pb="md">
            <TextInput placeholder="Search" radius="xl" size="md" />
          </Box>

          <ScrollArea flex={1}>
            {chats.length === 0 ? (
              <Center p="xl"><Text c="dimmed">No chats found.</Text></Center>
            ) : (
              chats.map((chat) => (
                <NavLink
                  key={chat.conversation_id}
                  href={`/chat/${chat.conversation_id}`}
                  active={chat.conversation_id + "" === chat_id}
                  styles={{ root: { '--nav-active-bg': 'var(--mantine-color-navy-3)' } }}
                  c="navy.7"
                  px="md"
                  py="sm"
                  label={<Text fw={600}>{chat.name || `Chat #${chat.conversation_id}`}</Text>}
                  description={<Text size="xs" c="dimmed">{chat.message?.content as string || 'No messages yet'}</Text>}
                  leftSection={<Avatar radius="xl" size="md" color="navy.7" />}
                />
              ))
            )}
          </ScrollArea>

          {/* NEW CHAT BUTTON */}
          <Box p="md">
            <Button
              fullWidth
              color="navy.7"
              variant="filled"
              radius="xl"
              leftSection={<IconPlus size="1rem" />}
              onClick={() => setNewChatModalOpen(true)}
            >
              New Chat
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* NEW CHAT MODAL */}
      <Modal
        opened={newChatModalOpen}
        onClose={() => { setNewChatModalOpen(false); setQuery(''); setSelectedUsers([]) }}
        title={<Title order={4} c="navy.7">New Conversation</Title>}
        centered
      >
        <Stack gap="md">
          <TextInput
            placeholder="Search by name"
            value={query}
            // NOTE: the search function is called every 300ms after the query is set so you don't really have to do much here to get it to work
            onChange={(e) => setQuery(e.target.value)}
            radius="xl"
            size="md"
          />
          {searching && <Center><Loader size="sm" /></Center>}
          {results.length > 0 && (
            <Stack gap={0}>
              {results.map((user) => {
                const isSelected = selectedUsers.some(u => u.user_id === user.user_id)
                return (
                  <NavLink
                    key={user.user_id}
                    label={<Text fw={600} c="navy.7">{user.first_name} {user.last_name}</Text>}
                    leftSection={<Avatar radius="xl" size="md" color="navy.7" src={user.avatar_url} />}
                    active={isSelected}
                    styles={{ root: { '--nav-active-bg': 'var(--mantine-color-navy-3)' } }}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedUsers(current => current.filter(u => u.user_id !== user.user_id))
                      } else {
                        setSelectedUsers(current => [...current, user])
                      }
                    }}
                    style={{ borderRadius: 8 }}
                  />
                )
              })}
            </Stack>
          )}
          {query.trim() && !searching && results.length === 0 && (
            <Text size="sm" c="dimmed" ta="center">No users found</Text>
          )}
          <Button
            fullWidth
            color="navy.7"
            variant="filled"
            radius="xl"
            loading={createChatMutation.isPending}
            disabled={selectedUsers.length === 0}
            onClick={() => createChatMutation.mutate(selectedUsers.map(u => u.user_id), {
              onSuccess: () => {
                setNewChatModalOpen(false)
                setQuery('')
                setSelectedUsers([])
                fetchChats()
              }
            })}
          >
            Start Chat
          </Button>
        </Stack>
      </Modal>

      {/* MAIN CHAT */}
      <Box style={{ flex: 1, overflow: "hidden" }}>
        <Container fluid h="calc(100vh - 60px)" p={0}>
          <Stack h="100%" gap={0} bg="gray.1">

            {/* HEADER */}
            <Paper p="md" shadow="sm" radius="lg" withBorder bg="gray.2" style={{ zIndex: 10 }}>
              <Group justify="space-between" align="center">
                <Box w={36} />
                <Stack gap={4} align="center">
                  <Title order={3} c="navy.7" style={{ margin: 0 }}>
                    {chats.find(c => c.conversation_id + "" === chat_id)?.name || `Chat #${chat_id}`}
                  </Title>
                  <Group align="center" style={{ gap: 6 }}>
                    <Indicator color={isConnected ? 'green' : 'yellow'} size={8} processing />
                    <Text size="xs" c="dimmed">
                      {isConnected ? 'Live' : 'Connecting...'}
                    </Text>
                  </Group>
                </Stack>
                <ActionIcon
                  variant="subtle"
                  color="navy.7"
                  radius="xl"
                  size="xl"
                  onClick={() => setInfoModalOpen(true)}
                >
                  <IconInfoCircle size="1.6rem" />
                </ActionIcon>
              </Group>
            </Paper>

            {/* INFO MODAL */}
            <Modal
              opened={infoModalOpen}
              onClose={() => setInfoModalOpen(false)}
              title={<Title order={4} c="navy.7">{chats.find(c => c.conversation_id + "" === chat_id)?.name || `Chat #${chat_id}`}</Title>}
              centered
            >
              <Stack gap="md">
                {messages.length > 0 && (
                  <Text size="sm" c="navy.7">
                    <Text span fw={600}>Conversation started: </Text>
                    {new Date(messages[0].created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                )}

                {/* TODO: figure out how to get participants */}
                <Box>
                  <Text size="sm" fw={600} c="navy.7" mb={6}>Members</Text>
                  <Text size="sm" c="dimmed">Placeholder</Text>
                </Box>

                {/* Update Chat Name */}
                <Box>
                  <Text size="sm" fw={600} c="navy.7" mb={6}>Update Chat Name</Text>
                  <Group gap="xs">
                    <TextInput
                      placeholder="Enter a new name..."
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      radius="xl"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <Button
                      color="navy.7"
                      variant="filled"
                      radius="xl"
                      size="sm"
                      disabled={!chatName.trim()}
                      loading={updateConversationNameMutation.isPending}
                      onClick={() => updateConversationNameMutation.mutate(
                        { id: parseInt(chat_id), newName: chatName.trim() },
                        { onSuccess: () => { setChatName(''); fetchChats() } }
                      )}
                    >
                      Save
                    </Button>
                  </Group>
                </Box>

                <Button
                  fullWidth
                  color="red"
                  variant="light"
                  radius="xl"
                  loading={leaveConversationMutation.isPending}
                  onClick={() => leaveConversationMutation.mutate(parseInt(chat_id), {
                    onSuccess: () => { setInfoModalOpen(false); router.push('/chat') }
                  })}
                >
                  Leave Chat
                </Button>
              </Stack>
            </Modal>

            {/* MESSAGES */}
            <ScrollArea flex={1} p="md" viewportRef={viewport}>
              <Stack gap="md">

                {/* PAGINATION BUTTON */}
                {hasMore && messages.length > 0 && (
                  <Center mb="sm">
                    <Button
                      variant="subtle"
                      size="xs"
                      loading={isLoadingMore}
                      onClick={loadMore}
                    >
                      Load older messages
                    </Button>
                  </Center>
                )}

                {messages.length === 0 && (
                  <Center h={200}>
                    <Text c="dimmed" size="sm">No messages yet. Say hello!</Text>
                  </Center>
                )}

                {messages.map((msg) => {
                  const isMe = msg.sender_id === userId
                  return (
                    <Group key={msg.id} justify={isMe ? 'flex-end' : 'flex-start'} align="flex-end" gap="xs">
                      {!isMe && <Avatar radius="xl" size="md" color="navy.7" />}
                      <Paper
                        p="sm"
                        px="md"
                        radius="lg"
                        bg={isMe ? 'gray.6' : 'navy.3'}
                        c={isMe ? 'navy.0' : 'navy.7'}
                        shadow="sm"
                        style={{ maxWidth: '70%' }}
                      >
                        <Text size="sm">{msg.content}</Text>
                      </Paper>
                    </Group>
                  )
                })}
              </Stack>
            </ScrollArea>

            {/* INPUT */}
            <Paper p="md" withBorder radius="md" bg="gray.2">
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
                  color="navy.7"
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
      </Box>
    </Group>
  )
}
