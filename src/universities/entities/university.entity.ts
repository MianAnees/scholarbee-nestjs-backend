import { EsEntity, EsField } from 'es-mapping-ts';
import { BaseMappingEntity } from '../../elasticsearch/mappings/base.mapping';

@EsEntity({
  index: 'universities'
})
export class UniversityEntity extends BaseMappingEntity {
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
  short_name: string;

  @EsField({
    type: 'text',
    analyzer: 'english'
  })
  description: string;

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
  location: string;

  @EsField({
    type: 'keyword'
  })
  country: string;

  @EsField({
    type: 'keyword'
  })
  city: string;
} 