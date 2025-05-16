import { EsEntity, EsField } from 'es-mapping-ts';

export class BaseMappingEntity {
  @EsField({
    type: 'date'
  })
  created_at: Date;

  @EsField({
    type: 'date'
  })
  updated_at: Date;

  @EsField({
    type: 'date'
  })
  timestamp: Date;
} 