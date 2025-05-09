import { EsEntity, EsField } from 'es-mapping-ts';
import { BaseEntity } from '../../common/entities/base.entity';

@EsEntity({
  index: 'programs'
})
export class ProgramEntity extends BaseEntity {
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
  major: string;

  @EsField({
    type: 'keyword'
  })
  degree_level: string;

  @EsField({
    type: 'keyword'
  })
  mode_of_study: string;

  @EsField({
    type: 'keyword'
  })
  campus_id: string;

  @EsField({
    type: 'keyword'
  })
  university_id: string;

  @EsField({
    type: 'keyword'
  })
  academic_departments: string[];

  @EsField({
    type: 'text',
    analyzer: 'english'
  })
  description: string;
} 