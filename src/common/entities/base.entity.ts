import { EsEntity, EsField } from 'es-mapping-ts';

@EsEntity()
export class BaseEntity {
  @EsField({
    type: 'date'
  })
  created_at: Date;

  @EsField({
    type: 'date'
  })
  updated_at: Date;
} 