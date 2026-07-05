/**
 * <OnboardingFlow>
 *
 * 6-screen tutorial with skip. Sets a localStorage flag on completion.
 *
 * Bible reference: Part 8.7.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/ui/components/atoms/Button'
import { clsx } from '@/ui/util/clsx'
import s from './OnboardingFlow.module.css'

const STEPS = [
  { title: 'Welcome',      body: 'You are a hero who fights with dice. Roll well, lock cleverly, strike hard.' },
  { title: 'The Dice',     body: 'Tap to lock any die. Locked dice keep their face through rerolls.' },
  { title: 'The Ladder',   body: 'Four ability tiers. Higher tier means bigger effect. Match dice to unlock rows.' },
  { title: 'Tokens',       body: 'Heroes leave signature tokens on each other — Frost-bite, Cinder, Verdict. They bend the rules.' },
  { title: 'Cards',        body: 'Play cards from your hand to reshape the moment. Instant cards even interrupt your opponent.' },
  { title: 'Get Started',  body: 'That\'s the basics. Pick a hero and begin.' },
] as const

const FLAG_KEY = 'pact-of-heroes:onboarded'

export function OnboardingFlow(): JSX.Element {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const finish = () => {
    try { localStorage.setItem(FLAG_KEY, '1') } catch {}
    navigate('/')
  }

  const cur = STEPS[step]!
  const isLast = step === STEPS.length - 1

  return (
    <div className={s.page}>
      <div className={s.dots}>
        {STEPS.map((_, i) => (
          <span key={i} className={clsx(s.dot, i === step && s.active)} />
        ))}
      </div>
      <div className={s.card}>
        <h2 className={s.stepTitle}>{cur.title}</h2>
        <p className={s.stepBody}>{cur.body}</p>
      </div>
      <div className={s.actions}>
        <Button variant="ghost" onClick={finish}>Skip</Button>
        <Button variant="primary" onClick={isLast ? finish : () => setStep(s => s + 1)}>
          {isLast ? 'Begin' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

export function hasOnboarded(): boolean {
  try { return localStorage.getItem(FLAG_KEY) === '1' } catch { return false }
}

export default OnboardingFlow
