import { useState } from "react";
import { useChat } from "../hooks/useChat";

export default function Chat({ currentUserId, receiverId }) {
  const [text, setText] = useState("");
  const { messages, error, sendTextMessage, sendFileMessage, removeMessage } =
    useChat(currentUserId);

  const conversation = messages.filter(
    (m) =>
      (m.senderId === currentUserId && m.receiverId === receiverId) ||
      (m.senderId === receiverId && m.receiverId === currentUserId)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendTextMessage(receiverId, text);
    setText("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) sendFileMessage(receiverId, file);
    e.target.value = "";
  };

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {conversation.map((m) => (
          <li key={m.messageId}>
            {m.messageType === "text" && <span>{m.content}</span>}
            {m.messageType === "image" && (
              <img src={`http://localhost:3000${m.fileUrl}`} alt={m.fileName} width={200} />
            )}
            {m.messageType === "file" && (
              <a href={`http://localhost:3000${m.fileUrl}`} download>
                {m.fileName}
              </a>
            )}
            {m.senderId === currentUserId && (
              <button onClick={() => removeMessage(m.messageId)}>Delete</button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." />
        <button type="submit">Send</button>
        <input type="file" onChange={handleFileChange} />
      </form>
    </div>
  );
}