import { EsEntity, EsField } from 'es-mapping-ts';
import { BaseMappingEntity } from 'src/elasticsearch/mappings/base.mapping';
import { ES_INDICES } from 'src/elasticsearch/mappings/es-indices.enum';


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
  index: ES_INDICES.APPLICATION_METRICS,
})
export class ApplicationMetricsMappingEntity extends BaseMappingEntity {

  /**
   * University identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  universityId: string;

  /**
   * Campus identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  campusId: string;

  /**
   * Program identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  programId: string;

  /**
   * Admission program identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  admissionProgramId: string;

  /**
   * Event type (e.g., 'navigate').
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  eventType: string;

  /**
   * Step in the application process (enum).
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  step: string;

  /**
   * User identifier.
   * - 'keyword' type for exact match and aggregations.
   */
  @EsField({ type: 'keyword' })
  userId: string;

}

export const applicationMetricsRawMappings = {
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

