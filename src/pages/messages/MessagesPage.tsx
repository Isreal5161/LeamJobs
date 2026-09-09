import { type FormEvent, useEffect, useState } from 'react';
import { FaBell, FaBriefcase, FaPaperPlane, FaPhoneAlt, FaSearch, FaVideo } from 'react-icons/fa';
import ApplicantAvatar from '../../components/employer/ApplicantAvatar';
import { useAuth } from '../../context/AuthContext';
import {
  getSeekerConversationMessages,
  getSeekerConversations,
  markSeekerConversationAsRead,
  sendSeekerMessage,
  type SeekerConversation,
  type SeekerMessage,
} from '../../services/api';

type MessageRole = 'seeker' | 'employer';
type MessageSender = 'me' | 'them';

type ChatMessage = {
  sender: MessageSender;
  text: string;
  id?: string;
  createdAt?: string;
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  subject: string;
  initials?: string;
  imageUrl?: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
};

type MessagesPageProps = {
  role: MessageRole;
};

const initialConversations: Record<MessageRole, Conversation[]> = {
  seeker: [
    {
      id: 'leamjobs-studio',
      name: 'LeamJobs Studio',
      role: 'Hiring team',
      subject: 'Senior Product Designer',
      initials: 'LS',
      lastMessage: 'Thanks for applying. Are you available for a quick interview this week?',
      time: '10:42 AM',
      unread: 2,
      messages: [
        { sender: 'them', text: 'Hi Sarah, your product systems work stood out to our team.' },
        { sender: 'me', text: 'Thank you. I would be happy to share more context on the case studies.' },
        { sender: 'them', text: 'Great. Are you available for a quick interview this week?' },
      ],
    },
    {
      id: 'nova-cloud',
      name: 'Nova Cloud',
      role: 'Recruiter',
      subject: 'UX Research Lead',
      initials: 'NC',
      lastMessage: 'We reviewed your CV and would like to keep you in our shortlist.',
      time: 'Yesterday',
      unread: 0,
      messages: [
        { sender: 'them', text: 'We reviewed your CV and would like to keep you in our shortlist.' },
        { sender: 'me', text: 'That sounds good. Please let me know the next step.' },
      ],
    },
  ],
  employer: [
    {
      id: 'sarah-johnson',
      name: 'Sarah Johnson',
      role: 'Senior Product Designer',
      subject: 'Senior Product Designer',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
      lastMessage: 'Thank you. I would be happy to share more context on the case studies.',
      time: '10:42 AM',
      unread: 1,
      messages: [
        { sender: 'me', text: 'Hi Sarah, your product systems work stood out to our team.' },
        { sender: 'them', text: 'Thank you. I would be happy to share more context on the case studies.' },
        { sender: 'me', text: 'Great. Are you available for a quick interview this week?' },
      ],
    },
    {
      id: 'michael-chen',
      name: 'Michael Chen',
      role: 'Frontend Engineer',
      subject: 'Frontend Engineer',
      lastMessage: 'I can send more details about the dashboard performance project.',
      time: 'Mon',
      unread: 0,
      messages: [
        { sender: 'me', text: 'Your React architecture experience is a strong match for our frontend role.' },
        { sender: 'them', text: 'I can send more details about the dashboard performance project.' },
      ],
    },
  ],
};

