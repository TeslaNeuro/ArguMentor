import { auth, currentUser } from "@clerk/nextjs/server";
import { memoryDb, type StoredUser } from "@argumentor/db";

const DEV_USER_CLERK_ID = "dev_local_user";

export function isDevAuthEnabled() {
  return (
    process.env.ARGUMENTOR_DEV_AUTH === "true" ||
    (!process.env.CLERK_SECRET_KEY && process.env.NODE_ENV !== "production")
  );
}

export async function requireAppUser(): Promise<StoredUser> {
  if (isDevAuthEnabled()) {
    return memoryDb.upsertUser({
      clerkId: DEV_USER_CLERK_ID,
      email: "coach@argumentor.local",
      displayName: "Local Debater",
    });
  }

  const { userId } = await auth();
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    `${userId}@users.argumentor.app`;

  return memoryDb.upsertUser({
    clerkId: userId,
    email,
    displayName: user?.fullName ?? user?.username ?? null,
  });
}
