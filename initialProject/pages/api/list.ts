import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';
import sql from 'sql-template-strings';
import { jsonResponse } from '../../lib/apiHelpers';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const list = await query(sql`SELECT checked, name FROM todo`);
    jsonResponse(req, res, 200, { status: 'ok', list });
  } catch (error) {
    console.log(error);
    jsonResponse(req, res, 500, { status: 'error' });
  }
};
