import { redirect } from 'next/navigation'

// Listen sub-tab: the consume surface still lives on its studio route.
export default function ListenQueriesPage() {
  redirect('/story?kind=spark_query')
}
