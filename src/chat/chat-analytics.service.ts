import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Conversation, ConversationDocument } from "src/chat/schemas/conversation.schema";

@Injectable()
export class ChatAnalyticsService {
    constructor(
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    ) { }


    async findAllConversationsPerEachCampus() {
        return this.conversationModel.aggregate([
            // Groups conversations by campus_id and counts them.
            {
                $group: {
                    _id: '$campus_id',
                    conversation_count: { $sum: 1 }
                }
            },
            // Joins the campuses collection to get the campus name.
            {
                $lookup: {
                    from: 'campuses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'campus'
                }
            },
            // Unwinds the campus object. (means that the campus object is flattened)
            {
                $unwind: '$campus'
            },
            // Projects the fields to be returned. (means that the fields that are not mentioned in the project will not be returned)
            {
                $project: {
                    _id: 0,
                    campus_id: '$_id',
                    campus_name: '$campus.name',
                    conversation_count: 1
                }
            }
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
                    as: 'campus'
                }
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
                    as: 'university'
                }
            },
            { $unwind: '$university' },
            // Project the result
            {
                $project: {
                    _id: 0,
                    university_id: '$_id',
                    university_name: '$university.name',
                    conversation_count: 1
                }
            }
        ]);
    }

}
