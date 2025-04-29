/**
 * Default Elasticsearch configuration values and constants
 */

export const DEFAULT_ES_NODE = 'http://localhost:9200';
export const DEFAULT_ES_INDICES = {
  PROGRAMS: 'programs',
  UNIVERSITIES: 'universities',
  SEARCH_LOGS: 'search_logs',
  USER_EVENTS: 'user-events',
};

/**
 * Default mapping for programs index
 */
export const PROGRAM_MAPPING = {
  properties: {
    name: {
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        },
        search: {
          type: 'text',
          analyzer: 'standard'
        }
      }
    },
    major: {
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        },
        search: {
          type: 'text',
          analyzer: 'standard'
        }
      }
    },
    degree_level: {
      type: 'keyword'
    },
    mode_of_study: {
      type: 'keyword'
    },
    campus_id: {
      type: 'keyword'
    },
    university_id: {
      type: 'keyword'
    },
    academic_departments: {
      type: 'keyword'
    },
    description: {
      type: 'text',
      analyzer: 'english'
    },
    created_at: {
      type: 'date'
    },
    updated_at: {
      type: 'date'
    }
  }
};

/**
 * Default mapping for universities index
 */
export const UNIVERSITY_MAPPING = {
  properties: {
    name: {
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        },
        search: {
          type: 'text',
          analyzer: 'standard'
        }
      }
    },
    short_name: {
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    description: {
      type: 'text',
      analyzer: 'english'
    },
    location: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    country: {
      type: 'keyword'
    },
    city: {
      type: 'keyword'
    },
    created_at: {
      type: 'date'
    },
    updated_at: {
      type: 'date'
    }
  }
};

/**
 * Default mapping for search logs index
 */
export const SEARCH_LOGS_MAPPING = {
  properties: {
    query: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    filters: {
      type: 'object',
      enabled: true
    },
    entity_type: {
      type: 'keyword'
    },
    timestamp: {
      type: 'date'
    },
    user_id: {
      type: 'keyword'
    },
    results_count: {
      type: 'integer'
    },
    selected_results: {
      type: 'keyword'
    },
    session_id: {
      type: 'keyword'
    },
    client_info: {
      type: 'object',
      enabled: true
    }
  }
};

/**
 * Default mapping for user events index
 */
export const USER_EVENTS_MAPPING = {
  properties: {
    timestamp: {
      type: 'date'
    },
    studentId: {
      type: 'keyword'
    },
    eventType: {
      type: 'keyword'
    },
    eventData: {
      type: 'object',
      enabled: true,
      properties: {
        major: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256
            }
          }
        },
        degree_level: {
          type: 'keyword'
        },
        university_id: {
          type: 'keyword'
        },
        program_id: {
          type: 'keyword'
        },
        filters: {
          type: 'object',
          enabled: true
        },
        results_count: {
          type: 'integer'
        },
        selected_results: {
          type: 'keyword'
        },
        source: {
          type: 'keyword'
        },
        referral_code: {
          type: 'keyword'
        },
        marketing_channel: {
          type: 'keyword'
        }
      }
    }
  }
};

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