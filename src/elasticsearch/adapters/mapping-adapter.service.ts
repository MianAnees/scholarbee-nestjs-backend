import { Injectable } from '@nestjs/common';

/**
 * Generic interface for searchable fields
 */
export interface AnalyticFieldMappingConfig {
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
}

/**
 * Generic interface for searchable fields configuration
 */
export interface AnalyzableFieldsConfig {
  [fieldName: string]: AnalyticFieldMappingConfig;
}

@Injectable()
export class MappingAdapterService {
  /**
   * Convert domain-specific searchable fields to Elasticsearch mapping
   */
  convertToElasticsearchMapping(searchableFields: AnalyzableFieldsConfig): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const [fieldName, fieldConfig] of Object.entries(searchableFields)) {
      properties[fieldName] = this.createFieldMapping(fieldName, fieldConfig);
    }

    return { properties };
  }

  /**
   * Create Elasticsearch field mapping based on field configuration
   */
  private createFieldMapping(fieldName: string, fieldConfig: AnalyticFieldMappingConfig): Record<string, any> {
    const mapping: Record<string, any> = {};

    if (fieldConfig.searchable) {
      mapping.type = 'text';
      mapping.analyzer = 'english';
      
      if (fieldConfig.filterable || fieldConfig.sortable) {
        mapping.fields = {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        };
      }
    } else if (fieldConfig.filterable || fieldConfig.sortable) {
      // For date fields
      if (fieldName === 'created_at' || fieldName === 'updated_at') {
        mapping.type = 'date';
      } else {
        mapping.type = 'keyword';
      }
    }

    return mapping;
  }
} 