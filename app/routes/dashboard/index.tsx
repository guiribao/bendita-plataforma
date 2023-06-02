import { LoaderArgs } from '@remix-run/node';


export async function loader({ request }: LoaderArgs) {
  return {};
}

export default function DashboardIndex() {
  return <h3>Dashboard</h3>;
}
