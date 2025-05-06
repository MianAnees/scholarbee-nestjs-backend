import { EsEntity, EsField } from "es-mapping-ts";
import { BaseEntity } from "src/common/entities/base.entity";
import { LastDegreeLevelEnum } from "src/student-scholarships/schemas/student-scholarship.schema";

export enum UserTypeEnum {
    STUDENT = 'student',
    ADMIN = 'admin',
    CAMPUS_ADMIN = 'campus_admin',
}

// TODO: Should be mapped to the schema model names
export enum SearchResourceEnum {
    PROGRAM = 'program',
    UNIVERSITY = 'university',
    CAMPUS = 'campus',
}

interface ISearchHistoryData {
    university_name: string;
    program_name: string;
    degree_level: LastDegreeLevelEnum; // TODO: Create a main "degree level" enum and use it here
    major: string; // TODO: Create a main "major" enum, restrict the data entry to only the values in the enum and then use it here
    university_id: string;
    program_id: string;
    mode_of_study: string;
}
export interface ISearchHistory {
    timestamp: Date;
    resource_type: SearchResourceEnum;
    user_type: UserTypeEnum;
    user_id: string;
    data: Partial<ISearchHistoryData>;
}

// -----------------------------------------------------------------------------
// SearchHistoryEntity: Elasticsearch mapping for user search history analytics
// -----------------------------------------------------------------------------
// This entity is designed to store and index user search history events in Elasticsearch.
// The mapping is optimized for both analytics (aggregations, filtering) and search (full-text queries).
//
// Field types:
// - 'keyword': Used for exact matches, filtering, and aggregations (e.g., enums, IDs, categories).
// - 'text': Used for full-text search (e.g., names, descriptions). Often paired with a 'keyword' subfield for aggregations.
//
// This structure enables insights such as most searched programs, majors, or universities, and supports flexible querying.
// -----------------------------------------------------------------------------

@EsEntity({
    index: 'search-history'
})
export class SearchHistoryEntity extends BaseEntity {
    /**
     * The name of the program or university searched for.
     * - 'text' type allows full-text search (e.g., partial matches, relevance ranking).
     * - 'keyword' subfield enables exact match and aggregations (e.g., most searched names).
     */
    @EsField({
        type: 'text',
        analyzer: 'english',
        fields: {
            keyword: {
                type: 'keyword',
                ignore_above: 256
            }
        }
    })
    name: string;

    /**
     * The major (field of study) associated with the search.
     * - 'text' type for flexible search.
     * - 'keyword' subfield for aggregations (e.g., most popular majors).
     */
    @EsField({
        type: 'text',
        analyzer: 'english',
        fields: {
            keyword: {
                type: 'keyword',
                ignore_above: 256
            }
        }
    })
    major: string;

    /**
     * The degree level (e.g., Bachelor, Master, PhD).
     * - 'keyword' type for exact match and aggregations (e.g., most searched degree levels).
     */
    @EsField({
        type: 'keyword'
    })
    degree_level: string;

    /**
     * The mode of study (e.g., full-time, part-time).
     * - 'keyword' type for filtering and aggregations.
     */
    @EsField({
        type: 'keyword'
    })
    mode_of_study: string;

    /**
     * The campus identifier related to the search.
     * - 'keyword' type for exact match and aggregations.
     */
    @EsField({
        type: 'keyword'
    })
    campus_id: string;

    /**
     * The university identifier related to the search.
     * - 'keyword' type for exact match and aggregations.
     */
    @EsField({
        type: 'keyword'
    })
    university_id: string;

    /**
     * List of academic departments associated with the search.
     * - 'keyword' type for each department, enabling filtering and aggregations.
     */
    @EsField({
        type: 'keyword'
    })
    academic_departments: string[];

    /**
     * Free-text description or additional context for the search.
     * - 'text' type for full-text search and flexible querying.
     */
    @EsField({
        type: 'text',
        analyzer: 'english'
    })
    description: string;
} 



export const searchHistoryMappings = {
  properties: {
    academic_departments: {
      type: 'keyword'
    },
    campus_id: {
      type: 'keyword'
    },
    degree_level: {
      type: 'keyword'
    },
    description: {
      type: 'text',
      analyzer: 'english'
    },
    major: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      },
      analyzer: 'english'
    },
    mode_of_study: {
      type: 'keyword'
    },
    name: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      },
      analyzer: 'english'
    },
    university_id: {
      type: 'keyword'
    }
  }
};