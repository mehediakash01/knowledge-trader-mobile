import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import {
  useGetChatMessagesQuery,
  useSendChatMessageMutation,
  type IChatMessage,
} from '../../redux/api/chatApi';
import { getAccessToken } from '../../services/auth.service';
import { resolveSocketBaseUrl } from '../../lib/runtimeUrls';

// Socket.io — dynamic import (same pattern as reference SocketContext.tsx)
let socketInstance: any = null;

// ── Message Bubble ────────────────────────────────────────────────────────────

interface BubbleProps {
  msg: IChatMessage;
  isMine: boolean;
}

function Bubble({ msg, isMine }: BubbleProps) {
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      {/* Avatar — only show for received messages */}
      {!isMine && (
        msg.sender?.image ? (
          <Image source={{ uri: msg.sender.image }} style={styles.bubbleAvatar} />
        ) : (
          <View style={styles.bubbleAvatarPlaceholder}>
            <Text style={styles.bubbleAvatarText}>
              {msg.sender?.name ? msg.sender.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )
      )}

      <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
        {/* Sender name for received */}
        {!isMine && msg.sender?.name && (
          <Text style={styles.bubbleSenderName}>{msg.sender.name}</Text>
        )}
        <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

// ── System / Status message ───────────────────────────────────────────────────

function SystemMsg({ text }: { text: string }) {
  return (
    <View style={styles.sysMsgRow}>
      <Text style={styles.sysMsgText}>{text}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const router = useRouter();
  const {
    id: barterId,
    partnerName,
    skillTitle,
  } = useLocalSearchParams<{ id: string; partnerName?: string; skillTitle?: string }>();

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const flatRef = useRef<FlatList<IChatMessage>>(null);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<IChatMessage[]>([]);

  // ── RTK Query ──────────────────────────────────────────────────────────────
  const {
    data: fetchedMessages,
    isLoading,
    isError,
    refetch,
  } = useGetChatMessagesQuery(barterId as string, {
    skip: !barterId,
    pollingInterval: socketConnected ? 0 : 8000, // poll when socket down
  });

  const [sendMessage, { isLoading: isSending }] = useSendChatMessageMutation();

  // Sync fetched messages → local state
  useEffect(() => {
    if (fetchedMessages) {
      setLocalMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // ── Socket.io setup (mirrors SocketContext.tsx pattern exactly) ────────────
  useEffect(() => {
    if (!barterId || !currentUser) return;

    let socket: any;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const { io } = await import('socket.io-client');
        const backendUrl = resolveSocketBaseUrl();

        socket = io(backendUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
        });

        socketInstance = socket;

        socket.on('connect', () => {
          setSocketConnected(true);
          // Join this barter's chat room
          socket.emit('join-chat', { barterId });
        });

        socket.on('disconnect', () => {
          setSocketConnected(false);
        });

        // Listen for new chat messages on this barter
        socket.on('chat-message', (msg: IChatMessage) => {
          setLocalMessages((prev) => {
            // Deduplicate by id
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        });
      } catch {
        // socket.io-client unavailable — polling fallback continues
      }
    })();

    return () => {
      if (socket) {
        socket.emit('leave-chat', { barterId });
        socket.disconnect();
        socketInstance = null;
      }
    };
  }, [barterId, currentUser]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (flatRef.current && localMessages.length > 0) {
        flatRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [localMessages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages.length]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

    setInputText('');

    // Optimistic bubble
    const optimistic: IChatMessage = {
      id: `optimistic-${Date.now()}`,
      barterId: barterId as string,
      senderId: currentUser?.id ?? '',
      content,
      createdAt: new Date().toISOString(),
      sender: { id: currentUser?.id ?? '', name: currentUser?.name ?? 'You' },
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      const saved = await sendMessage({
        barterId: barterId as string,
        content,
      }).unwrap();

      // Replace optimistic with real message
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m)),
      );

      // Emit to socket room so partner sees it in real-time
      if (socketInstance?.connected) {
        socketInstance.emit('send-chat-message', { barterId, message: saved });
      }
    } catch {
      // Revert optimistic on failure
      setLocalMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(content);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: IChatMessage }) => (
      <Bubble msg={item} isMine={item.senderId === currentUser?.id} />
    ),
    [currentUser?.id],
  );

  const renderEmpty = () => (
    <SystemMsg text="No messages yet. Start the negotiation below 👇" />
  );

  // ── Loading / error states ─────────────────────────────────────────────────

  if (isLoading && localMessages.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" size="large" />
        <Text style={styles.loadingText}>Loading conversation…</Text>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerMid}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {partnerName ?? 'Trade Negotiation'}
          </Text>
          {skillTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              re: {skillTitle}
            </Text>
          ) : null}
        </View>

        {/* Connection dot */}
        <View style={[styles.statusDot, socketConnected ? styles.dotGreen : styles.dotGrey]} />
      </View>

      {/* Error banner */}
      {isError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ Could not load messages.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Message list ── */}
      <FlatList
        ref={flatRef}
        data={localMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          skillTitle ? (
            <SystemMsg text={`Negotiating trade for: "${skillTitle}"`} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* ── Input bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message…"
          placeholderTextColor="#444"
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const MINE_BG    = '#0ea5e9';
const THEIRS_BG  = '#1a1a1a';
const MINE_TEXT  = '#ffffff';
const THEIRS_TEXT = '#e5e5e5';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0d0d',
    gap: 12,
  },
  loadingText: {
    color: '#555',
    fontSize: 13,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    gap: 10,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  backText: {
    color: '#0ea5e9',
    fontSize: 22,
    fontWeight: '600',
  },
  headerMid: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#555',
    fontSize: 11,
    marginTop: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: { backgroundColor: '#4ade80' },
  dotGrey: { backgroundColor: '#333' },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#991b1b',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBannerText: { color: '#f87171', fontSize: 12 },
  retryText: { color: '#0ea5e9', fontSize: 12, fontWeight: '600' },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },

  // System message
  sysMsgRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  sysMsgText: {
    color: '#444',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 17,
  },

  // Bubble rows
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '80%',
  },
  bubbleRowMine: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubbleRowTheirs: {
    alignSelf: 'flex-start',
  },

  // Avatars
  bubbleAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    alignSelf: 'flex-end',
  },
  bubbleAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    alignSelf: 'flex-end',
  },
  bubbleAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Bubble wrap
  bubbleWrap: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '100%',
  },
  bubbleWrapMine: {
    backgroundColor: MINE_BG,
    borderBottomRightRadius: 4,
  },
  bubbleWrapTheirs: {
    backgroundColor: THEIRS_BG,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bubbleSenderName: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: MINE_TEXT,
  },
  bubbleTextTheirs: {
    color: THEIRS_TEXT,
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 4,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',
  },
  bubbleTimeTheirs: {
    color: '#444',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#1e3a50',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
});
