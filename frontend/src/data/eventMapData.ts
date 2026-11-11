export interface MapLocation {
  id: string
  name: string
  subtitle: string
  category: string
  icon: string
  // Percentage coordinates relative to the map image [0..100]
  x: number
  y: number
  description: string
  landmarks: string[]
  day1Events: {
    id: string
    title: string
    time: string
    type: string
    points?: number
    blurb: string
  }[]
  day2Events: {
    id: string
    title: string
    time: string
    type: string
    points?: number
    blurb: string
  }[]
}

export const MAP_LOCATIONS: MapLocation[] = [
  {
    id: 'main-auditorium',
    name: 'Main Auditorium',
    subtitle: 'The Grand Assembly Hall',
    category: 'Flagship Venue',
    icon: '✦',
    x: 23.2,
    y: 35.0,
    description:
      'The majestic central amphitheatre and primary auditorium of Hogwarts, hosting the grand ceremonial inauguration, keynote guest sessions, hackathon pitches, and the awards gala.',
    landmarks: ['Gothic Stained Glass Portals', 'Central Stage & Screen', 'House Banner Gallerias'],
    day1Events: [
      {
        id: 'inauguration',
        title: 'Inauguration Ceremony & Lighting of the Lamp',
        time: '09:30 AM – 11:00 AM',
        type: 'Ceremony',
        points: 20,
        blurb: 'Grand fest commencement with Chief Patron, HOD, and dignitaries. Unveiling of the Fest Trophy.',
      },
      {
        id: 'keynote',
        title: 'Keynote Address: Born From Fire',
        time: '11:15 AM – 12:30 PM',
        type: 'Keynote',
        points: 15,
        blurb: 'Visionary address by magical tech pioneer on artificial intelligence and arcane computation.',
      },
      {
        id: 'project-pitch',
        title: 'Wizard Hackathon: Grand Project Pitches',
        time: '02:00 PM – 05:00 PM',
        type: 'Technical',
        points: 50,
        blurb: 'Finalist teams present their revolutionary software and hardware builds before the judges.',
      },
    ],
    day2Events: [
      {
        id: 'tech-quiz-finals',
        title: 'The Great Inter-House Tech Quiz Finals',
        time: '11:00 AM – 01:00 PM',
        type: 'Technical',
        points: 40,
        blurb: 'High-speed buzzer round covering programming, trivia, algorithms, and magical lore.',
      },
      {
        id: 'prize-distribution',
        title: 'Prize Distribution & Accolades',
        time: '03:00 PM – 04:30 PM',
        type: 'Ceremony',
        points: 0,
        blurb: 'Honouring the champions of all competitive tracks, hackathons, and gaming arenas.',
      },
      {
        id: 'closing-ceremony',
        title: 'Closing Ceremony & House Cup Reveal',
        time: '04:30 PM – 06:00 PM',
        type: 'Ceremony',
        points: 100,
        blurb: 'The House Cup announcement, farewell address, and celebratory magical indoor pyrotechnics.',
      },
    ],
  },
  {
    id: 'cultural-stage',
    name: 'Cultural Stage',
    subtitle: 'Open-Air Amphitheatre',
    category: 'Performances',
    icon: '✦',
    x: 61.0,
    y: 36.8,
    description:
      'The open-air gothic pavilion stage nestled on the castle terrace, resonating with live rock bands, classical melodies, theatrical skits, and energetic dance crews.',
    landmarks: ['Gothic Proscenium Arch', 'Terrace Seating Steps', 'Stage Acoustic Array'],
    day1Events: [
      {
        id: 'battle-of-bands',
        title: 'Battle of the Bands: Sound Sorcery',
        time: '01:30 PM – 05:00 PM',
        type: 'Cultural',
        points: 45,
        blurb: 'College rock bands and solo artists unleash thrilling original riffs and covers.',
      },
      {
        id: 'cultural-dance',
        title: 'Inter-House Choreography & Dance Night',
        time: '05:30 PM – 08:30 PM',
        type: 'Cultural',
        points: 50,
        blurb: 'Themed group dance performances blending contemporary styles with theatrical storytelling.',
      },
    ],
    day2Events: [
      {
        id: 'theatre-drama',
        title: 'Wizarding One-Act Theatrical Drama',
        time: '10:30 AM – 01:00 PM',
        type: 'Cultural',
        points: 35,
        blurb: 'Dramatics clubs present intense 15-minute plays and satirical parodies.',
      },
      {
        id: 'finale-performances',
        title: 'Grand Finale Musical Showcase',
        time: '01:30 PM – 04:00 PM',
        type: 'Cultural',
        points: 30,
        blurb: 'Headliner performances, guest band showcase, and all-stars jam session.',
      },
    ],
  },
  {
    id: 'gaming-zone',
    name: 'Gaming Zone',
    subtitle: 'The Battle Arena',
    category: 'Esports & Gaming',
    icon: '✦',
    x: 63.5,
    y: 56.5,
    description:
      'High-octane esports battlestation hall equipped with 144Hz setups, console pavilions, VR dueling rings, and retro arcade cabinets for intense multiplayer tournaments.',
    landmarks: ['100-Seat LAN Arena', 'VR Duel Ring', 'Console Fighting Pit'],
    day1Events: [
      {
        id: 'valorant-qualifiers',
        title: 'Valorant Tactical Shootout: Qualifiers',
        time: '10:30 AM – 02:00 PM',
        type: 'Gaming',
        points: 40,
        blurb: '5v5 tactical shooter showdown. Double elimination bracket across 16 teams.',
      },
      {
        id: 'fifa-tourney',
        title: 'EA FC / FIFA Champions Cup',
        time: '02:30 PM – 06:00 PM',
        type: 'Gaming',
        points: 25,
        blurb: '1v1 fast-paced console football tournament on giant projection screens.',
      },
      {
        id: 'vr-wand-duel',
        title: 'VR Wand Dueling Championship',
        time: '03:00 PM – 07:00 PM',
        type: 'Gaming',
        points: 30,
        blurb: 'Step inside immersive VR and cast real-time hexes, shields, and patronuses.',
      },
    ],
    day2Events: [
      {
        id: 'esports-grand-finals',
        title: 'Esports Championship Grand Finals',
        time: '10:00 AM – 02:00 PM',
        type: 'Gaming',
        points: 50,
        blurb: 'Live-casted championship decider with spectator lounge and casters.',
      },
      {
        id: 'arcade-retro',
        title: 'Retro Arcade & Smash Bros Blitz',
        time: '02:00 PM – 04:00 PM',
        type: 'Gaming',
        points: 20,
        blurb: 'Classic arcade tournaments: Street Fighter, Tekken, and Mario Kart.',
      },
    ],
  },
  {
    id: 'workshop-halls',
    name: 'Workshop Halls',
    subtitle: 'Scholarly Labs & Tech Arenas',
    category: 'Workshops & Labs',
    icon: '✦',
    x: 33.0,
    y: 51.3,
    description:
      'Specialized engineering laboratories and seminar halls dedicated to industry workshops, hands-on IoT sessions, cybersecurity capture-the-flag, and web3 development.',
    landmarks: ['Dual High-Performance Computer Labs', 'Interactive Smart Projectors', 'Hardware Demo Workbench'],
    day1Events: [
      {
        id: 'ai-workshop',
        title: 'GenAI & Autonomous Agent Architectures',
        time: '10:30 AM – 01:00 PM',
        type: 'Workshop',
        points: 20,
        blurb: 'Deep dive into building multi-agent LLM systems with real-world project code.',
      },
      {
        id: 'cyber-ctf',
        title: 'Cyber Defense & Magical CTF: Round 1',
        time: '02:00 PM – 05:30 PM',
        type: 'Technical',
        points: 40,
        blurb: 'Reverse engineering, cryptography decryption, and penetration testing puzzles.',
      },
    ],
    day2Events: [
      {
        id: 'web3-masterclass',
        title: 'Full-Stack 3D Web & WebGL Masterclass',
        time: '10:00 AM – 12:30 PM',
        type: 'Workshop',
        points: 20,
        blurb: 'Learn Three.js, shaders, and spatial audio to build immersive web realms.',
      },
      {
        id: 'ctf-finals',
        title: 'Cybersecurity CTF: The Final Vault',
        time: '01:00 PM – 03:30 PM',
        type: 'Technical',
        points: 50,
        blurb: 'Finalist teams breach the fortified server to capture the Golden Snitch flag.',
      },
    ],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    subtitle: 'The Great Feast Pavilions',
    category: 'Hospitality & Dining',
    icon: '✦',
    x: 22.2,
    y: 67.4,
    description:
      'Vibrant outdoor feast village with artisan food trucks, authentic Hogwarts Butterbeer cauldrons, street snacks, bakery treats, and cozy shaded marquee pavilions.',
    landmarks: ['Butterbeer Cauldron Bar', 'Food Truck Boulevard', 'Canopy Dining Seating'],
    day1Events: [
      {
        id: 'butterbeer-stalls',
        title: 'The Great Feast & Butterbeer Stalls',
        time: '11:00 AM – 08:00 PM',
        type: 'Hospitality',
        points: 0,
        blurb: 'Freshly brewed sparkling butterbeer, pumpkin pastries, burgers, and noodles.',
      },
      {
        id: 'eating-comp',
        title: 'Chili & Firebolt Food Challenge',
        time: '03:30 PM – 04:30 PM',
        type: 'Fun',
        points: 15,
        blurb: 'Hilarious speed-eating challenge for brave foodies with instant prizes.',
      },
    ],
    day2Events: [
      {
        id: 'feast-of-champions',
        title: 'Feast of Champions & Food Carnival',
        time: '11:00 AM – 07:00 PM',
        type: 'Hospitality',
        points: 0,
        blurb: 'All artisan stalls active with special Day 2 festival combos and desserts.',
      },
    ],
  },
  {
    id: 'registration-desk',
    name: 'Registration & Help Desk',
    subtitle: 'Arrival Bureau & Information',
    category: 'Administration',
    icon: '✦',
    x: 63.5,
    y: 77.7,
    description:
      'The primary check-in pavilion for all registered participants, spot registrations, delegate kit distribution, lost-and-found bureau, and festival volunteer support.',
    landmarks: ['Participant Check-in Counters', 'VIP & Faculty Help Desk', 'Information Bulletin Board'],
    day1Events: [
      {
        id: 'delegate-checkin',
        title: 'Participant Check-In & Kit Distribution',
        time: '08:30 AM – 11:30 AM',
        type: 'Admin',
        points: 0,
        blurb: 'Collect your official badge, Harry Potter lanyard, event schedule, and entry pass.',
      },
      {
        id: 'spot-reg-d1',
        title: 'Spot Registrations for Gaming & Talks',
        time: '09:00 AM – 01:00 PM',
        type: 'Admin',
        points: 0,
        blurb: 'Limited spot registration slots for open gaming tournaments and workshops.',
      },
    ],
    day2Events: [
      {
        id: 'spot-reg-d2',
        title: 'Day 2 Help Desk & Certificate Verification',
        time: '09:00 AM – 04:00 PM',
        type: 'Admin',
        points: 0,
        blurb: 'Collect certificates, verify attendance, and submit contest submissions.',
      },
    ],
  },
  {
    id: 'event-entrance',
    name: 'Event Entrance',
    subtitle: 'Gothic Castle Gateway',
    category: 'Welcome Portal',
    icon: '✦',
    x: 42.5,
    y: 89.5,
    description:
      'The monumental stone archway marking the formal threshold into AJ-ASTRIX 2K27. Adorned with house crests, photo-ops, security scan point, and welcoming heraldry.',
    landmarks: ['Grand Gothic Stone Archway', 'House Crest Banners', 'Security & QR Scanning Point'],
    day1Events: [
      {
        id: 'gates-open-d1',
        title: 'Festival Gates Open: Day 1',
        time: '08:00 AM Sharp',
        type: 'Welcome',
        points: 0,
        blurb: 'Entry through QR security check. Welcoming music and student volunteers.',
      },
    ],
    day2Events: [
      {
        id: 'gates-open-d2',
        title: 'Festival Gates Open: Day 2',
        time: '08:30 AM Sharp',
        type: 'Welcome',
        points: 0,
        blurb: 'Grand finale entry with morning photo opportunities at the stone arch.',
      },
    ],
  },
  {
    id: 'central-castle',
    name: 'Central Courtyard & Fountain',
    subtitle: 'The Heart of Hogwarts',
    category: 'Fountain Plaza',
    icon: '✦',
    x: 49.5,
    y: 52.8,
    description:
      'The bustling stone courtyard around the central enchanted fountain, connecting all main avenues. Hosts informal flash mobs, photo booths, merchandise kiosks, and house rallies.',
    landmarks: ['Enchanted Water Fountain', 'Cobblestone Crossroads', 'Merchandise & Magic Stalls'],
    day1Events: [
      {
        id: 'flash-mob-d1',
        title: 'Hogwarts Surprise Flash Mob',
        time: '01:00 PM – 01:20 PM',
        type: 'Cultural',
        points: 10,
        blurb: 'Spontaneous synchronized dance spectacle by student council dancers.',
      },
      {
        id: 'carnival-d1',
        title: 'Arcane Carnival & Photo Booths',
        time: 'All Day Event',
        type: 'Fun',
        points: 5,
        blurb: 'Get your official sorting photo taken with Hedwig and replica wands.',
      },
    ],
    day2Events: [
      {
        id: 'house-rally',
        title: 'Grand Four-House Cheering Rally',
        time: '12:30 PM – 01:00 PM',
        type: 'Fun',
        points: 20,
        blurb: 'Gryffindor, Slytherin, Ravenclaw, and Hufflepuff battle in chants and spirit.',
      },
    ],
  },
  {
    id: 'owl-post',
    name: "Hedwig's Owl Post",
    subtitle: 'Enchanted Messenger & Bureau',
    category: 'Magical Dispatch',
    icon: '✦',
    x: 8.5,
    y: 86.0,
    description:
      'The beloved snowy owl delivery service carrying official Hogwarts acceptance letters, sealed fest parchment scrolls, lost property dispatches, and commemorative postcards.',
    landmarks: ['Snowy Owl Roost', 'Wax Seal Stamping Station', 'Fest Postcard Box'],
    day1Events: [
      {
        id: 'owl-dispatch-d1',
        title: 'Wax Seal Letter Writing & Owl Delivery',
        time: '10:00 AM – 06:00 PM',
        type: 'Fun',
        points: 5,
        blurb: 'Craft custom Harry Potter sealed letters and send them to friends at the fest.',
      },
    ],
    day2Events: [
      {
        id: 'owl-dispatch-d2',
        title: 'Commemorative Fest Postcards',
        time: '10:00 AM – 05:00 PM',
        type: 'Fun',
        points: 5,
        blurb: 'Collect limited edition AJ-ASTRIX 2K27 postal stamps and parchment prints.',
      },
    ],
  },
]

