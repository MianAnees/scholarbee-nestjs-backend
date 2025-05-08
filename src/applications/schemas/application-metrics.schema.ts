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
    index: 'application_metrics'
})
export class ApplicationMetricsEntity extends BaseEntity {
    /**
     * Unique application identifier.
     * - 'keyword' type for exact match and aggregations.
     */
    @EsField({ type: 'keyword' })
    applicationId: string;

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
        applicationId: { type: 'keyword' },
        step: { type: 'keyword' },
        universityId: { type: 'keyword' },
        programId: { type: 'keyword' },
        timestamp: { type: 'date' },
        eventType: { type: 'keyword' },
        userId: { type: 'keyword' }
    }
}; 