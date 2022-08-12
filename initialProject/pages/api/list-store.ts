import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';
import sql from 'sql-template-strings';
import { jsonResponse } from '../../lib/apiHelpers';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const list = req.body.list as { checked: boolean; name: string }[];
  try {
    await query(sql`DELETE FROM todo`);
    for (const item of list) {
      await query(sql`INSERT INTO todo (checked, name) VALUES (${item.checked}, ${item.name})`);
    }
    jsonResponse(req, res, 200, { status: 'ok' });
  } catch (error) {
    console.log(error);
    jsonResponse(req, res, 500, { status: 'error' });
  }
};
