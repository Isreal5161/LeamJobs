import { type FormEvent, useState } from 'react';
import { FaBell, FaBriefcase, FaPaperPlane, FaPhoneAlt, FaSearch, FaVideo } from 'react-icons/fa';
import ApplicantAvatar from '../../components/employer/ApplicantAvatar';

type MessageRole = 'seeker' | 'employer';
type MessageSender = 'me' | 'them';

type ChatMessage = {
  sender: MessageSender;
  text: string;
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
  const [conversationState, setConversationState] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[role][0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const conversations = conversationState[role];
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
    conversations[0];
  const pageClass = role === 'employer' ? 'employer-page' : 'seeker-home';
  const contentClass = role === 'employer' ? 'employer-content' : 'seeker-home__content';
  const heroClass = role === 'employer' ? 'employer-hero employer-hero--compact' : 'seeker-hero messages-hero';
  const panelClass = role === 'employer' ? 'employer-panel' : 'seeker-card';
  const counterpart = role === 'employer' ? 'job seekers' : 'employers';

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setConversationState((current) => ({
      ...current,
      [role]: current[role].map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation
      ),
    }));
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draftMessage.trim();

    if (!text) {
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

          <div className="messages-list">
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
            {!filteredConversations.length ? (
              <p className="messages-empty">No conversations match your search.</p>
            ) : null}
          </div>
        </section>

        <section className={`${panelClass} messages-chat-panel`}>
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

          <div className="messages-chat-body" aria-label={`Conversation with ${selectedConversation.name}`}>
            {selectedConversation.messages.map((message, index) => (
              <p className={`messages-bubble messages-bubble--${message.sender}`} key={`${message.sender}-${index}`}>
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
            />
            <button type="submit" aria-label="Send message"><FaPaperPlane /></button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default MessagesPage;
