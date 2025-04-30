declare module 'es-mapping-ts' {
  export interface EsFieldOptions {
    type: string;
    name?: string;
    analyzer?: string;
    fields?: Record<string, any>;
    format?: string;
    enabled?: boolean;
    null_value?: string;
    copy_to?: string;
    relations?: Record<string, string>;
    fieldClass?: any;
    [key: string]: any;
  }

  export interface EsEntityOptions {
    index?: string;
    type?: string;
    readonly?: boolean;
    mixins?: any[];
  }

  export function EsField(options: EsFieldOptions): PropertyDecorator;
  export function EsEntity(options?: EsEntityOptions): ClassDecorator;

  export class EsMappingService {
    static getInstance(): EsMappingService;
    getMappings(): Array<{
      index: string;
      body: {
        mappings: Record<string, any>;
      };
    }>;
    uploadMappings(client: any): Promise<void>;
  }
} 