import { Types } from 'mongoose';
import { BetterOmit } from 'src/utils/typescript.utils';
import { CampusDocument } from '../../campuses/schemas/campus.schema';
import { UserDocument } from '../../users/schemas/user.schema';
import { Conversation } from './conversation.schema';

export type PopulatedConversationUser = BetterOmit<Conversation, 'user_id'> & {
  user_id: UserDocument;
};
// Type: Conversation with campus_id populated
export type PopulatedConversationCampus = BetterOmit<
  Conversation,
  'campus_id'
> & {
  campus_id: CampusDocument;
};
// Type: Conversation with both user_id and campus_id populated
export type PopulatedConversationAll = BetterOmit<
  Conversation,
  'user_id' | 'campus_id'
> & { user_id: UserDocument; campus_id: CampusDocument };

// Type guard: user_id is populated
export function isPopulatedUser(
  convo: Conversation | any,
): convo is PopulatedConversationUser {
  return (
    typeof convo.user_id === 'object' &&
    convo.user_id !== null &&
    !(convo.user_id instanceof Types.ObjectId)
  );
}
// Type guard: campus_id is populated
export function isPopulatedCampus(
  convo: Conversation | any,
): convo is PopulatedConversationCampus {
  return (
    typeof convo.campus_id === 'object' &&
    convo.campus_id !== null &&
    !(convo.campus_id instanceof Types.ObjectId)
  );
}
// Type guard: both user_id and campus_id are populated
export function isPopulatedAll(
  convo: Conversation | any,
): convo is PopulatedConversationAll {
  return isPopulatedUser(convo) && isPopulatedCampus(convo);
}
