import { EsEntity, EsField } from 'es-mapping-ts';
import { ApplicationProgressStep } from 'src/analytics/schema/application-metrics.schema';
import { BaseMappingEntity } from 'src/elasticsearch/mappings/base.mapping';
import { ES_INDICES } from 'src/elasticsearch/types/es-indices.enum';
import { UserNS } from 'src/users/schemas/user.schema';

interface IApplicationMetricRegisterEventData {
  step: ApplicationProgressStep;
  universityId: string;
  campusId: string;
  programId: string;
  admissionProgramId: string;
  eventType: string;
}

export interface IApplicationMetricRegisterEventIndexDoc {
  user_type: UserNS.UserType;
  user_id: string;
  data: IApplicationMetricRegisterEventData;
  timestamp?: Date; // should be always auto-added by the elasticsearch service's indexDocument method
}

// -----------------------------------------------------------------------------
// ApplicationMetricsEntity: Elasticsearch mapping for application metrics analytics
// -----------------------------------------------------------------------------
// This entity is designed to store and index application metrics events in Elasticsearch.
// The mapping is optimized for analytics (aggregations, filtering, time series).
//
// Field types:
// - 'keyword': Used for exact matches, filtering, and aggregations (e.g., enums, IDs, categories).
// - 'date': Used for timestamp fields (e.g., event time).
// -----------------------------------------------------------------------------

class ApplicationMetricRegisterEventData {
  @EsField({ type: 'keyword' })
  step: string;

  @EsField({ type: 'keyword' })
  universityId: string;

  @EsField({ type: 'keyword' })
  campusId: string;

  @EsField({ type: 'keyword' })
  programId: string;

  @EsField({ type: 'keyword' })
  admissionProgramId: string;

  @EsField({ type: 'keyword' })
  eventType: string;

  @EsField({ type: 'keyword' })
  userId: string;
}

@EsEntity({
  index: ES_INDICES.APPLICATION_METRICS,
})
export class ApplicationMetricsMappingEntity extends BaseMappingEntity {
  @EsField({ type: 'keyword' })
  user_type: string;

  @EsField({ type: 'keyword' })
  user_id: string;

  @EsField({ type: 'date' })
  timestamp: Date;

  @EsField({
    type: 'object',
    properties: {
      step: { type: 'keyword' },
      universityId: { type: 'keyword' },
      campusId: { type: 'keyword' },
      programId: { type: 'keyword' },
      admissionProgramId: { type: 'keyword' },
      eventType: { type: 'keyword' },
      userId: { type: 'keyword' },
    },
  })
  data: ApplicationMetricRegisterEventData;
}

export const applicationMetricsRawMappings = {
  properties: {
    user_type: { type: 'keyword' },
    user_id: { type: 'keyword' },
    timestamp: { type: 'date' },
    data: {
      properties: {
        step: { type: 'keyword' },
        universityId: { type: 'keyword' },
        campusId: { type: 'keyword' },
        programId: { type: 'keyword' },
        admissionProgramId: { type: 'keyword' },
        eventType: { type: 'keyword' },
        userId: { type: 'keyword' },
      },
    },
  },
}; 