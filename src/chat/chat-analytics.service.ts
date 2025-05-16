import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from 'src/chat/schemas/conversation.schema';

@Injectable()
export class ChatAnalyticsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ) {}

  async findAllConversationsPerEachCampus() {
    return this.conversationModel.aggregate([
      // Groups conversations by campus_id and counts them.
      {
        $group: {
          _id: '$campus_id',
          conversation_count: { $sum: 1 },
        },
      },
      // Joins the campuses collection to get the campus name.
      {
        $lookup: {
          from: 'campuses',
          localField: '_id',
          foreignField: '_id',
          as: 'campus',
        },
      },
      // Unwinds the campus object. (means that the campus object is flattened)
      {
        $unwind: '$campus',
      },
      // Projects the fields to be returned. (means that the fields that are not mentioned in the project will not be returned)
      {
        $project: {
          _id: 0,
          campus_id: '$_id',
          campus_name: '$campus.name',
          conversation_count: 1,
        },
      },
    ]);
  }

  /**
   * * This function is used to find all conversations per each university
   * REVIEW: In future, we can add further breakdown of how many conversations per each campus of every university are available
   */
  async findAllConversationsPerEachUniversity() {
    return this.conversationModel.aggregate([
      // Use the `campus_id` field of the conversation document to add the matching campus document in the `campus` array
      {
        $lookup: {
          from: 'campuses',
          localField: 'campus_id',
          foreignField: '_id',
          as: 'campus',
        },
      },
      // Flattens the `campus` array by splitting remaining fields into separate documents with each element of the array. (If there is only one element in the array, the flattening will not increase the number of documents in the output and will only return one document with `campus` array converted to a single object.)
      { $unwind: '$campus' },
      // Group by university_id
      {
        $group: {
          // _id: '$campus.university_id', // ! This will fail if the university_id is not an ObjectId
          _id: { $toObjectId: '$campus.university_id' }, // ensures than each university_id is converted to an ObjectId otherwise the following lookup will fail
          conversation_count: { $sum: 1 }, // for each university, count the number of conversations in the `campus` group by counting, 1 for each conversation grouped
        },
      },
      // Retrieves the university info (name) from the `universities` collection
      {
        $lookup: {
          from: 'universities',
          localField: '_id',
          foreignField: '_id',
          as: 'university',
        },
      },
      { $unwind: '$university' },
      // Project the result
      {
        $project: {
          _id: 0,
          university_id: '$_id',
          university_name: '$university.name',
          conversation_count: 1,
        },
      },
    ]);
  }

  /**
   * Returns total chat sessions count and average response time for all conversations of a specific campus
   * @param campusId string (campus ObjectId)
   * @returns { totalChatSessionsCount: number, averageResponseTime: number }
   */
  async getCampusChatResponseAnalytics(campusId: string) {
    // Only include active conversations
    const conversations = await this.conversationModel.find(
      {
        campus_id: campusId,
        is_active: true,
      },
      { sessionsCount: 1, avgResponseTime: 1 },
    );

    let totalChatSessionsCount = 0;
    let totalWeightedResponseTime = 0;
    let totalSessions = 0;

    for (const conv of conversations) {
      const sessions = conv.sessionsCount || 0;
      const avgResp = conv.avgResponseTime || 0;
      totalChatSessionsCount += sessions;
      totalWeightedResponseTime += avgResp * sessions;
      totalSessions += sessions;
    }

    const averageResponseTime =
      totalSessions > 0 ? totalWeightedResponseTime / totalSessions : 0;

    return {
      totalChatSessionsCount,
      averageResponseTime,
    };
  }

  /**
   * Returns total chat sessions count and average response time for all conversations of all campuses of a specific university,
   * along with a breakdown per campus (campus_id, campus_name, totalChatSessionsCount, averageResponseTime)
   * @param universityId string (university ObjectId)
   * @returns { totalChatSessionsCount: number, averageResponseTime: number, campuses: Array<{ campus_id, campus_name, totalChatSessionsCount, averageResponseTime }> }
   */
  async getUniversityChatResponseAnalytics(universityId: string) {
    // Aggregate per campus for the university
    const campuses = await this.conversationModel.aggregate([
      { $match: { is_active: true } },
      {
        $lookup: {
          from: 'campuses',
          localField: 'campus_id',
          foreignField: '_id',
          as: 'campus',
        },
      },
      { $unwind: '$campus' },
      { $match: { 'campus.university_id': universityId } },
      {
        $group: {
          _id: '$campus_id',
          campus_name: { $first: '$campus.name' },
          totalChatSessionsCount: { $sum: { $ifNull: ['$sessionsCount', 0] } },
          totalWeightedResponseTime: {
            $sum: {
              $multiply: [
                { $ifNull: ['$avgResponseTime', 0] },
                { $ifNull: ['$sessionsCount', 0] },
              ],
            },
          },
          totalSessions: { $sum: { $ifNull: ['$sessionsCount', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          campus_id: '$_id',
          campus_name: 1,
          totalChatSessionsCount: 1,
          averageResponseTime: {
            $cond: [
              { $gt: ['$totalSessions', 0] },
              { $divide: ['$totalWeightedResponseTime', '$totalSessions'] },
              0,
            ],
          },
        },
      },
    ]);

    // Calculate overall stats
    let totalChatSessionsCount = 0;
    let totalWeightedResponseTime = 0;
    let totalSessions = 0;
    for (const campus of campuses) {
      totalChatSessionsCount += campus.totalChatSessionsCount;
      totalWeightedResponseTime +=
        campus.averageResponseTime * campus.totalChatSessionsCount;
      totalSessions += campus.totalChatSessionsCount;
    }
    const averageResponseTime =
      totalSessions > 0 ? totalWeightedResponseTime / totalSessions : 0;

    return {
      totalChatSessionsCount,
      averageResponseTime,
      campuses,
    };
  }
}
