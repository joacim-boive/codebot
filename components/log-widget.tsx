import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export type LogItem = {
  id: string
  message: string
  completed: boolean
}

type LogWidgetProps = {
  logs: LogItem[]
}

export const LogWidget = ({ logs }: LogWidgetProps) => {
  const [displayedLogs, setDisplayedLogs] = useState<LogItem[]>([])

  useEffect(() => {
    const newLogs = logs.filter(
      (log) =>
        !displayedLogs.some((displayedLog) => displayedLog.id === log.id),
    )
    setDisplayedLogs((prevLogs) => [...prevLogs, ...newLogs])
  }, [logs])

  return (
    <div className="bg-black text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">System Log</h2>
      <ul>
        {displayedLogs.map((log) => (
          <motion.li
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2"
          >
            {log.message}
            {log.completed ? (
              <span className="text-green-500 ml-2">✓</span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="text-white ml-2"
              >
                █
              </motion.span>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
