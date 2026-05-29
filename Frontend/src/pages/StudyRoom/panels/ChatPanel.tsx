import React, { useState, useEffect, useRef } from 'react';
import { Message as MessageComponent } from '../components/Message';
import { useRoomStore } from '../../../store/room.store';
import styles from '../StudyRoom.module.css';

interface ChatPanelProps {
  sendMessage: (content: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messages = useRoomStore((state) => state.messages);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className={styles.centerPanel} id="chat-panel">
      {/* Messages Log */}
      <div className={styles.chatLog}>
        {messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <p className={styles.emptyChatText}>No messages yet. Send a note to start collaborating.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            // Show sender if it's the first message or different sender than previous
            const showSender = !prevMsg || prevMsg.userId !== msg.userId;

            return (
              <MessageComponent
                key={msg.id || index}
                message={msg}
                showSender={showSender}
              />
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Tray */}
      <form className={styles.inputTray} onSubmit={handleSend}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.chatInput}
          placeholder="Type a message (Enter to send)..."
          rows={1}
          id="chat-input-textarea"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!inputText.trim()}
          id="chat-send-btn"
        >
          Send
        </button>
      </form>
    </div>
  );
};
