import common_gateway_events from 'src/common/gateway/common-gateway.constant';

const emit_events = {
  ...common_gateway_events.emit_events,
  user_global: 'notification/user/global',
  user_specific: 'notification/user/specific',
  campus_global: 'notification/campus/global',
  campus_specific: 'notification/campus/specific',
} as const;

const notification_gateway_events = {
  emit_events,
} as const;

export default notification_gateway_events;
