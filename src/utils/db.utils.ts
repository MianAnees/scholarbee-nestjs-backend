import { PipelineStage, Types } from 'mongoose';

export const stringToObjectId = (id: string) => {
  return new /* Schema. */ Types.ObjectId(id);
};

export const verifyStringObjectId = (id: string) => {
  return Types.ObjectId.isValid(id);
};

export const getSortOrder = (sortOrder: 'asc' | 'desc') => {
  return sortOrder == 'asc' ? 1 : -1;
};

// Create the agg pipeline based on the filterPipeline but separate the data and count pipelines
export const getDataAndCountAggPipeline = (
  filterPipeline: PipelineStage[],
  sort: Record<string, any>,
  limit: number,
  skip: number,
  countKey: string = 'total',
) => {
  const dataPipeline: PipelineStage[] = [
    ...filterPipeline,
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
  ];
  const countPipeline: PipelineStage[] = [
    ...filterPipeline,
    { $count: countKey },
  ];
  return { dataPipeline, countPipeline };
};

/**
 * Escapes a string for use in a regular expression pattern for MongoDB queries.
 *
 * ## Why this utility exists:
 * When using user input in MongoDB $regex queries, special regex characters (such as (), [], ., *, +, ?, etc.)
 * can change the meaning of the search or even break the query. This utility ensures that user input is treated as a literal string,
 * not as a regex pattern, by escaping all special regex characters.
 *
 * ## Problem it solves:
 * - Prevents regex injection attacks and unintended matches.
 * - Ensures user searches behave as expected, matching the literal input string.
 * - Avoids bugs where valid-looking input fails to match due to unescaped special characters.
 *
 * ## What happens if this is not used:
 * - User input containing special regex characters may result in incorrect, unexpected, or even dangerous query behavior.
 * - For example, searching for "BS (Computer Science) - COMSATS Isb" without escaping will treat the parentheses as regex groupings, not as literal characters.
 *
 * ## Example:
 *
 * //*  Without escaping:
 * const userInput = "BS (Computer Science) - COMSATS Isb";
 * const query = { name: { $regex: userInput, $options: 'i' } };
 * //* This will NOT match documents with the literal string, unless the parentheses are interpreted as regex groups.
 *
 * //* With escaping:
 * const userInput = "BS (Computer Science) - COMSATS Isb";
 * const safeInput = escapeRegex(userInput);
 * const query = { name: { $regex: safeInput, $options: 'i' } };
 * //* This will match documents containing the exact string, including parentheses.
 *
 * @param str - The string to escape
 * @returns The escaped string, safe for use in a regex
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