export interface ScheduleDay {
  dayNumber: 1 | 2
  title: string
  subtitle: string
  events: {
    id: string
    title: string
    time: string
    locationId: string
    locationName: string
    category: string
    points?: number
    blurb: string
  }[]
}

export const FEST_SCHEDULE: ScheduleDay[] = [
  {
    dayNumber: 1,
    title: 'Day 1 — The Beginning',
    subtitle: 'Sat, 25 October 2027',
    events: [
      {
        id: 'd1-gates',
        title: 'Festival Gates Open & Welcome Procession',
        time: '08:00 AM',
        locationId: 'event-entrance',
        locationName: 'Event Entrance',
        category: 'Welcome',
        blurb: 'Entry through QR security check and student council welcome.',
      },
      {
        id: 'd1-reg',
        title: 'Delegate Registration & Kit Collection',
        time: '08:30 AM',
        locationId: 'registration-desk',
        locationName: 'Registration & Help Desk',
        category: 'Admin',
        blurb: 'Collect your fest pass, badge, lanyard, and schedule booklet.',
      },
      {
        id: 'd1-inauguration',
        title: 'Inauguration Ceremony & Lamp Lighting',
        time: '09:30 AM',
        locationId: 'main-auditorium',
        locationName: 'Main Auditorium',
        category: 'Ceremony',
        points: 20,
        blurb: 'Formal opening ceremony with dignitaries and fest anthem.',
      },
      {
        id: 'd1-keynote',
        title: 'Keynote Address: Born From Fire',
        time: '11:15 AM',
        locationId: 'main-auditorium',
        locationName: 'Main Auditorium',
        category: 'Keynote',
        points: 15,
        blurb: 'Visionary address on innovation, AI sorcery, and creativity.',
      },
      {
        id: 'd1-workshops',
        title: 'Workshops & Talks: GenAI Architectures',
        time: '10:30 AM',
        locationId: 'workshop-halls',
        locationName: 'Workshop Halls',
        category: 'Workshops',
        points: 20,
        blurb: 'Hands-on session building multi-agent AI systems with experts.',
      },
      {
        id: 'd1-gaming',
        title: 'Gaming Zone: Valorant & FIFA Battles',
        time: '10:30 AM',
        locationId: 'gaming-zone',
        locationName: 'Gaming Zone',
        category: 'Gaming',
        points: 40,
        blurb: '16-team double elimination esports tournament begins.',
      },
      {
        id: 'd1-hackathon',
        title: 'Technical Events: Hackathon Pitch Rounds',
        time: '02:00 PM',
        locationId: 'main-auditorium',
        locationName: 'Main Auditorium',
        category: 'Technical',
        points: 50,
        blurb: 'Finalist teams present working prototypes to industry judges.',
      },
      {
        id: 'd1-bands',
        title: 'Cultural Events: Battle of the Bands',
        time: '01:30 PM',
        locationId: 'cultural-stage',
        locationName: 'Cultural Stage',
        category: 'Cultural',
        points: 45,
        blurb: 'High-voltage electric and acoustic musical competition.',
      },
      {
        id: 'd1-dance',
        title: 'Cultural Events: Dance Night Showcase',
        time: '05:30 PM',
        locationId: 'cultural-stage',
        locationName: 'Cultural Stage',
        category: 'Cultural',
        points: 50,
        blurb: 'Themed choreography battles and spectacle under the night sky.',
      },
    ],
  },
  {
    dayNumber: 2,
    title: 'Day 2 — The Grand Finale',
    subtitle: 'Sun, 26 October 2027',
    events: [
      {
        id: 'd2-esports',
        title: 'Gaming Zone: Esports Grand Championship',
        time: '10:00 AM',
        locationId: 'gaming-zone',
        locationName: 'Gaming Zone',
        category: 'Gaming',
        points: 50,
        blurb: 'Live-casted grand final matches on main display boards.',
      },
      {
        id: 'd2-tech-quiz',
        title: 'Competitions Continue: Tech & Lore Quiz',
        time: '11:00 AM',
        locationId: 'main-auditorium',
        locationName: 'Main Auditorium',
        category: 'Technical',
        points: 40,
        blurb: 'Fast-paced buzzer quiz deciding final academic points.',
      },
      {
        id: 'd2-web3',
        title: 'Workshops & Talks: 3D Web & Shaders',
        time: '10:00 AM',
        locationId: 'workshop-halls',
        locationName: 'Workshop Halls',
        category: 'Workshops',
        points: 20,
        blurb: 'Interactive masterclass on Three.js, GLSL, and spatial web.',
      },
      {
        id: 'd2-finale-perf',
        title: 'Finale Performances: Headliner Band Jam',
        time: '01:30 PM',
        locationId: 'cultural-stage',
        locationName: 'Cultural Stage',
        category: 'Cultural',
        points: 30,
        blurb: 'Headline artist performance and all-star musical jam session.',
      },
      {
        id: 'd2-prizes',
        title: 'Prize Distribution Ceremony',
        time: '03:00 PM',
        locationId: 'main-auditorium',
        locationName: 'Main Auditorium',
        category: 'Ceremony',
        blurb: 'Medals, trophies, cash awards, and certificates awarded to winners.',
      },
      {
        id: 'd2-closing',
        title: 'Closing Ceremony & House Cup Champion',
        time: '04:30 PM',
        locationId: 'main-auditorium',
        locationName: 'Main Auditorium',
        category: 'Ceremony',
        points: 100,
        blurb: 'Grand fest finale, House Cup presentation, and farewell celebration.',
      },
    ],
  },
]

