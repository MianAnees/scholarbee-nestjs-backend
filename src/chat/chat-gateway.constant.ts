const emit_events = {
  notification_message: 'chat/notification/message',

  // Previously: `new_message`
  conversation_message_at_id: (conversationId: string) =>
    `chat/conversation/${conversationId}/message`, // TODO: this should be used by the client to listen for the conversation events
} as const;

const subscription_events = {
  join_conversation: 'join/conversation',
} as const;

const rooms = {
  conversation: (conversationId: string) =>
    `room/conversation/${conversationId}`,
} as const;

const chat_gateway_constants = {
  emit_events,
  subscription_events,
  rooms,
};

export default chat_gateway_constants;