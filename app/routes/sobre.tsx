import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request);

  return { usuario };
}

export default function Index() {
  let data = useLoaderData()

  return <main>
    <div className="disclaimer">
    sobre
    </div>
  </main>;
}
