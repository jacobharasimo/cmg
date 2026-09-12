import { Box, Button, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ExportCsvButton from '@/components/ExportCsvButton'
import FillCard from '@/components/FillCard'
import type { JsonOutputProps } from './types'

const COPIED_MS = 1600

/**
 * What `evaluateLogFile()` actually returns, shown verbatim.
 *
 * The `pre` is a focusable scroll region so keyboard users can reach its
 * overflow (WCAG 2.1.1).
 */
const JsonOutput = ({ verdicts, onExportCsv }: JsonOutputProps) => {
  const [hasCopied, setHasCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const json = useMemo(() => JSON.stringify(verdicts, null, 2), [verdicts])

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const handleCopy = useCallback(() => {
    void navigator.clipboard?.writeText(json)
    setHasCopied(true)
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setHasCopied(false)
    }, COPIED_MS)
  }, [json])

  return (
    <FillCard isFilled>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h2" component="h2">
          evaluateLogFile() output
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleCopy}>{hasCopied ? 'Copied' : 'Copy JSON'}</Button>
          <ExportCsvButton
            filename="device-evaluation.csv"
            rows={onExportCsv}
            label="Export evaluation results as CSV"
          />
        </Box>
      </Box>

      {/*
        Scrolling container, so it must be reachable by keyboard (WCAG 2.1.1).
        No native element makes an overflow box focusable; this is the
        documented technique, not a control.
      */}
      <Box
        component="pre"
        tabIndex={0}
        role="region"
        aria-label="evaluateLogFile JSON output, scrollable"
        sx={{
          m: 0,
          mt: 2,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 2,
          typography: 'mono',
          color: 'text.primary',
          bgcolor: (theme) => theme.palette.background.panel,
          border: 1,
          borderColor: (theme) => theme.palette.outline,
          borderRadius: (theme) => `${String(theme.shape.borderRadius)}px`,
        }}
      >
        {json}
      </Box>
    </FillCard>
  )
}

export default JsonOutput
