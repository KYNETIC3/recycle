'use client'

import { useEffect, useRef, useState } from 'react'

interface TypewriterProps {
  phrases: string[]
  typeSpeed?: number
  deleteSpeed?: number
  pauseDuration?: number
  cursorColor?: string
  className?: string
}

export default function Typewriter({
  phrases,
  typeSpeed = 40,
  deleteSpeed = 25,
  pauseDuration = 1800,
  cursorColor = '#7aa2e3',
  className = '',
}: TypewriterProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  const timeoutRef = useRef<NodeJS.Timeout>()

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex]

    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseDuration)
      return
    }

    if (isDeleting) {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1))
        }, deleteSpeed)
      } else {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % phrases.length)
      }
    } else {
      if (displayText.length < currentPhrase.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1))
        }, typeSpeed)
      } else {
        setIsPaused(true)
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [displayText, isDeleting, isPaused, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseDuration])

  return (
    <span className={className} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
      {displayText}
      <span
        style={{
          display: 'inline-block',
          width: '2px',
          height: '1.2em',
          marginLeft: '2px',
          backgroundColor: cursorColor,
          opacity: cursorVisible ? 1 : 0,
          transition: 'opacity 0.1s ease',
          verticalAlign: 'text-bottom',
        }}
        aria-hidden="true"
      />
    </span>
  )
}