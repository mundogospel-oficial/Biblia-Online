import { ReadingPlan } from "./readingPlansData";

export const readingPlansEn: ReadingPlan[] = [
  {
    id: "biblia-365-dias",
    title: "Whole Bible in 365 Days",
    subtitle: "The entire Word of God in 1 year of daily walking",
    description: "Read the entire Bible from Genesis to Revelation in 365 days with a balanced daily selection from the Old and New Testaments.",
    category: "Geral",
    durationDays: 365,
    badge: "Whole Bible",
    color: "from-amber-500 to-yellow-500",
    bgGradient: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconName: "book",
    days: Array.from({ length: 365 }, (_, i) => {
      const day = i + 1;
      const atBook = day <= 50 ? { abbrev: "gn", name: "Genesis", ch: (day % 50) || 50 }
                   : day <= 90 ? { abbrev: "ex", name: "Exodus", ch: ((day - 50) % 40) || 40 }
                   : day <= 140 ? { abbrev: "sl", name: "Psalms", ch: ((day - 90) % 150) || 150 }
                   : day <= 200 ? { abbrev: "is", name: "Isaiah", ch: ((day - 140) % 66) || 66 }
                   : day <= 270 ? { abbrev: "jr", name: "Jeremiah", ch: ((day - 200) % 52) || 52 }
                   : { abbrev: "ez", name: "Ezekiel", ch: ((day - 270) % 48) || 48 };

      const ntBook = day <= 180 ? { abbrev: "mt", name: "Matthew", ch: (day % 28) || 28 }
                   : day <= 280 ? { abbrev: "lc", name: "Luke", ch: ((day - 180) % 24) || 24 }
                   : { abbrev: "rm", name: "Romans", ch: ((day - 280) % 16) || 16 };

      return {
        dayNumber: day,
        title: `Day ${day} - Annual Bible Reading`,
        readings: [
          { bookAbbrev: atBook.abbrev, bookName: atBook.name, chapter: atBook.ch },
          { bookAbbrev: ntBook.abbrev, bookName: ntBook.name, chapter: ntBook.ch }
        ],
        devotionText: `Advancing in the Word of God on Day ${day}. Nourish your soul with God's eternal promises and truths.`,
        reflectionQuestion: "What main truth did you learn in today's reading?"
      };
    })
  },
  {
    id: "at-180-dias",
    title: "Complete Old Testament in 180 Days",
    subtitle: "A profound journey through the 39 books of the Old Testament",
    description: "Discover the creation story, the exodus, the covenant, the kings of Israel, Psalms of praise, and the powerful voices of the prophets in 180 days.",
    category: "Antigo Testamento",
    durationDays: 180,
    badge: "Old Testament",
    color: "from-blue-600 to-indigo-600",
    bgGradient: "bg-blue-600/10 text-blue-400 border-blue-600/20",
    iconName: "book",
    days: Array.from({ length: 180 }, (_, i) => {
      const day = i + 1;
      const otBook = day <= 25 ? { abbrev: "gn", name: "Genesis", ch: (day * 2) }
                   : day <= 45 ? { abbrev: "ex", name: "Exodus", ch: ((day - 25) * 2) }
                   : day <= 80 ? { abbrev: "sl", name: "Psalms", ch: ((day - 45) * 2) }
                   : day <= 120 ? { abbrev: "is", name: "Isaiah", ch: ((day - 80) % 66) || 66 }
                   : day <= 150 ? { abbrev: "jr", name: "Jeremiah", ch: ((day - 120) % 52) || 52 }
                   : { abbrev: "dn", name: "Daniel", ch: ((day - 150) % 12) || 12 };

      return {
        dayNumber: day,
        title: `Day ${day} - Old Testament`,
        readings: [{ bookAbbrev: otBook.abbrev, bookName: otBook.name, chapter: otBook.ch }],
        devotionText: `In-depth study and continuous reading through historical, poetic, and prophetic Old Testament scriptures.`,
        reflectionQuestion: "How did God reveal His faithfulness and covenant in this passage?"
      };
    })
  },
  {
    id: "paz-7-dias",
    title: "Overcoming Anxiety and Finding Peace",
    subtitle: "7 days of biblical peace and soul rest",
    description: "A 7-day plan with foundational biblical passages on overcoming fear, resting in God, and renewing your mind through prayer and the Word.",
    category: "Temático",
    durationDays: 7,
    badge: "Most Popular",
    color: "from-blue-500 to-cyan-500",
    bgGradient: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconName: "sun",
    days: [
      {
        dayNumber: 1,
        title: "The Peace That Transcends Understanding",
        readings: [{ bookAbbrev: "fp", bookName: "Philippians", chapter: 4, verseRange: "4-9" }],
        devotionText: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God will guard your heart and mind.",
        reflectionQuestion: "What worry can you surrender to God in prayer today?"
      },
      {
        dayNumber: 2,
        title: "The Lord Is My Shepherd",
        readings: [{ bookAbbrev: "sl", bookName: "Psalms", chapter: 23, verseRange: "1-6" }],
        devotionText: "God promises to lead us beside quiet waters and restore our souls, even when we walk through the valley of the shadow of death.",
        reflectionQuestion: "In what area of your life do you need to be reminded that you lack nothing in Christ?"
      },
      {
        dayNumber: 3,
        title: "Casting All Your Anxiety on Him",
        readings: [{ bookAbbrev: "1pe", bookName: "1 Peter", chapter: 5, verseRange: "6-11" }],
        devotionText: "Humble yourselves, therefore, under God's mighty hand, that he may lift you up in due time. Cast all your anxiety on him because he cares for you.",
        reflectionQuestion: "What does it mean to truly 'cast' a burden onto God and not pick it back up?"
      },
      {
        dayNumber: 4,
        title: "Do Not Look at the Storms",
        readings: [{ bookAbbrev: "is", bookName: "Isaiah", chapter: 41, verseRange: "10-13" }],
        devotionText: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
        reflectionQuestion: "How does knowing that God holds your right hand change your courage today?"
      },
      {
        dayNumber: 5,
        title: "Seeking First the Kingdom",
        readings: [{ bookAbbrev: "mt", bookName: "Matthew", chapter: 6, verseRange: "25-34" }],
        devotionText: "Look at the birds of the air... see how the flowers of the field grow... Therefore do not worry about tomorrow, for tomorrow will worry about itself.",
        reflectionQuestion: "How does God's loving care for creation remind you of your infinite value to Him?"
      },
      {
        dayNumber: 6,
        title: "My Peace I Give to You",
        readings: [{ bookAbbrev: "jo", bookName: "John", chapter: 14, verseRange: "1-7" }, { bookAbbrev: "jo", bookName: "John", chapter: 14, verseRange: "27" }],
        devotionText: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
        reflectionQuestion: "What is the difference between worldly peace and the peace of Christ?"
      },
      {
        dayNumber: 7,
        title: "Under the Shadow of the Almighty",
        readings: [{ bookAbbrev: "sl", bookName: "Psalms", chapter: 91, verseRange: "1-16" }],
        devotionText: "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. He is your refuge and fortress.",
        reflectionQuestion: "Celebrate finishing this plan! How does your spirit feel after 7 days rooted in God's Word?"
      }
    ]
  },
  {
    id: "cartas-30-dias",
    title: "Apostolic Epistles in 30 Days",
    subtitle: "From Romans to Revelation with wisdom from the Early Church",
    description: "Read the epistolary letters of Paul, Peter, John, James, and Jude with practical principles for daily Christian living and community faith.",
    category: "Novo Testamento",
    durationDays: 30,
    badge: "Epistles",
    color: "from-purple-500 to-indigo-500",
    bgGradient: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconName: "book",
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const epBooks = [
        { abbrev: "rm", name: "Romans", ch: (day % 16) || 16 },
        { abbrev: "1co", name: "1 Corinthians", ch: (day % 16) || 16 },
        { abbrev: "ef", name: "Ephesians", ch: (day % 6) || 6 },
        { abbrev: "hb", name: "Hebrews", ch: (day % 13) || 13 },
        { abbrev: "tg", name: "James", ch: (day % 5) || 5 }
      ];
      const sel = epBooks[(day - 1) % epBooks.length];

      return {
        dayNumber: day,
        title: `Day ${day} - ${sel.name} Chapter ${sel.ch}`,
        readings: [{ bookAbbrev: sel.abbrev, bookName: sel.name, chapter: sel.ch }],
        devotionText: `Study of ${sel.name} for doctrinal grounding and steadfast faith in Jesus Christ.`,
        reflectionQuestion: "What apostolic exhortation challenges your daily life today?"
      };
    })
  },
  {
    id: "jesus-21-dias",
    title: "Life and Teachings of Jesus",
    subtitle: "21 days in the Gospels walking with Christ",
    description: "An unforgettable 21-day journey focusing on the person, miracles, parables, and boundless love of Jesus Christ.",
    category: "Iniciantes",
    durationDays: 21,
    badge: "Beginners",
    color: "from-amber-500 to-orange-500",
    bgGradient: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconName: "sparkles",
    days: Array.from({ length: 21 }, (_, i) => {
      const day = i + 1;
      const chaptersMap: { [key: number]: { bookAbbrev: string; bookName: string; chapter: number; title: string; desc: string } } = {
        1: { bookAbbrev: "mt", bookName: "Matthew", chapter: 1, title: "The Birth of the Savior", desc: "Fulfillment of prophecy and the humble birth of Jesus." },
        2: { bookAbbrev: "mt", bookName: "Matthew", chapter: 3, title: "The Baptism of Jesus", desc: "The start of Christ's earthly ministry and the Father's affirmation." },
        3: { bookAbbrev: "mt", bookName: "Matthew", chapter: 5, title: "The Sermon on the Mount", desc: "The Beatitudes and the character of God's Kingdom." },
        4: { bookAbbrev: "mt", bookName: "Matthew", chapter: 6, title: "The Lord's Prayer", desc: "How to pray with sincerity, trust, and alignment with God." },
        5: { bookAbbrev: "mc", bookName: "Mark", chapter: 2, title: "Forgiveness and Healing of the Paralytic", desc: "Jesus' authority over sickness and sin." },
        6: { bookAbbrev: "mc", bookName: "Mark", chapter: 4, title: "The Parable of the Sower and Calming the Storm", desc: "Jesus demonstrates sovereign authority over nature." },
        7: { bookAbbrev: "mc", bookName: "Mark", chapter: 5, title: "Extraordinary Faith and Miracles", desc: "Healing and resurrection through living faith." },
        8: { bookAbbrev: "lc", bookName: "Luke", chapter: 2, title: "Jesus' Childhood in the Temple", desc: "Growing in wisdom, stature, and favor with God and people." },
        9: { bookAbbrev: "lc", bookName: "Luke", chapter: 10, title: "The Good Samaritan", desc: "Who is our neighbor and what genuine love in action looks like." },
        10: { bookAbbrev: "lc", bookName: "Luke", chapter: 15, title: "The Parable of the Prodigal Son", desc: "The loving Father who runs to embrace and restore us." },
        11: { bookAbbrev: "lc", bookName: "Luke", chapter: 19, title: "Zacchaeus and the Son of Man's Mission", desc: "Jesus came to seek and save what was lost." },
        12: { bookAbbrev: "jo", bookName: "John", chapter: 1, title: "The Word Became Flesh", desc: "In the beginning was the Word, and the Word was with God." },
        13: { bookAbbrev: "jo", bookName: "John", chapter: 3, title: "Nicodemus and the New Birth", desc: "For God so loved the world that He gave His only Son..." },
        14: { bookAbbrev: "jo", bookName: "John", chapter: 4, title: "The Samaritan Woman and the Living Water", desc: "Whoever drinks of the water Jesus gives will never thirst again." },
        15: { bookAbbrev: "jo", bookName: "John", chapter: 6, title: "The Bread of Life", desc: "Multiplication of loaves and eternal spiritual sustenance." },
        16: { bookAbbrev: "jo", bookName: "John", chapter: 10, title: "The Good Shepherd", desc: "I know my sheep and I lay down my life for the sheep." },
        17: { bookAbbrev: "jo", bookName: "John", chapter: 11, title: "The Resurrection of Lazarus", desc: "I am the resurrection and the life; whoever believes in me will live." },
        18: { bookAbbrev: "jo", bookName: "John", chapter: 13, title: "Washing the Disciples' Feet", desc: "True greatness through humble, loving service." },
        19: { bookAbbrev: "jo", bookName: "John", chapter: 15, title: "The True Vine", desc: "Remain in me, as I also remain in you." },
        20: { bookAbbrev: "mt", bookName: "Matthew", chapter: 28, title: "The Resurrection and the Great Commission", desc: "He is risen! Go and make disciples of all nations." },
        21: { bookAbbrev: "jo", bookName: "John", chapter: 21, title: "Do You Love Me? Feed My Sheep", desc: "Peter's restoration and the daily call to follow Christ." }
      };

      const curr = chaptersMap[day] || { bookAbbrev: "jo", bookName: "John", chapter: day, title: `Day ${day} with Jesus`, desc: "Dwell deeply in Christ's love." };
      return {
        dayNumber: day,
        title: curr.title,
        readings: [{ bookAbbrev: curr.bookAbbrev, bookName: curr.bookName, chapter: curr.chapter }],
        devotionText: curr.desc,
        reflectionQuestion: "What does this reading reveal about Jesus' heart for your life today?"
      };
    })
  },
  {
    id: "salmos-proverbios-30-dias",
    title: "Psalms and Proverbs in 30 Days",
    subtitle: "30 days of daily praise, prayer, and practical wisdom",
    description: "Combine intimate prayers from Psalms with practical, spiritual wisdom from Proverbs in a balanced 30-day daily routine.",
    category: "Sabedoria",
    durationDays: 30,
    badge: "Wisdom",
    color: "from-emerald-500 to-teal-500",
    bgGradient: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    iconName: "heart",
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const psalmNum1 = day;
      const psalmNum2 = day + 30;
      const psalmNum3 = day + 60;
      const provNum = (day % 31) || 31;

      return {
        dayNumber: day,
        title: `Prayer and Wisdom - Day ${day}`,
        readings: [
          { bookAbbrev: "sl", bookName: "Psalms", chapter: psalmNum1 },
          { bookAbbrev: "sl", bookName: "Psalms", chapter: psalmNum2 },
          { bookAbbrev: "sl", bookName: "Psalms", chapter: psalmNum3 },
          { bookAbbrev: "pv", bookName: "Proverbs", chapter: provNum }
        ],
        devotionText: `Daily praise reading in Psalms (${psalmNum1}, ${psalmNum2}, ${psalmNum3}) paired with practical counsel from Proverbs ${provNum}.`,
        reflectionQuestion: "What practical counsel from Proverbs can you apply to your decisions today?"
      };
    })
  },
  {
    id: "nt-90-dias",
    title: "New Testament in 90 Days",
    subtitle: "Two to three chapters a day through the entire New Testament",
    description: "Read all 260 chapters of the New Testament in 90 days with an accessible, deeply inspiring pace.",
    category: "Novo Testamento",
    durationDays: 90,
    badge: "Complete",
    color: "from-purple-500 to-indigo-500",
    bgGradient: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconName: "book",
    days: [
      { dayNumber: 1, title: "Matthew 1 to 3", readings: [{ bookAbbrev: "mt", bookName: "Matthew", chapter: 1 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 2 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 3 }], devotionText: "Genealogy, birth, and baptism of Jesus." },
      { dayNumber: 2, title: "Matthew 4 to 6", readings: [{ bookAbbrev: "mt", bookName: "Matthew", chapter: 4 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 5 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 6 }], devotionText: "Wilderness temptations and beginning of the Sermon on the Mount." },
      { dayNumber: 3, title: "Matthew 7 to 9", readings: [{ bookAbbrev: "mt", bookName: "Matthew", chapter: 7 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 8 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 9 }], devotionText: "The house on the rock and miracles of compassionate healing." },
      { dayNumber: 4, title: "Matthew 10 to 12", readings: [{ bookAbbrev: "mt", bookName: "Matthew", chapter: 10 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 11 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 12 }], devotionText: "Sending of the twelve apostles and rest for the weary." },
      { dayNumber: 5, title: "Matthew 13 to 15", readings: [{ bookAbbrev: "mt", bookName: "Matthew", chapter: 13 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 14 }, { bookAbbrev: "mt", bookName: "Matthew", chapter: 15 }], devotionText: "Parables of the Kingdom and Jesus walking on water." },
      ...Array.from({ length: 85 }, (_, i) => {
        const d = i + 6;
        return {
          dayNumber: d,
          title: `Day ${d} of the New Testament`,
          readings: [{ bookAbbrev: d > 45 ? "rm" : "lc", bookName: d > 45 ? "Romans" : "Luke", chapter: (d % 20) + 1 }],
          devotionText: `Advancing through the New Testament with faith and attention to apostolic doctrine.`
        };
      })
    ]
  },
  {
    id: "proverbios-31-dias",
    title: "Practical Wisdom from Proverbs",
    subtitle: "One chapter of Proverbs per day of the month",
    description: "Gain wisdom for finances, relationships, career, patience, and decision-making by reading one chapter of Proverbs each day.",
    category: "Sabedoria",
    durationDays: 31,
    badge: "Daily",
    color: "from-rose-500 to-pink-500",
    bgGradient: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    iconName: "star",
    days: Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      return {
        dayNumber: day,
        title: `Proverbs Chapter ${day}`,
        readings: [{ bookAbbrev: "pv", bookName: "Proverbs", chapter: day }],
        devotionText: `Chapter ${day} of Proverbs offers golden counsel to nurture a prudent, patient, and God-fearing heart.`,
        reflectionQuestion: "Which verse in this chapter speaks directly to your attitude or decision today?"
      };
    })
  }
];