function MessagesPage({ role }: MessagesPageProps) {
  const { user, token } = useAuth();
  const [conversationState, setConversationState] = useState(initialConversations);
  const [seekerConversations, setSeekerConversations] = useState<SeekerConversation[]>([]);
  const [seekerMessages, setSeekerMessages] = useState<SeekerMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState(role === 'seeker' ? '' : initialConversations[role][0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(role === 'seeker');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [conversationError, setConversationError] = useState('');
  const [conversationRetry, setConversationRetry] = useState(0);
  const [messagesRetry, setMessagesRetry] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const conversations: Conversation[] = role === 'seeker'
    ? seekerConversations.map((conversation) => ({
        id: conversation.id,
        name: conversation.employer.companyName || `${conversation.employer.firstName} ${conversation.employer.lastName}`.trim(),
        role: 'Employer',
        subject: conversation.job?.title || 'Application conversation',
        imageUrl: conversation.employer.companyLogoUrl || undefined,
        lastMessage: conversation.lastMessage?.body || 'No messages yet',
        time: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : '',
        unread: conversation.unreadCount,
        messages: seekerMessages
          .filter((message) => message.conversationId === conversation.id)
          .map((message) => ({ id: message.id, sender: message.senderId === user?.id ? 'me' : 'them', text: message.body, createdAt: message.createdAt })),
      }))
    : conversationState[role];

  useEffect(() => {
    if (role !== 'seeker' || !token) return undefined;
    let isMounted = true;
    setIsLoadingConversations(true);
    setConversationError('');
    void getSeekerConversations(token).then((result) => {
      if (!isMounted) return;
      if (!result.ok) {
        setConversationError(result.error.message || 'We could not load your conversations.');
        setSeekerConversations([]);
      } else {
        setSeekerConversations(result.data.data.conversations);
        setSelectedConversationId((current) => current || result.data.data.conversations[0]?.id || '');
      }
      setIsLoadingConversations(false);
    });
    return () => { isMounted = false; };
  }, [role, token, conversationRetry]);

  useEffect(() => {
    if (role !== 'seeker' || !token || !selectedConversationId) return undefined;
    let isMounted = true;
    setIsLoadingMessages(true);
    setMessagesError('');
    setSeekerMessages([]);
    void Promise.all([
      getSeekerConversationMessages(selectedConversationId, token),
      markSeekerConversationAsRead(selectedConversationId, token),
    ]).then(([messagesResult, readResult]) => {
      if (!isMounted) return;
      if (!messagesResult.ok) {
        setMessagesError(messagesResult.error.message || 'We could not load these messages.');
      } else {
        setSeekerMessages([...messagesResult.data.data.messages].reverse());
        setNextCursor(messagesResult.data.data.nextCursor);
      }
      if (readResult.ok) {
        setSeekerConversations((current) => current.map((conversation) => conversation.id === selectedConversationId ? { ...conversation, unreadCount: readResult.data.data.unreadCount } : conversation));
      }
      setIsLoadingMessages(false);
    });
    return () => { isMounted = false; };
  }, [role, token, selectedConversationId, messagesRetry]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) =>
    [conversation.name, conversation.role, conversation.subject, conversation.lastMessage]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    filteredConversations[0] ??
    conversations[0] ?? {
      id: '', name: '', role: '', subject: '', lastMessage: '', time: '', unread: 0, messages: [],
    };
  const pageClass = role === 'employer' ? 'employer-page' : 'seeker-home';
  const contentClass = role === 'employer' ? 'employer-content' : 'seeker-home__content';
  const heroClass = role === 'employer' ? 'employer-hero employer-hero--compact' : 'seeker-hero messages-hero';
  const panelClass = role === 'employer' ? 'employer-panel' : 'seeker-card';
  const counterpart = role === 'employer' ? 'job seekers' : 'employers';

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (role === 'seeker') return;
    setConversationState((current) => ({
      ...current,
      [role]: current[role].map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation
      ),
    }));
  };

  const handleLoadOlderMessages = async () => {
    if (role !== 'seeker' || !token || !selectedConversationId || !nextCursor || isLoadingMessages) return;
    setIsLoadingMessages(true);
    const result = await getSeekerConversationMessages(selectedConversationId, token, { cursor: nextCursor });
    if (result.ok) {
      setSeekerMessages((current) => [...result.data.data.messages].reverse().concat(current.filter((currentMessage) => !result.data.data.messages.some((message) => message.id === currentMessage.id))));
      setNextCursor(result.data.data.nextCursor);
    } else {
      setMessagesError(result.error.message || 'We could not load older messages.');
    }
    setIsLoadingMessages(false);
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draftMessage.trim();

    if (!text) {
      return;
    }

    if (role === 'seeker' && token && selectedConversationId) {
      setIsSending(true);
      setMessagesError('');
      const clientMessageId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const result = await sendSeekerMessage(selectedConversationId, text, token, clientMessageId);
      setIsSending(false);
      if (!result.ok) {
        setMessagesError(result.error.message || 'Message could not be sent.');
        return;
      }
      setSeekerMessages((current) => current.some((message) => message.id === result.data.data.message.id) ? current : [...current, result.data.data.message]);
      setSeekerConversations((current) => current.map((conversation) => conversation.id === selectedConversationId ? { ...conversation, lastMessage: result.data.data.message, lastMessageAt: result.data.data.message.createdAt } : conversation));
      setDraftMessage('');
      return;
    }

    setConversationState((current) => ({
      ...current,
      [role]: current[role].map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              lastMessage: text,
              time: 'Now',
              messages: [...conversation.messages, { sender: 'me', text }],
            }
          : conversation
      ),
    }));
    setDraftMessage('');
  };

  return (
    <div className={`${pageClass} messages-page`}>
      <section className={heroClass}>
        <div className={role === 'employer' ? 'employer-hero__top' : 'seeker-hero__top'}>
          <div>
            <span className={role === 'employer' ? 'employer-eyebrow' : 'messages-eyebrow'}>Messages</span>
            <h1>Contact {counterpart}</h1>
            <p>Keep conversations, interview updates, and hiring questions in one place.</p>
          </div>
          <button className={role === 'employer' ? 'employer-icon-button' : 'seeker-icon-button'} type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>
      </section>

      <main className={`${contentClass} messages-shell`}>
        <section className={`${panelClass} messages-list-panel`}>
          <label className="messages-search" aria-label="Search conversations">
            <FaSearch />
            <input
              type="search"
              placeholder="Search messages"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="messages-list" aria-busy={role === 'seeker' && isLoadingConversations}>
            {role === 'seeker' && isLoadingConversations ? (
              <>
                <span className="sr-only" role="status" aria-live="polite">Loading conversations</span>
                {[1, 2, 3, 4].map((item) => (
                  <div className="messages-thread-skeleton" key={item} aria-hidden="true">
                    <span className="leamjobs-skeleton-circle messages-thread-skeleton__avatar" />
                    <span className="messages-thread-skeleton__lines">
                      <span className="leamjobs-skeleton-line" style={{ width: '55%' }} />
                      <span className="leamjobs-skeleton-line" style={{ width: '80%' }} />
                    </span>
                  </div>
                ))}
              </>
            ) : null}
            {role === 'seeker' && conversationError ? <p className="messages-empty" role="alert">{conversationError} <button type="button" onClick={() => setConversationRetry((current) => current + 1)}>Retry</button></p> : null}
            {role === 'seeker' && !isLoadingConversations && !conversationError && !filteredConversations.length ? <p className="messages-empty">No conversations yet.</p> : null}
            {filteredConversations.map((conversation) => (
              <button
                className={`messages-thread ${conversation.id === selectedConversationId ? 'messages-thread--active' : ''}`}
                type="button"
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <ApplicantAvatar name={conversation.name} imageUrl={conversation.imageUrl} />
                <span>
                  <strong>{conversation.name}</strong>
                  <small>{conversation.role} / {conversation.subject}</small>
                  <em>{conversation.lastMessage}</em>
                </span>
                <i>
                  {conversation.time}
                  {conversation.unread ? <b>{conversation.unread}</b> : null}
                </i>
              </button>
            ))}
            {role !== 'seeker' && !filteredConversations.length ? (
              <p className="messages-empty">No conversations match your search.</p>
            ) : null}
          </div>
        </section>

        <section className={`${panelClass} messages-chat-panel`}>
          {!selectedConversation.id && role === 'seeker' ? (
            <div className="messages-empty">Select a conversation to start messaging.</div>
          ) : <>
          <div className="messages-chat-header">
            <ApplicantAvatar name={selectedConversation.name} imageUrl={selectedConversation.imageUrl} />
            <div>
              <h2>{selectedConversation.name}</h2>
              <p><FaBriefcase /> {selectedConversation.subject}</p>
            </div>
            <div className="messages-chat-actions">
              <button type="button" aria-label="Start voice call"><FaPhoneAlt /></button>
              <button type="button" aria-label="Start video call"><FaVideo /></button>
            </div>
          </div>

          <div className="messages-chat-body" aria-label={`Conversation with ${selectedConversation.name}`} aria-busy={role === 'seeker' && isLoadingMessages}>
            {role === 'seeker' && isLoadingMessages && !selectedConversation.messages.length ? (
              <>
                <span className="sr-only" role="status" aria-live="polite">Loading messages</span>
                <span className="messages-bubble-skeleton messages-bubble-skeleton--them" style={{ width: '48%' }} aria-hidden="true" />
                <span className="messages-bubble-skeleton messages-bubble-skeleton--me" style={{ width: '38%' }} aria-hidden="true" />
                <span className="messages-bubble-skeleton messages-bubble-skeleton--them" style={{ width: '62%' }} aria-hidden="true" />
                <span className="messages-bubble-skeleton messages-bubble-skeleton--me" style={{ width: '30%' }} aria-hidden="true" />
              </>
            ) : null}
            {role === 'seeker' && messagesError ? <p className="messages-empty" role="alert">{messagesError} <button type="button" onClick={() => setMessagesRetry((current) => current + 1)}>Retry</button></p> : null}
            {role === 'seeker' && !isLoadingMessages && !messagesError && !selectedConversation.messages.length ? <p className="messages-empty">No messages yet. Start the conversation.</p> : null}
            {role === 'seeker' && nextCursor ? (
              <button type="button" onClick={handleLoadOlderMessages} disabled={isLoadingMessages} aria-busy={isLoadingMessages}>
                {isLoadingMessages && selectedConversation.messages.length ? <span className="leamjobs-spinner leamjobs-spinner--accent" aria-hidden="true" /> : null}
                {isLoadingMessages && selectedConversation.messages.length ? 'Loading older messages…' : 'Load older messages'}
              </button>
            ) : null}
            {selectedConversation.messages.map((message, index) => (
              <p className={`messages-bubble messages-bubble--${message.sender}`} key={message.id || `${message.sender}-${index}`}>
                {message.text}
              </p>
            ))}
          </div>

          <form className="messages-composer" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Write a message"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              disabled={role === 'seeker' && (!selectedConversation.id || isSending)}
            />
            <button type="submit" aria-label="Send message" aria-busy={role === 'seeker' && isSending} disabled={role === 'seeker' && (!selectedConversation.id || isSending)}>
              {role === 'seeker' && isSending ? <span className="leamjobs-spinner" aria-hidden="true" /> : <FaPaperPlane />}
            </button>
          </form>
          </>}
        </section>
      </main>
    </div>
  );
}

export default MessagesPage;
