import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaCheckCircle } from 'react-icons/fa'
import config from '../welcome-config.json'

const steps = [
  { key: 'role', label: 'Pick your role' },
  { key: 'explore', label: 'Explore agents' },
  { key: 'simulation', label: 'Run a simulation' },
  { key: 'signup', label: 'Save & create account' }
]

export default function WelcomeExperience () {
  const [persona, setPersona] = useState(() => localStorage.getItem('userPersona') || '')
  const [stepCompletion, setStepCompletion] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stepCompletion') || '{}')
    } catch {
      return {}
    }
  })
  const [showIntro, setShowIntro] = useState(!persona)

  useEffect(() => {
    localStorage.setItem('userPersona', persona)
  }, [persona])

  useEffect(() => {
    localStorage.setItem('stepCompletion', JSON.stringify(stepCompletion))
  }, [stepCompletion])

  const logAction = async (action, data = {}) => {
    try {
      await fetch('/welcome-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, persona, ...data })
      })
    } catch {}
  }

  const handlePersona = key => {
    setPersona(key)
    setStepCompletion(sc => ({ ...sc, role: true }))
    logAction('select-persona', { persona: key })
  }

  const personaData = config[persona] || {}

  const startExploring = () => {
    setShowIntro(false)
    logAction('start-exploring')
  }

  const complete = key => {
    setStepCompletion(sc => ({ ...sc, [key]: true }))
    logAction('complete-step', { step: key })
  }

  useEffect(() => {
    if (!showIntro && persona) {
      complete('role')
    }
  }, [showIntro, persona])

  if (!persona) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-white p-4'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='bg-black/40 rounded-xl p-6 w-full max-w-md'>
          <h1 className='text-xl font-semibold mb-4 text-center'>What brings you here today?</h1>
          <div className='space-y-2'>
            {Object.entries(config).map(([key, p]) => (
              <button key={key} onClick={() => handlePersona(key)} className='w-full flex items-center space-x-2 p-2 rounded-md bg-gray-800 hover:bg-gray-700'>
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (showIntro) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-white p-4'>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='bg-black/40 rounded-xl p-6 w-full max-w-md text-center space-y-4'>
          <div className='text-4xl'>{personaData.emoji}</div>
          <h2 className='text-xl font-semibold'>Welcome {personaData.label}</h2>
          <p className='text-sm'>Get started quickly with these links:</p>
          <div className='flex flex-col space-y-2'>
            {(personaData.links || []).map((link, idx) => (
              <a key={idx} href={link} className='bg-blue-600 hover:bg-blue-700 rounded-md p-2'>
                {link}
              </a>
            ))}
          </div>
          <button onClick={startExploring} className='mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded'>Start Exploring</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white relative'>
      <div className='absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex justify-around text-xs'>
        {steps.map(s => (
          <div key={s.key} className='flex items-center space-x-1'>
            {stepCompletion[s.key] ? <FaCheckCircle className='text-green-400 w-4 h-4' /> : <div className='w-3 h-3 border border-gray-400 rounded-full' />}
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className='flex items-center justify-center h-full'>
        <div className='text-center space-y-4'>
          <div className='text-4xl'>{personaData.emoji}</div>
          <h2 className='text-2xl font-semibold'>Welcome back, {personaData.label}</h2>
          <p className='text-sm'>Want to pick up where you left off?</p>
          <button onClick={() => complete('explore')} className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded'>Explore Agents</button>
        </div>
      </div>
    </div>
  )
}
