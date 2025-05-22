import common_gateway_events from 'src/common/gateway/common-gateway.constant';

const notification_gateway_events = {
  ...common_gateway_events,
  USER_GLOBAL: 'notification/user/global',
  USER_SPECIFIC: 'notification/user/specific',
  CAMPUS_GLOBAL: 'notification/campus/global',
  CAMPUS_SPECIFIC: 'notification/campus/specific',
} as const;

export default notification_gateway_events;
