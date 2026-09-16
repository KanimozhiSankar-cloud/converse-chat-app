import { useEffect, useMemo, useState } from 'react';
import { MessageCircleMore } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { EmptyState } from '../components/common/EmptyState';
import { useConversations } from '../hooks/useConversations';
import { startPrivateConversation } from '../services/conversationService';
import { getErrorMessage } from '../services/api';

export function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const { conversations, isLoading, error, reload, clearUnread, removeConversation } = useConversations(activeConversationId, setActiveConversationId);

  useEffect(() => {
    if (activeConversationId) clearUnread(activeConversationId);
  }, [activeConversationId, clearUnread]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  function selectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    clearUnread(conversationId);
  }

  async function handleStartConversation(userId: string) {
    setStartError(null);
    try {
      const conversation = await startPrivateConversation(userId);
      await reload();
      selectConversation(conversation._id);
    } catch (err) {
      setStartError(getErrorMessage(err));
    }
  }

  function handleGroupCreated(conversationId: string) {
    reload().then(() => selectConversation(conversationId));
  }

  return (
    <div className="app-shell flex h-screen w-full overflow-hidden p-0 md:p-3">
      <Sidebar
        conversations={conversations}
        isLoadingConversations={isLoading}
        conversationsError={error ?? startError}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onStartConversation={handleStartConversation}
        onGroupCreated={handleGroupCreated}
        isConversationOpen={Boolean(activeConversation)}
      />

      {activeConversation ? (
        <div className="glass-panel flex h-full flex-1 overflow-hidden md:rounded-3xl">
          <ChatWindow key={activeConversation._id} conversation={activeConversation} onBack={() => setActiveConversationId(null)} onConversationDeleted={() => { removeConversation(activeConversation._id); setActiveConversationId(null); }} />
        </div>
      ) : (
        <div className="hidden flex-1 md:block">
          <EmptyState
            icon={<MessageCircleMore className="h-7 w-7" />}
            title="Select a conversation"
            description="Choose a chat from the sidebar, or start a new one from the People tab."
          />
        </div>
      )}
    </div>
  );
}
