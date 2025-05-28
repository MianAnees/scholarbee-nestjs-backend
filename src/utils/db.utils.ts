import { PipelineStage, Types} from "mongoose";

export const toObjectId = (id: string) => {
    return new /* Schema. */Types.ObjectId(id);
}


export const getSortOrder = (sortOrder: 'asc' | 'desc') => {
    return sortOrder == 'asc' ? 1 : -1;
}

// Create the agg pipeline based on the filterPipeline but separate the data and count pipelines
export const getDataAndCountAggPipeline = (
    filterPipeline: PipelineStage[],
    sort: Record<string, any>,
    limit: number,
    skip: number,
    countKey: string = 'total'
) => {
    const dataPipeline: PipelineStage[] = [
        ...filterPipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
    ];
    const countPipeline: PipelineStage[] = [
        ...filterPipeline,
        { $count: countKey }
    ];
    return { dataPipeline, countPipeline };
}