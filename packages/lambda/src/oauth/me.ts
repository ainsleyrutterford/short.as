import { getUser } from "./user";
import { AuthenticatedHandler } from "./types";
import { response } from "../utils";
import { InternalServerError } from "../errors";

export const handleMeRequest: AuthenticatedHandler = async (event) => {
  console.log("Handling me request...");

  const user = event.auth?.user;
  if (user) {
    console.log("User already fetched.");
    return response({ statusCode: 200, body: JSON.stringify(user) });
  }

  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  console.log("Fetching user...");
  const fetchedUser = await getUser(userId);
  return response({ statusCode: 200, body: JSON.stringify(fetchedUser) });
};
