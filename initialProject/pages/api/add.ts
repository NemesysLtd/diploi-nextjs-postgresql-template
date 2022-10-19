import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';
import sql from 'sql-template-strings';
import { jsonResponse } from '../../lib/apiHelpers';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await query(
      sql`INSERT INTO todo (checked, name, sort, time_update) VALUES (FALSE, '', (SELECT coalesce(max(sort),0)+1 FROM todo), now())`
    );
    jsonResponse(req, res, 200, { status: 'ok' });
  } catch (error) {
    console.log(error);
    jsonResponse(req, res, 500, { status: 'error' });
  }
};
