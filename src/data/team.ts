export interface FacultyMember {
  id: string
  name: string
  role: string
  designation: string
  department: string
  image: string
  icon: string
  quote: string
  bio?: string
}

export interface StudentCouncilMember {
  id: string
  title: string
  image: string
  member: {
    name: string
    role: string
  }
  tagline: string 
  description: string
  responsibilities: string[]
  quote: string
  element: string
}

/**
 * Head of Department (HOD)
 */
export const HOD_DATA: FacultyMember = {
  id: 'hod',
  name: 'Dr. Alistair Vance',
  role: 'Head of Department',
  designation: 'Professor & Head',
  department: 'Department of Computer Science & Magical Engineering',
  image: '/characters/char1.jpg',
  icon: '⚡',
  quote: 'Magic is science refined by boundless imagination. May this festival ignite the spark of brilliance and courage in every aspiring wizard.',
  bio: 'With over two decades of academic leadership and research in magical computing and arcane systems, Dr. Vance oversees the Department and serves as Chief Patron of AJ-ASTRIX2K27.',
}

/**
 * Faculty Coordinators & Mentors
 */
export const FACULTY_DATA: FacultyMember[] = [
  {
    id: 'fac-1',
    name: 'Prof. Eleanor Thorne',
    role: 'Chief Faculty Coordinator',
    designation: 'Associate Professor',
    department: 'School of Computing & Magical Arts',
    image: '/characters/char2.jpg',
    icon: '🦉',
    quote: 'Guiding visionary minds to blend ancient wisdom with modern technology.',
    bio: 'Oversees overall festival planning, cross-house committee collaboration, and festival scheduling.',
  },
  {
    id: 'fac-2',
    name: 'Dr. Jonathan Blackwood',
    role: 'Faculty Co-Convener',
    designation: 'Associate Professor',
    department: 'Software Systems & Enchantments',
    image: '/characters/char3.jpg',
    icon: '📜',
    quote: 'Fostering innovation, collaboration, and student leadership across all houses.',
    bio: 'Directs festival operations, university patron communication, and academic competitions.',
  },
  {
    id: 'fac-3',
    name: 'Prof. Severus Sterling',
    role: 'Staff Technical Advisor',
    designation: 'Assistant Professor',
    department: 'Cyber Defence & Applied Potions',
    image: '/characters/char1.jpg',
    icon: '🔮',
    quote: 'True mastery requires discipline, curiosity, and relentless pursuit of excellence.',
    bio: 'Advises on 3D web platforms, digital systems, interactive tech showcases, and hackathon challenges.',
  },
  {
    id: 'fac-4',
    name: 'Dr. Miranda Rosier',
    role: 'Student Affairs Coordinator',
    designation: 'Assistant Professor',
    department: 'Data Sorcery & Intelligent Systems',
    image: '/characters/char2.jpg',
    icon: '⚖️',
    quote: 'Nurturing creativity, integrity, and the enduring spirit of camaraderie.',
    bio: 'Coordinates student welfare, house disputes, safety protocols, and student council activities.',
  },
]

/**
 * Student Council & Domain Leads
 * Retains the 12 domain cards with interactive expanding animation & dedicated card pages
 */
