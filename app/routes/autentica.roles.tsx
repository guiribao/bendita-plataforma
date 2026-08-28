import type { ActionFunctionArgs} from '@remix-run/node';
import { json } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  await request.json();
  return json({ roles: [] });
}
