export interface QuoteItem {
  id: number;
  quote: string;
  author: string;
  category: 'Focus' | 'Discipline' | 'Mindset' | 'Perseverance' | 'Curiosity' | 'Consistency' | 'Mastery';
  tip: string;
  emoji: string;
}

export const MOTIVATIONAL_QUOTES: QuoteItem[] = [
  {
    id: 1,
    quote: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
    category: "Discipline",
    tip: "Break your target task into 25-minute sprints to eliminate friction.",
    emoji: "🚀"
  },
  {
    id: 2,
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    category: "Perseverance",
    tip: "Focus on finishing just one Pomodoro cycle before judging your progress.",
    emoji: "🌟"
  },
  {
    id: 3,
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    category: "Consistency",
    tip: "Consistency over intensity—small daily study blocks yield giant long-term gains.",
    emoji: "⚡"
  },
  {
    id: 4,
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    category: "Curiosity",
    tip: "Approach complex topics with active inquiry rather than passive reading.",
    emoji: "🔥"
  },
  {
    id: 5,
    quote: "Focus is a muscle. The more you practice single-tasking, the stronger it grows.",
    author: "Cal Newport",
    category: "Focus",
    tip: "Close extra browser tabs and put your mobile phone out of reach.",
    emoji: "🎯"
  },
  {
    id: 6,
    quote: "Somewhere, something incredible is waiting to be known.",
    author: "Carl Sagan",
    category: "Curiosity",
    tip: "Stay curious—every topic you master expands your universe of understanding.",
    emoji: "🌌"
  },
  {
    id: 7,
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "Mindset",
    tip: "Overcome starting inertia by committing to just 5 minutes of focused work.",
    emoji: "✨"
  },
  {
    id: 8,
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    category: "Consistency",
    tip: "Track your daily study streak to build momentum every single day.",
    emoji: "📈"
  },
  {
    id: 9,
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    category: "Mastery",
    tip: "Knowledge gained today stays with you as a permanent superpower.",
    emoji: "🧠"
  },
  {
    id: 10,
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    category: "Discipline",
    tip: "Stop overthinking your study plan—hit start on the timer and begin.",
    emoji: "🔑"
  },
  {
    id: 11,
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    category: "Curiosity",
    tip: "Never stop building your knowledge base; lifelong learning is true power.",
    emoji: "💡"
  },
  {
    id: 12,
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    category: "Mindset",
    tip: "When a subject feels difficult, that is the exact moment your neural pathways are growing.",
    emoji: "🧬"
  },
  {
    id: 13,
    quote: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
    category: "Perseverance",
    tip: "Make today count by completing your targeted daily study minutes.",
    emoji: "🏆"
  },
  {
    id: 14,
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    category: "Mastery",
    tip: "Embrace initial mistakes as necessary stepping stones toward mastery.",
    emoji: "🌱"
  },
  {
    id: 15,
    quote: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery",
    category: "Mindset",
    tip: "Your future self will benefit enormously from the effort you invest right now.",
    emoji: "🛸"
  },
  {
    id: 16,
    quote: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.",
    author: "Alexander Graham Bell",
    category: "Focus",
    tip: "Channel all your attention into a single study task for deep efficiency.",
    emoji: "☀️"
  },
  {
    id: 17,
    quote: "What we achieve inwardly will change outer reality.",
    author: "Plutarch",
    category: "Mindset",
    tip: "Cultivate mental focus and self-discipline to transform your academic outcomes.",
    emoji: "🌌"
  },
  {
    id: 18,
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "Consistency",
    tip: "1% improvement each day compound into massive transformations over a month.",
    emoji: "💎"
  },
  {
    id: 19,
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    category: "Discipline",
    tip: "Silence digital noise and focus on what is strictly under your control.",
    emoji: "🏛️"
  },
  {
    id: 20,
    quote: "Genius is 1% inspiration and 99% perspiration.",
    author: "Thomas Edison",
    category: "Perseverance",
    tip: "Deliberate practice and structured study blocks build true expertise.",
    emoji: "💡"
  },
  {
    id: 21,
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "Mastery",
    tip: "Time spent learning is the highest ROI activity in your daily schedule.",
    emoji: "⭐"
  },
  {
    id: 22,
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
    category: "Perseverance",
    tip: "Don't wait for ideal study conditions—begin with the tools you have right now.",
    emoji: "🛰️"
  },
  {
    id: 23,
    quote: "Clear eyes, full heart, can't lose.",
    author: "Buzz Bissinger",
    category: "Mindset",
    tip: "Approach your study session with clarity and intention.",
    emoji: "🌠"
  },
  {
    id: 24,
    quote: "Energy and persistence conquer all things.",
    author: "Benjamin Franklin",
    category: "Perseverance",
    tip: "Take standard 5-minute study breaks to recharge your energy between sessions.",
    emoji: "⚡"
  },
  {
    id: 25,
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "Discipline",
    tip: "Launch your timer immediately—momentum builds automatically once you start.",
    emoji: "🚀"
  },
  {
    id: 26,
    quote: "Be so good they can't ignore you.",
    author: "Steve Martin",
    category: "Mastery",
    tip: "Aim for deep comprehension rather than superficial skimming.",
    emoji: "👑"
  },
  {
    id: 27,
    quote: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more.",
    author: "Marie Curie",
    category: "Curiosity",
    tip: "Transform anxiety into curiosity when encountering challenging problem sets.",
    emoji: "⚛️"
  },
  {
    id: 28,
    quote: "If you can'explain it simply, you don't understand it well enough.",
    author: "Richard Feynman",
    category: "Mastery",
    tip: "Use the Feynman technique: test your mastery by teaching the concept in plain terms.",
    emoji: "🧩"
  },
  {
    id: 29,
    quote: "Patience, persistence and perspiration make an unbeatable combination for success.",
    author: "Napoleon Hill",
    category: "Perseverance",
    tip: "Trust the study process and stay patient with complex subjects.",
    emoji: "⏳"
  },
  {
    id: 30,
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "Mindset",
    tip: "Maintain a growth mindset—ability grows with effort and strategy.",
    emoji: "🌈"
  },
  {
    id: 31,
    quote: "The function of education is to teach one to think intensively and to think critically.",
    author: "Martin Luther King Jr.",
    category: "Focus",
    tip: "Challenge assumptions and ask deep questions while taking study notes.",
    emoji: "🎓"
  },
  {
    id: 32,
    quote: "Never give up on a dream just because of the time it will take to accomplish it.",
    author: "Earl Nightingale",
    category: "Consistency",
    tip: "The time will pass anyway; make sure you spend it moving forward.",
    emoji: "⌛"
  },
  {
    id: 33,
    quote: "Only those who dare to fail greatly can ever achieve greatly.",
    author: "Robert F. Kennedy",
    category: "Mindset",
    tip: "Practice problems you might get wrong—that is where real learning lives.",
    emoji: "🌌"
  },
  {
    id: 34,
    quote: "Knowledge is power. Information is liberating.",
    author: "Kofi Annan",
    category: "Mastery",
    tip: "Organize your study notes systematically so you can retrieve facts easily.",
    emoji: "📚"
  },
  {
    id: 35,
    quote: "I find that the harder I work, the more luck I seem to have.",
    author: "Thomas Jefferson",
    category: "Discipline",
    tip: "Luck is what happens when preparation meets opportunity.",
    emoji: "🍀"
  },
  {
    id: 36,
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: "Mindset",
    tip: "Replace self-doubt with deliberate focus sessions and small daily wins.",
    emoji: "✨"
  },
  {
    id: 37,
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "Perseverance",
    tip: "Keep showing up even when a study session feels sluggish.",
    emoji: "🛡️"
  },
  {
    id: 38,
    quote: "Look up at the stars and not down at your feet. Try to make sense of what you see.",
    author: "Stephen Hawking",
    category: "Curiosity",
    tip: "Keep your vision broad and inspiring while executing micro-tasks.",
    emoji: "🔭"
  },
  {
    id: 39,
    quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: "Mastery",
    tip: "Focus on building character, study habits, and intellectual strength.",
    emoji: "🌟"
  },
  {
    id: 40,
    quote: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
    category: "Mindset",
    tip: "Every new day presents a fresh baseline to elevate your skills.",
    emoji: "🪐"
  },
  {
    id: 41,
    quote: "There are no shortcuts to any place worth going.",
    author: "Beverly Sills",
    category: "Discipline",
    tip: "Embrace deep work blocks over quick skimming for lasting retention.",
    emoji: "⛰️"
  },
  {
    id: 42,
    quote: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    category: "Consistency",
    tip: "Start your first 25-minute Pomodoro right now to begin the journey.",
    emoji: "🐾"
  },
  {
    id: 43,
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "Focus",
    tip: "Turn intentions into action by launching your focus study session.",
    emoji: "🎬"
  },
  {
    id: 44,
    quote: "It's not that I'm so smart, it's just that I stay with problems longer.",
    author: "Albert Einstein",
    category: "Perseverance",
    tip: "Stamina and grit separate good students from great thinkers.",
    emoji: "🎯"
  },
  {
    id: 45,
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    category: "Curiosity",
    tip: "Your study hours build the capability to impact the world around you.",
    emoji: "🌍"
  },
  {
    id: 46,
    quote: "Small deeds done are better than great deeds planned.",
    author: "Peter Marshall",
    category: "Consistency",
    tip: "A completed 20-minute session beats an unexecuted 4-hour study plan.",
    emoji: "✅"
  },
  {
    id: 47,
    quote: "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
    author: "Mary Anne Radmacher",
    category: "Perseverance",
    tip: "Rest well during breaks so you can return refreshed and ready to focus.",
    emoji: "🌙"
  },
  {
    id: 48,
    quote: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.",
    author: "Jimmy Dean",
    category: "Mindset",
    tip: "Adapt your study techniques based on your reflection notes and feedback.",
    emoji: "⛵"
  },
  {
    id: 49,
    quote: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    category: "Focus",
    tip: "Prioritize high-impact study targets over passive busywork.",
    emoji: "🎯"
  },
  {
    id: 50,
    quote: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
    category: "Curiosity",
    tip: "Choose willingness today—open your study notes with enthusiasm.",
    emoji: "🎁"
  },
  {
    id: 51,
    quote: "Failure is simply the opportunity to begin again, this time more intelligently.",
    author: "Henry Ford",
    category: "Mindset",
    tip: "Review missed quiz questions to pinpoint exactly where to strengthen your focus.",
    emoji: "🔄"
  },
  {
    id: 52,
    quote: "Great things are done by a series of small things brought together.",
    author: "Vincent van Gogh",
    category: "Consistency",
    tip: "Stack your Pomodoro cycles daily to craft your masterpiece of knowledge.",
    emoji: "🎨"
  }
];

/**
 * Returns today's deterministic daily quote based on the current date (YYYY-MM-DD).
 * Ensures every day brings a fresh quote for every user!
 */
export function getDailyQuote(date: Date = new Date()): QuoteItem {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = Math.abs(dayOfYear) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

/**
 * Gets a random quote excluding an optional current quote ID
 */
export function getRandomQuote(currentId?: number): QuoteItem {
  const pool = currentId 
    ? MOTIVATIONAL_QUOTES.filter(q => q.id !== currentId)
    : MOTIVATIONAL_QUOTES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
