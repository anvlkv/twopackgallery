import { getXataClient } from 'xata';

const client = getXataClient();

export async function validateTag(
  userId: string,
  tag: string
): Promise<boolean> {
  if (/[^a-z0-9]/.test(tag)) {
    return false;
  }

  const tagUser = await client.db.users.getFirst({ filter: { tag } });

  return !tagUser || tagUser.id === userId;
}