export const STUDENT_COUNCIL_DATA: StudentCouncilMember[] = [
  {
    id: 'council',
    title: 'Council',
    image: '/characters/char1.jpg',
    member: { name: 'Alaric', role: 'President & Lead' },
    tagline: 'Guardian of the Council & Festival Assembly',
    description: 'Leading the inter-house student council, presiding over grand feast ceremonies, and representing the student body across all four houses.',
    responsibilities: ['Presiding over Council Assemblies', 'Directing the Core Organizing Team', 'Inter-House Diplomacy & Governance'],
    quote: 'True leadership is forging harmony where four distinct houses unite as one unstoppable realm.',
    element: 'Crown 👑',
  },
  {
    id: 'arts',
    title: 'Arts',
    image: '/characters/char2.jpg',
    member: { name: 'Julian', role: 'Creative Director' },
    tagline: 'Master of Illumination & Magical Aesthetics',
    description: 'Directing the visual spectacle, mystical illumination, grand stage setups, and immersive artistic exhibitions across the castle grounds.',
    responsibilities: ['Visual Identity & Creative Direction', 'Stage & Hall Ambience Architecture', 'Enchanted Decor & Lighting'],
    quote: 'Every stone in the Great Hall tells a tale; our art simply awakens the magic already sleeping within.',
    element: 'Palette 🎨',
  },
  {
    id: 'eng',
    title: 'Eng',
    image: '/characters/char3.jpg',
    member: { name: 'Kaelen', role: 'Chief Architect' },
    tagline: 'Architect of the Virtual Great Hall & Arcane Code',
    description: 'Building the interactive 3D website, camera trajectories, dynamic WebGL shaders, and high-performance digital infrastructure for the festival.',
    responsibilities: ['3D Web Graphics & WebGL Shaders', 'Performance Optimization & Rendering', 'Interactive Systems & Architecture'],
    quote: 'Code is the modern wand-wave: logical, exacting, and capable of constructing entire worlds in light.',
    element: 'Compass 📐',
  },
  {
    id: 'ops',
    title: 'Ops',
    image: '/characters/char1.jpg',
    member: { name: 'Soren', role: 'Head of Operations' },
    tagline: 'Master of Logistics & Festival Timelines',
    description: 'Managing the overall operational flow, venue scheduling, crisis response, and day-to-day coordination of all festival activities.',
    responsibilities: ['Real-Time Event Operations', 'Venue Management & Scheduling', 'Protocol & Flow Coordination'],
    quote: 'When magic flows seamlessly from dawn till midnight, it is because operations never missed a beat.',
    element: 'Hourglass ⏳',
  },
  {
    id: 'lore',
    title: 'Lore',
    image: '/characters/char2.jpg',
    member: { name: 'Thistle', role: 'Chronicles & Lore' },
    tagline: 'Keeper of the Ancient Archives & House Points',
    description: 'Curating the festival lore, historical records, house points ledger, secret chamber quests, and daily announcements.',
    responsibilities: ['House Points Ledger Verification', 'Quest & Mystery Design', 'Festival Lore & Narrative Direction'],
    quote: 'History is not merely what was; it is the spell that weaves what we shall become.',
    element: 'Scroll 📜',
  },
  {
    id: 'guard',
    title: 'Guard',
    image: '/characters/char3.jpg',
    member: { name: 'Bane', role: 'Security & Safety' },
    tagline: 'Warden of the Wards & Crowd Safety',
    description: 'Maintaining perimeter safety, enchanted crowd barriers, emergency evacuation routes, and pitch safety throughout the games.',
    responsibilities: ['Perimeter Security & Crowd Flow', 'Safety Protocols & Wards', 'Emergency Response & First Aid Coordination'],
    quote: 'Vigilance is our armor; peace is our gift to the gathering.',
    element: 'Shield 🛡️',
  },
  {
    id: 'magic',
    title: 'Magic',
    image: '/characters/char1.jpg',
    member: { name: 'Lyra', role: 'Technical Mage' },
    tagline: 'Convener of Wand Dueling & Arcane Contests',
    description: 'Designing the technical spellcasting competitions, hackathon challenges, interactive wand stations, and spell showcases.',
    responsibilities: ['Technical Hackathon Organization', 'Spell Dueling Tournament Rules', 'Interactive Tech & Magic Stalls'],
    quote: 'The brightest sparks arise when ancient spells meet algorithmic precision.',
    element: 'Wand 🪄',
  },
  {
    id: 'void',
    title: 'Void',
    image: '/characters/char2.jpg',
    member: { name: 'Xylon', role: 'Audio & Visuals' },
    tagline: 'Maestro of Soundscapes & Spectral Acoustics',
    description: 'Sound engineering, orchestral acoustic enchantments, cinematic lighting cues, and audio-visual stage production.',
    responsibilities: ['Live Audio Engineering & Acoustics', 'Projection Mapping & Screen Displays', 'Lighting Sequences & Cinematic Cues'],
    quote: 'Silence is the canvas; sound is the incantation that stirs the heart.',
    element: 'Echo 🎵',
  },
  {
    id: 'light',
    title: 'Light',
    image: '/characters/char3.jpg',
    member: { name: 'Aurelius', role: 'Sponsorships' },
    tagline: 'Ambassador of Patrons & Grand Alliances',
    description: 'Managing corporate partnerships, external sponsors, prize pools, VIP relations, and high table accommodations.',
    responsibilities: ['Sponsorship Outreach & Partnerships', 'Prize Pools & House Cup Trophies', 'VIP Guest Hospitality'],
    quote: 'Great feats require visionary allies who believe in the dawn before the sun rises.',
    element: 'Sun ☀️',
  },
  {
    id: 'dark',
    title: 'Dark',
    image: '/characters/char1.jpg',
    member: { name: 'Nyx', role: 'Public Relations' },
    tagline: 'Herald of the Daily Prophet & Castle Media',
    description: 'Public relations, social media broadcasting, live festival coverage, press communiqués, and external invitations.',
    responsibilities: ['Social Media & Live Coverage', 'Press & Public Announcements', 'Campus Outreach & Engagement'],
    quote: 'A whisper in the dark can travel faster than an owl in full flight.',
    element: 'Owl 🦉',
  },
  {
    id: 'wind',
    title: 'Wind',
    image: '/characters/char2.jpg',
    member: { name: 'Zephyr', role: 'Logistics' },
    tagline: 'Dispatcher of Broomsticks & Supply Caravans',
    description: 'Logistics management, equipment movement, supply caravans, stage gear transport, and participant reception.',
    responsibilities: ['Supply Chain & Resource Dispatch', 'Broomstick Parking & Transport', 'Equipment Setup & Teardown'],
    quote: 'Swift as the gale, quiet as the breeze; everything arrives exactly when needed.',
    element: 'Feather 🪶',
  },
  {
    id: 'fire',
    title: 'Fire',
    image: '/characters/char3.jpg',
    member: { name: 'Ignis', role: 'Hospitality' },
    tagline: 'Keeper of the Hearth & Feast Banquets',
    description: 'Participant reception, culinary feasts, house table dining arrangements, refreshments, and volunteer welfare.',
    responsibilities: ['Feast & Banquet Management', 'Participant Hospitality & Registration Desk', 'Volunteer Support & Welfare'],
    quote: 'Warmth at the hearth and a seat at the table for every traveler from afar.',
    element: 'Flame 🔥',
  },
]
