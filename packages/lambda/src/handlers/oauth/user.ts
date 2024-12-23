// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ReturnValue } from "@aws-sdk/client-dynamodb";

import { dynamoClient } from "../../clients";
import { getStringEnvironmentVariable } from "../../utils";
import { OAuthProvider } from "./utils";

interface User {
  id: string;
  oAuthProvider: OAuthProvider;
  email: string;
  name: string;
  profilePictureUrl: string;
  lastOAuthLoginTime: number;
  lastRefreshLoginTime: number;
}

export const putUser = async (user: User) => {
  console.log("Putting user in DynamoDB...");

  const usersTableName = getStringEnvironmentVariable("USERS_TABLE_NAME");

  const response = await dynamoClient.send(
    new PutCommand({
      TableName: usersTableName,
      Item: user,
      // If PutItem overwrote an attribute name-value pair, then the content of the old item is returned
      // this allows us to see if we are inserting a new user or updating an existing one
      ReturnValues: ReturnValue.ALL_OLD,
    }),
  );

  if (response.Attributes) {
    console.log(`Existing user updated: ${user.id}`);
  } else {
    console.log(`New user created: ${user.id}`);
  }
};
