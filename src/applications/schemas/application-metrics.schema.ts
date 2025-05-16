import { EsEntity, EsField } from 'es-mapping-ts';
import { BaseEntity } from 'src/common/entities/base.entity';


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

@EsEntity({
  index: 'application_metrics',
})
export class ApplicationMetricsEntity extends BaseEntity {
  /**
   * Step in the application process (enum).
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  step: string;

  /**
   * University identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  universityId: string;

  /**
   * Program identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  programId: string;

  /**
   * Campus identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  campusId: string;

  /**
   * Admission program identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  admissionProgramId: string;

  /**
   * Timestamp of the event.
   * - 'date' type for time series analytics.
   */
  @EsField({ type: 'date' })
  timestamp: Date;

  /**
   * Event type (e.g., 'navigate').
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  eventType: string;

  /**
   * User identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  userId: string;
}

export const applicationMetricsMappings = {
  properties: {
    universityId: { type: 'keyword' },
    campusId: { type: 'keyword' },
    programId: { type: 'keyword' },
    admissionProgramId: { type: 'keyword' },
    eventType: { type: 'keyword' },
    step: { type: 'keyword' },
    userId: { type: 'keyword' },
    timestamp: { type: 'date' },
  },
}; 


export enum ApplicationProgressStep {
    APPLICATION_START = 'application/start',
    PROFILE_SELF = 'profile/self',
    PROFILE_CONTACT = 'profile/contact',
    PROFILE_EDUCATION = 'profile/education',
    PROFILE_DOCS = 'profile/docs',
    APPLICATION_PROGRAM_SELECTION = 'application/program_selection',
    APPLICATION_COMPLETE = 'application/complete',
}
