export type HouseId = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'

export interface Registration {
  id: string
  fullName: string
  email: string
  phone: string
  college: string
  usnOrRollNo?: string
  department?: 'MCA' | 'MBA' | 'BTech' | 'BCA' | 'Other'
  houseId: HouseId
  eventIds: string[]
  notes?: string
  createdAt: string
}

export interface HouseStanding {
  house: HouseId
  name: string
  crest: string
  points: number
  color: string
  accent: string
  rank?: number
}

export interface FestEvent {
  id: string
  title: string
  category: string
  track: string
  day: 1 | 2
  time: string
  venue: string
  points: number
  description: string
  rules?: string[]
}

export interface OwlPostMessage {
  id: string
  senderName: string
  email: string
  subject: string
  message: string
  createdAt: string
}
