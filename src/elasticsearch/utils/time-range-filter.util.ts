export function getTimeRangeFilter(
    time_range: string | undefined,
    field: string = 'timestamp'
): any | undefined {
    if (time_range === 'weekly') {
        return {
            range: {
                [field]: {
                    gte: 'now-1w/w',
                    lte: 'now/w',
                },
            },
        };
    } else if (time_range === 'monthly') {
        return {
            range: {
                [field]: {
                    gte: 'now-1M/M',
                    lte: 'now/M',
                },
            },
        };
    }
    return undefined;
}
