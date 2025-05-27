import { Types} from "mongoose";

export const toObjectId = (id: string) => {
    return new /* Schema. */Types.ObjectId(id);
}