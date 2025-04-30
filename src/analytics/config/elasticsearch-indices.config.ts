/**
 * Default Elasticsearch indices names
 */
export enum ES_INDICES {
  PROGRAMS = 'programs',
  UNIVERSITIES = 'universities',
  SEARCH_LOGS = 'search_logs',
  USER_EVENTS = 'user-events',
}

/**
 * Default settings for indices
 */
export const DEFAULT_INDEX_SETTINGS = {
  number_of_shards: 3,
  number_of_replicas: 1,
  analysis: {
    analyzer: {
      autocomplete: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'autocomplete_filter']
      }
    },
    filter: {
      autocomplete_filter: {
        type: 'edge_ngram',
        min_gram: 1,
        max_gram: 20
      }
    }
  }
}; 