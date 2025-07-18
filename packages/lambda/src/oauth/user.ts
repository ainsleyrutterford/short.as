// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { User } from "@short-as/types";

import { getStringEnvironmentVariable } from "../utils";
import { dynamoClient } from "../clients/dynamo";
import { UserDdbInput } from "./types";

const USERS_TABLE_NAME = getStringEnvironmentVariable("USERS_TABLE_NAME");

const generateUserUpdateCommandInputs = (user: UserDdbInput) => {
  const updateExpressions: string[] = [];
  const userExpressionAttributeNames: Record<string, string> = {};
  const userExpressionAttributeValues: Record<string, unknown> = {};

  Object.entries(user).forEach(([key, value]) => {
    // Update expression shouldn't contain the id
    if (key !== "id") {
      updateExpressions.push(`#${key} = :${key}`);
      userExpressionAttributeNames[`#${key}`] = key;
      userExpressionAttributeValues[`:${key}`] = value;
    }
  });

  return {
    userUpdateExpression: updateExpressions.join(", "),
    userExpressionAttributeNames,
    userExpressionAttributeValues,
  };
};

export const createOrUpdateUser = async (user: UserDdbInput): Promise<User> => {
  console.log("Creating or updating user in DynamoDB...");

  const { userUpdateExpression, userExpressionAttributeNames, userExpressionAttributeValues } =
    generateUserUpdateCommandInputs(user);

  const response = await dynamoClient.send(
    new UpdateCommand({
      TableName: USERS_TABLE_NAME,
      Key: { id: user.id },
      UpdateExpression:
        `SET ${userUpdateExpression}, ` +
        // oAuthLogins starts at 1 and increments each time a user logs in with oAuth
        "oAuthLogins = if_not_exists(oAuthLogins, :zero) + :one, " +
        // refreshTokenVersion starts at 1 and is incremented elsewhere in the code when a
        // user requests to log out of all devices
        "refreshTokenVersion = if_not_exists(refreshTokenVersion, :one), " +
        "firstLoginTimestamp = if_not_exists(firstLoginTimestamp, :now), " +
        "lastOAuthLoginTimestamp = :now",
      ExpressionAttributeNames: userExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...userExpressionAttributeValues,
        ":zero": 0,
        ":one": 1,
        ":now": new Date().toISOString(),
      },
      ReturnValues: ReturnValue.ALL_NEW,
    }),
  );

  if (!response.Attributes) {
    throw new Error(`Could not create or update user with id: ${user.id}`);
  }

  if (response.Attributes.oAuthLogins === 1) {
    console.log(`New user created: ${user.id}`);
  } else {
    console.log(`Existing user updated: ${user.id}`);
  }
  return response.Attributes as User;
};

export const getUser = async (id: string): Promise<User> => {
  console.log(`Getting user ${id} from DynamoDB...`);

  const response = await dynamoClient.send(new GetCommand({ TableName: USERS_TABLE_NAME, Key: { id } }));

  if (response.Item) {
    return response.Item as User;
  } else {
    throw new Error(`Could not get user with id: ${id}`);
  }
};
