import { Box, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'

/**
 * The page shell: a width-capped column holding whatever route is active.
 *
 * Deliberately data-free — it takes no props and calls no hooks, so the page
 * below owns everything on screen, including the header. That is what lets a
 * second page be added without touching the shell.
 *
 * The width cap is the theme's `xl` breakpoint rather than a value held here,
 * so no component carries a width of its own.
 */
const AppLayout = () => (
  <Box
    component="main"
    sx={{ minHeight: '100vh', px: 3, pt: 3, pb: 8 }}
  >
    {/* `xl` is the content cap, defined in the theme — no width lives here. */}
    <Container maxWidth="xl" disableGutters>
      <Outlet />
    </Container>
  </Box>
)

export default AppLayout
