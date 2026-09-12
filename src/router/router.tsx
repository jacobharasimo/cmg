import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import RouteError from './RouteError'
import { paths } from './paths'

/**
 * The route table — what the app's routing *is*.
 *
 * Pages are declared with `lazy` so each lands in its own chunk — which is what
 * keeps Highcharts out of the entry bundle. For the same reason `AppLayout` is
 * imported directly rather than through an aggregate components barrel.
 */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    // Covers the shell itself. Without it, an error in AppLayout escapes to
    // React Router's built-in fallback, because the boundary below is a
    // descendant of the thing that failed.
    errorElement: <RouteError />,
    children: [
      {
        // Pathless boundary: a page that throws renders inside the shell, so
        // the layout survives the error.
        errorElement: <RouteError />,
        children: [
          {
            path: paths.dashboard,
            lazy: async () => ({ Component: (await import('@/pages/Dashboard')).default }),
          },
          { path: '*', element: <Navigate to={paths.dashboard} replace /> },
        ],
      },
    ],
  },
]
