import { HouseId } from '../models/types.js'

export interface HouseInfo {
  id: HouseId
  name: string
  crest: string
  color: string
  accent: string
  glow: string
  motto: string
  founder: string
  element: string
  ghost: string
}

export const HOUSES_DATA: HouseInfo[] = [
  {
    id: 'gryffindor',
    name: 'Gryffindor',
    crest: '🦁',
    color: '#ae1c28',
    accent: '#d4a017',
    glow: '#ffb648',
    motto: 'Might makes right.',
    founder: 'Godric Gryffindor',
    element: 'Fire 🔥',
    ghost: 'Nearly Headless Nick',
  },
  {
    id: 'slytherin',
    name: 'Slytherin',
    crest: '🐍',
    color: '#0a5c36',
    accent: '#c0c8d0',
    glow: '#5ce6a0',
    motto: 'Courage can be found in others.',
    founder: 'Salazar Slytherin',
    element: 'Water 💧',
    ghost: 'The Bloody Baron',
  },
  {
    id: 'ravenclaw',
    name: 'Ravenclaw',
    crest: '🦅',
    color: '#0e1a40',
    accent: '#8ec9ff',
    glow: '#7fb5ff',
    motto: 'Might is made, not born.',
    founder: 'Rowena Ravenclaw',
    element: 'Air 💨',
    ghost: 'The Grey Lady',
  },
  {
    id: 'hufflepuff',
    name: 'Hufflepuff',
    crest: '🦡',
    color: '#ecb939',
    accent: '#6b4a12',
    glow: '#ffd75e',
    motto: 'We are the best of what we are.',
    founder: 'Helga Hufflepuff',
    element: 'Earth 🌿',
    ghost: 'The Fat Friar',
  },
]
