const emit_events = {
  new_message: 'new_message',
  new_message_notification: 'new_message_notification',
  conversation_message: (conversationId: string) =>
    `conversation_message_${conversationId}`, // TODO: this should be used by the client to listen for the conversation events
} as const;

const subscription_events = {
  join_conversation: 'join_conversation',
} as const;

const rooms = {
  conversation: (conversationId: string) => `conversation_${conversationId}`,
} as const;

const chat_gateway_constants = {
  emit_events,
  subscription_events,
  rooms,
};

export default chat_gateway_constants;
