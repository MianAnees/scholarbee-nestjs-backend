import { EsEntity, EsField } from "es-mapping-ts";
import { DegreeLevelEnum } from 'src/common/constants/shared.constants';
import { BaseMappingEntity } from 'src/elasticsearch/mappings/base.mapping';
import { ES_INDICES } from 'src/elasticsearch/types/es-indices.enum';
import { UserNS } from 'src/users/schemas/user.schema';

// TODO: Should be mapped to the schema model names
export enum SearchResourceEnum {
  PROGRAM = 'program',
  ADMISSION_PROGRAM = 'admission_program',
  UNIVERSITY = 'university',
  CAMPUS = 'campus',
}

interface ISearchHistoryData {
  university_id?: string;
  university_name?: string;

  campus_id?: string;
  campus_name?: string;

  program_id?: string;
  program_name?: string;

  degree_level?: string | DegreeLevelEnum; // TODO: Create a main "degree level" enum and use it here
  major?: string; // TODO: Create a main "major" enum, restrict the data entry to only the values in the enum and then use it here
  mode_of_study?: string;
}
export interface ISearchHistoryIndexDoc {
  resource_type: SearchResourceEnum;
  user_type: UserNS.UserType;
  user_id: string;
  data: Partial<ISearchHistoryData>;
  timestamp?: Date;
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

class SearchHistoryData {
  @EsField({ type: 'keyword' })
  university_id?: string;

  @EsField({ type: 'keyword' })
  university_name?: string;

  @EsField({ type: 'keyword' })
  campus_id?: string;

  @EsField({ type: 'keyword' })
  campus_name?: string;

  @EsField({ type: 'keyword' })
  program_id?: string;

  @EsField({ type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } }, analyzer: 'english' })
  program_name?: string;

  @EsField({ type: 'keyword' })
  degree_level?: string;

  @EsField({ type: 'keyword' })
  major?: string;

  @EsField({ type: 'keyword' })
  mode_of_study?: string;
}

@EsEntity({
  index: ES_INDICES.SEARCH_HISTORY,
})
export class SearchHistoryMappingEntity extends BaseMappingEntity {
  @EsField({ type: 'keyword' })
  resource_type: string;

  @EsField({ type: 'keyword' })
  user_type: string;

  @EsField({ type: 'keyword' })
  user_id: string;

  @EsField({ type: 'date' })
  timestamp: Date;

  @EsField({
    type: 'object',
    properties: {
      university_id: { type: 'keyword' },
      university_name: { type: 'keyword' },
      campus_id: { type: 'keyword' },
      campus_name: { type: 'keyword' },
      program_id: { type: 'keyword' },
      program_name: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } }, analyzer: 'english' },
      degree_level: { type: 'keyword' },
      major: { type: 'keyword' },
      mode_of_study: { type: 'keyword' },
    },
  })
  data: SearchHistoryData;
}

export const searchHistoryRawMappings = {
  properties: {
    resource_type: { type: 'keyword' },
    user_type: { type: 'keyword' },
    user_id: { type: 'keyword' },
    timestamp: { type: 'date' },
    data: {
      properties: {
        // ? Query: Find all docs for "stanford-123".
        university_id: { type: 'keyword' },
        university_name: { type: 'keyword' },
        campus_id: { type: 'keyword' },
        campus_name: { type: 'keyword' },
        program_id: { type: 'keyword' },
        // ? Query: Search for "engineering" (matches "Mechanical Engineering").
        // ? Query: Get the most common program names (use "program_name.keyword" in aggregation).
        program_name: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } }, analyzer: 'english' },
        degree_level: { type: 'keyword' },
        major: { type: 'keyword' },
        mode_of_study: { type: 'keyword' },
      },
    },
  },
};