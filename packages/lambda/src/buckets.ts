import crypto from "crypto";

// Arbitrary number with high enough value to avoid DynamoDB collisions at high volumes:
// 52^3
const NUM_COUNT_BUCKETS = 140608;

// 52^7 / 52^3 = 52^4 = 7311616
// We are using a slightly smaller number so that it isn't divisible by 52, otherwise we
// end up having lot IDs early on that have a lot of "a"s in them.
export const BUCKET_SIZE = 7311610;

// E.g. the first bucket goes from 0 to 7311609, the next bucket from 7311610 onwards, etc.
export const MAX_COUNT = BUCKET_SIZE - 1;

export const getRandomCountBucketId = () => crypto.randomInt(NUM_COUNT_BUCKETS);
