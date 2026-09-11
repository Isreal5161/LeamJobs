import { type FormEvent, type KeyboardEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaBell, FaBriefcase, FaPaperPlane, FaSearch } from 'react-icons/fa';
import ApplicantAvatar from '../../components/employer/ApplicantAvatar';
import { useAuth } from '../../context/AuthContext';
import {
  getEmployerConversationMessages,
  getEmployerConversations,
  getSeekerConversationMessages,
  getSeekerConversations,
  markEmployerConversationAsRead,
  markSeekerConversationAsRead,
  sendEmployerMessage,
  sendSeekerMessage,
  type EmployerConversation,
  type EmployerMessage,
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

function MessagesPage({ role }: MessagesPageProps) {
  const { user, token } = useAuth();
  const [messageSearchParams] = useSearchParams();
  const [seekerConversations, setSeekerConversations] = useState<SeekerConversation[]>([]);
  const [employerConversations, setEmployerConversations] = useState<EmployerConversation[]>([]);
  const [seekerMessages, setSeekerMessages] = useState<SeekerMessage[]>([]);
  const [employerMessages, setEmployerMessages] = useState<EmployerMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
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
      : employerConversations.map((conversation) => ({
          id: conversation.id,
          name: `${conversation.seeker.firstName} ${conversation.seeker.lastName}`.trim(),
          role: conversation.seeker.professionalTitle || 'Job seeker',
          subject: conversation.job?.title || 'Application conversation',
          imageUrl: conversation.seeker.profilePictureUrl || undefined,
          lastMessage: conversation.lastMessage?.body || 'No messages yet',
          time: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : '',
          unread: conversation.unreadCount,
          messages: employerMessages
            .filter((message) => message.conversationId === conversation.id)
            .map((message) => ({ id: message.id, sender: message.senderId === user?.id ? 'me' : 'them', text: message.body, createdAt: message.createdAt })),
        }));

  useEffect(() => {
    if (!token) return undefined;
    let isMounted = true;
    setIsLoadingConversations(true);
    setConversationError('');
    const load = async () => role === 'seeker' ? getSeekerConversations(token) : getEmployerConversations(token);
    void load().then((result) => {
      if (!isMounted) return;
      if (!result.ok) {
        setConversationError(result.error.message || 'We could not load your conversations.');
        setSeekerConversations([]);
      } else {
        if (role === 'seeker') {
          setSeekerConversations(result.data.data.conversations as SeekerConversation[]);
        } else {
          setEmployerConversations(result.data.data.conversations as EmployerConversation[]);
        }
        setSelectedConversationId((current) => current || result.data.data.conversations[0]?.id || '');
      }
      setIsLoadingConversations(false);
    });
    return () => { isMounted = false; };
  }, [role, token, conversationRetry]);

  useEffect(() => {
    const requestedConversationId = messageSearchParams.get('conversationId');
    if (requestedConversationId && conversations.some((conversation) => conversation.id === requestedConversationId)) {
      setSelectedConversationId(requestedConversationId);
    }
  }, [conversations, messageSearchParams]);

  useEffect(() => {
    if (!token || !selectedConversationId) return undefined;
    let isMounted = true;
    setIsLoadingMessages(true);
    setMessagesError('');
    setSeekerMessages([]);
    setEmployerMessages([]);
    const loadMessages = role === 'seeker'
      ? getSeekerConversationMessages(selectedConversationId, token)
      : getEmployerConversationMessages(selectedConversationId, token);
    const markRead = role === 'seeker'
      ? markSeekerConversationAsRead(selectedConversationId, token)
      : markEmployerConversationAsRead(selectedConversationId, token);
    void Promise.all([
      loadMessages,
      markRead,
    ]).then(([messagesResult, readResult]) => {
      if (!isMounted) return;
      if (!messagesResult.ok) {
        setMessagesError(messagesResult.error.message || 'We could not load these messages.');
      } else {
        if (role === 'seeker') setSeekerMessages([...messagesResult.data.data.messages].reverse());
        else setEmployerMessages([...messagesResult.data.data.messages].reverse());
        setNextCursor(messagesResult.data.data.nextCursor);
      }
      if (readResult.ok) {
        if (role === 'seeker') setSeekerConversations((current) => current.map((conversation) => conversation.id === selectedConversationId ? { ...conversation, unreadCount: readResult.data.data.unreadCount } : conversation));
        else setEmployerConversations((current) => current.map((conversation) => conversation.id === selectedConversationId ? { ...conversation, unreadCount: readResult.data.data.unreadCount } : conversation));
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
  };

  const handleLoadOlderMessages = async () => {
    if (!token || !selectedConversationId || !nextCursor || isLoadingMessages) return;
    setIsLoadingMessages(true);
    const result = role === 'seeker'
      ? await getSeekerConversationMessages(selectedConversationId, token, { cursor: nextCursor })
      : await getEmployerConversationMessages(selectedConversationId, token, { cursor: nextCursor });
    if (result.ok) {
      if (role === 'seeker') setSeekerMessages((current) => [...result.data.data.messages].reverse().concat(current.filter((currentMessage) => !result.data.data.messages.some((message) => message.id === currentMessage.id))));
      else setEmployerMessages((current) => [...result.data.data.messages].reverse().concat(current.filter((currentMessage) => !result.data.data.messages.some((message) => message.id === currentMessage.id))));
      setNextCursor(result.data.data.nextCursor);
    } else {
      setMessagesError(result.error.message || 'We could not load older messages.');
    }
    setIsLoadingMessages(false);
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draftMessage.trim();

    if (!text || isSending) {
      return;
    }

    if (token && selectedConversationId) {
      setIsSending(true);
      setMessagesError('');
      const clientMessageId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const result = role === 'seeker'
        ? await sendSeekerMessage(selectedConversationId, text, token, clientMessageId)
        : await sendEmployerMessage(selectedConversationId, text, token, clientMessageId);
      setIsSending(false);
      if (!result.ok) {
        setMessagesError(result.error.message || 'Message could not be sent.');
        return;
      }
      if (role === 'seeker') {
        setSeekerMessages((current) => current.some((message) => message.id === result.data.data.message.id) ? current : [...current, result.data.data.message]);
        setSeekerConversations((current) => current.map((conversation) => conversation.id === selectedConversationId ? { ...conversation, lastMessage: result.data.data.message, lastMessageAt: result.data.data.message.createdAt } : conversation));
      } else {
        setEmployerMessages((current) => current.some((message) => message.id === result.data.data.message.id) ? current : [...current, result.data.data.message]);
        setEmployerConversations((current) => current.map((conversation) => conversation.id === selectedConversationId ? { ...conversation, lastMessage: result.data.data.message, lastMessageAt: result.data.data.message.createdAt } : conversation));
      }
      setDraftMessage('');
      return;
    }

  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
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

          <div className="messages-list" aria-busy={isLoadingConversations}>
            {isLoadingConversations ? (
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
            {conversationError ? <p className="messages-empty" role="alert">{conversationError} <button type="button" onClick={() => setConversationRetry((current) => current + 1)}>Retry</button></p> : null}
            {!isLoadingConversations && !conversationError && !filteredConversations.length ? <p className="messages-empty">No conversations yet.</p> : null}
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
            {!isLoadingConversations && !conversationError && filteredConversations.length === 0 && searchTerm ? <p className="messages-empty">No conversations match your search.</p> : null}
          </div>
        </section>

        <section className={`${panelClass} messages-chat-panel`}>
          {!selectedConversation.id ? (
            <div className="messages-empty">Select a conversation to start messaging.</div>
          ) : <>
          <div className="messages-chat-header">
            <ApplicantAvatar name={selectedConversation.name} imageUrl={selectedConversation.imageUrl} />
            <div className="messages-chat-header__copy">
              <h2>{selectedConversation.name}</h2>
              <p><FaBriefcase /> {selectedConversation.subject}</p>
            </div>
          </div>

          <div className="messages-chat-body" aria-label={`Conversation with ${selectedConversation.name}`} aria-busy={isLoadingMessages}>
            {isLoadingMessages && !selectedConversation.messages.length ? (
              <>
                <span className="sr-only" role="status" aria-live="polite">Loading messages</span>
                <span className="messages-bubble-skeleton messages-bubble-skeleton--them" style={{ width: '48%' }} aria-hidden="true" />
                <span className="messages-bubble-skeleton messages-bubble-skeleton--me" style={{ width: '38%' }} aria-hidden="true" />
                <span className="messages-bubble-skeleton messages-bubble-skeleton--them" style={{ width: '62%' }} aria-hidden="true" />
                <span className="messages-bubble-skeleton messages-bubble-skeleton--me" style={{ width: '30%' }} aria-hidden="true" />
              </>
            ) : null}
            {messagesError ? <p className="messages-empty" role="alert">{messagesError} <button type="button" onClick={() => setMessagesRetry((current) => current + 1)}>Retry</button></p> : null}
            {!isLoadingMessages && !messagesError && !selectedConversation.messages.length ? <p className="messages-empty">No messages yet. Start the conversation.</p> : null}
            {nextCursor ? (
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
            <textarea
              rows={2}
              aria-label="Message"
              aria-describedby="messages-composer-help"
              placeholder="Write a message"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              disabled={!selectedConversation.id || isSending}
            />
            <div className="messages-composer__action">
              <span id="messages-composer-help" className="messages-composer__hint">Ctrl+Enter to send</span>
              <button type="submit" aria-label="Send message" aria-busy={isSending} disabled={!selectedConversation.id || isSending || !draftMessage.trim()}>
                {isSending ? <span className="leamjobs-spinner" aria-hidden="true" /> : <FaPaperPlane />}
                <span>{isSending ? 'Sending' : 'Send'}</span>
              </button>
            </div>
          </form>
          </>}
        </section>
      </main>
    </div>
  );
}

export default MessagesPage;
