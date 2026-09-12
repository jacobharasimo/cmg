import { Button, Stack, Typography } from '@mui/material'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

/** Rendered in the layout's outlet when a route or its data throws. */
const RouteError = () => {
  const error: unknown = useRouteError()
  const navigate = useNavigate()

  const heading = isRouteErrorResponse(error)
    ? `${String(error.status)} ${error.statusText}`
    : 'Something went wrong'
  const detail = isRouteErrorResponse(error)
    ? String(error.data)
    : error instanceof Error
      ? error.message
      : null

  return (
    <Stack spacing={2} sx={{ py: 6, alignItems: 'flex-start' }}>
      <Typography variant="h1">{heading}</Typography>
      {detail === null ? null : (
        <Typography variant="body1" color="text.secondary">
          {detail}
        </Typography>
      )}
      <Button variant="contained" onClick={() => void navigate(0)}>
        Reload
      </Button>
    </Stack>
  )
}

export default RouteError
