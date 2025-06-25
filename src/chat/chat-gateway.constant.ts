import common_gateway_events from 'src/common/gateway/common-gateway.constant';

const emit_events = {
  ...common_gateway_events.emit_events,
  notification_message: 'chat/notification/message',

  // Previously: `new_message`
  // TODO: Change this to generic `active_conversation_message`
  conversation_message: `chat/conversation/message`, // TODO: this should be used by the client to listen for the conversation events
} as const;

const subscription_events = {
  join_conversation: 'join/conversation',
  leave_conversation: 'leave/conversation',
  change_conversation: 'change/conversation',
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
