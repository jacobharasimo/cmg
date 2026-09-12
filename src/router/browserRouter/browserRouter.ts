/**
 * The browser router `main.tsx` renders.
 *
 * Separate from the route table so tests can build a memory router from the
 * same routes without this module's side effect of reading the URL. Named for
 * what it is rather than `router`, which would read as `router/router`.
 */
import { createBrowserRouter } from 'react-router-dom'
import { routes } from '../router'

export const browserRouter = createBrowserRouter(routes)
