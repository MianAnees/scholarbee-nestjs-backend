// TODO: Rename file to `common-gateway.constants.ts`

const emit_events = {
  ERROR: 'common/error',
} as const;

const common_gateway_events = {
  emit_events,
} as const;

export default common_gateway_events;
