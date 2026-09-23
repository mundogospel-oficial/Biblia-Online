import { BiblicalMapTheme } from "./biblicalMapsData";

export const biblicalMapsEn: BiblicalMapTheme[] = [
  {
    id: "viagens-paulo",
    title: "Paul's Missionary Journeys",
    subtitle: "The expansion of the Gospel through the Roman Empire and the Mediterranean",
    era: "paulo",
    region: "Mediterranean Sea (Greece, Turkey, Italy, Israel)",
    period: "Approx. 46 AD – 62 AD",
    center: [38.2, 24.5],
    defaultZoom: 5,
    description: "Follow the momentous missionary journeys of the Apostle Paul from Antioch and Jerusalem to Athens, Corinth, Ephesus, and his final testimony in Rome.",
    routeCoordinates: [
      [31.7683, 35.2137], // Jerusalem
      [32.5000, 34.8917], // Caesarea
      [36.2021, 36.1606], // Antioch
      [36.9167, 34.8958], // Tarsus
      [34.7754, 32.4245], // Paphos
      [37.9489, 27.3678], // Ephesus
      [39.7567, 26.1633], // Troas
      [41.0125, 24.2831], // Philippi
      [40.6401, 22.9444], // Thessalonica
      [40.5238, 22.2036], // Berea
      [37.9715, 23.7257], // Athens
      [37.9056, 22.8797], // Corinth
      [37.5303, 27.2764], // Miletus
      [34.9333, 24.8000], // Crete
      [35.9375, 14.3754], // Malta
      [37.0755, 15.2866], // Syracuse
      [41.9028, 12.4964]  // Rome
    ],
    locations: [
      {
        id: "loc-jerusalem",
        name: "Jerusalem",
        modernName: "Jerusalem, Israel",
        lat: 31.7683,
        lng: 35.2137,
        era: "paulo",
        summary: "Cradle of the Early Church and location of the historic Council of Jerusalem.",
        historicalNote: "Paul visited Jerusalem after his conversion and participated in the Council of Jerusalem (Acts 15), confirming salvation by grace for the Gentiles.",
        keyVerse: "Then the apostles and elders, with the whole church, decided to choose some of their own men and send them to Antioch with Paul and Barnabas.",
        reference: "Acts 15:22",
        bookAbbrev: "at",
        chapter: 15,
        verseNum: 22
      },
      {
        id: "loc-cesareia",
        name: "Caesarea Maritima",
        modernName: "Caesarea, Israel",
        lat: 32.5000,
        lng: 34.8917,
        era: "paulo",
        summary: "Roman provincial capital where Paul was imprisoned and testified before Felix, Festus, and King Agrippa.",
        historicalNote: "It was in the governor's residence at Caesarea that Paul appealed to Caesar, securing his fateful voyage to Rome.",
        keyVerse: "Then Agrippa said to Paul, 'Do you think that in such a short time you can persuade me to be a Christian?'",
        reference: "Acts 26:28",
        bookAbbrev: "at",
        chapter: 26,
        verseNum: 28
      },
      {
        id: "loc-antioquia",
        name: "Antioch of Syria",
        modernName: "Antakya, Turkey",
        lat: 36.2021,
        lng: 36.1606,
        era: "paulo",
        summary: "Missionary launching base from which Paul and Barnabas were sent out by the Holy Spirit.",
        historicalNote: "It was in Antioch that disciples were first called 'Christians' in church history.",
        keyVerse: "The disciples were called Christians first at Antioch.",
        reference: "Acts 11:26",
        bookAbbrev: "at",
        chapter: 11,
        verseNum: 26
      },
      {
        id: "loc-tarso",
        name: "Tarsus of Cilicia",
        modernName: "Tarsus, Turkey",
        lat: 36.9167,
        lng: 34.8958,
        era: "paulo",
        summary: "Hometown of the Apostle Paul, a major Greco-Roman intellectual and commercial hub.",
        historicalNote: "Paul was a Roman citizen by birth in Tarsus, a legal status he utilized to proclaim and defend the Gospel.",
        keyVerse: "I am a Jew, born in Tarsus of Cilicia, but brought up in this city. I studied under Gamaliel.",
        reference: "Acts 22:3",
        bookAbbrev: "at",
        chapter: 22,
        verseNum: 3
      },
      {
        id: "loc-pafos",
        name: "Paphos (Cyprus)",
        modernName: "Paphos, Cyprus",
        lat: 34.7754,
        lng: 32.4245,
        era: "paulo",
        summary: "First major stop on the 1st missionary journey; the proconsul Sergius Paulus believed.",
        historicalNote: "Site where Elymas the sorcerer attempted to hinder the Gospel and was struck with temporary blindness.",
        keyVerse: "When the proconsul saw what had happened, he believed, for he was amazed at the teaching about the Lord.",
        reference: "Acts 13:12",
        bookAbbrev: "at",
        chapter: 13,
        verseNum: 12
      },
      {
        id: "loc-efeso",
        name: "Ephesus",
        modernName: "Selçuk, Turkey",
        lat: 37.9489,
        lng: 27.3678,
        era: "paulo",
        summary: "Metropolis of Asia Minor where Paul taught the Word of God for nearly three years.",
        historicalNote: "Home of the Temple of Artemis; Paul's ministry stirred the city and led to a revival where sorcery scrolls were publicly burned.",
        keyVerse: "In this way the word of the Lord spread widely and grew in power.",
        reference: "Acts 19:20",
        bookAbbrev: "at",
        chapter: 19,
        verseNum: 20
      },
      {
        id: "loc-troade",
        name: "Troas",
        modernName: "Çanakkale, Turkey",
        lat: 39.7567,
        lng: 26.1633,
        era: "paulo",
        summary: "Port city where Paul received the 'Macedonian Call': 'Come over to Macedonia and help us.'",
        historicalNote: "The critical turning point where the Gospel crossed from Asia into Europe.",
        keyVerse: "During the night Paul had a vision of a man of Macedonia standing and begging him, 'Come over to Macedonia and help us.'",
        reference: "Acts 16:9",
        bookAbbrev: "at",
        chapter: 16,
        verseNum: 9
      },
      {
        id: "loc-filipos",
        name: "Philippi",
        modernName: "Kavala / Philippi, Greece",
        lat: 41.0125,
        lng: 24.2831,
        era: "paulo",
        summary: "First Roman colony in Europe to receive the Gospel through Paul and Silas.",
        historicalNote: "Where Lydia was baptized and where the Philippian jailer converted following midnight hymns and an earthquake.",
        keyVerse: "They replied, 'Believe in the Lord Jesus, and you will be saved—you and your household.'",
        reference: "Acts 16:31",
        bookAbbrev: "at",
        chapter: 16,
        verseNum: 31
      },
      {
        id: "loc-tessalonica",
        name: "Thessalonica",
        modernName: "Thessaloniki, Greece",
        lat: 40.6401,
        lng: 22.9444,
        era: "paulo",
        summary: "Capital of Macedonia where Paul reasoned in the synagogue for three consecutive Sabbaths.",
        historicalNote: "A model church in faith, hope, and love eagerly awaiting the Second Coming of Jesus Christ.",
        keyVerse: "We remember before our God and Father your work produced by faith, your labor prompted by love, and your endurance inspired by hope in our Lord Jesus Christ.",
        reference: "1 Thessalonians 1:3",
        bookAbbrev: "1ts",
        chapter: 1,
        verseNum: 3
      },
      {
        id: "loc-atenas",
        name: "Athens (Areopagus)",
        modernName: "Athens, Greece",
        lat: 37.9715,
        lng: 23.7257,
        era: "paulo",
        summary: "Paul addressed the Stoic and Epicurean philosophers at Mars Hill concerning the 'Unknown God'.",
        historicalNote: "Paul used Greek philosophical yearnings to declare the true Creator God and the resurrection of Jesus Christ.",
        keyVerse: "'For in him we live and move and have our being.' As some of your own poets have said, 'We are his offspring.'",
        reference: "Acts 17:28",
        bookAbbrev: "at",
        chapter: 17,
        verseNum: 28
      },
      {
        id: "loc-corinto",
        name: "Corinth",
        modernName: "Corinth, Greece",
        lat: 37.9056,
        lng: 22.8797,
        era: "paulo",
        summary: "Commercial hub where Paul ministered for 18 months, making tents with Aquila and Priscilla.",
        historicalNote: "Paul founded a vibrant church rich in spiritual gifts and received God's comforting vision of protection.",
        keyVerse: "'Do not be afraid; keep on speaking, do not be silent. For I am with you, and no one is going to attack and harm you, because I have many people in this city.'",
        reference: "Acts 18:9-10",
        bookAbbrev: "at",
        chapter: 18,
        verseNum: 9
      },
      {
        id: "loc-malta",
        name: "Island of Malta",
        modernName: "Republic of Malta",
        lat: 35.9375,
        lng: 14.3754,
        era: "paulo",
        summary: "Site of the celebrated shipwreck during Paul's voyage under custody to Rome.",
        historicalNote: "Bitten by a venomous viper from the fire, Paul was miraculously unharmed and went on to heal Publius' father.",
        keyVerse: "Paul shook the snake off into the fire and suffered no ill effects.",
        reference: "Acts 28:5",
        bookAbbrev: "at",
        chapter: 28,
        verseNum: 5
      },
      {
        id: "loc-roma",
        name: "Rome (Imperial Capital)",
        modernName: "Rome, Italy",
        lat: 41.9028,
        lng: 12.4964,
        era: "paulo",
        summary: "Heart of the Roman Empire where Paul preached the Kingdom of God under house arrest.",
        historicalNote: "For two full years, Paul welcomed visitors, authored Prison Epistles (Ephesians, Philippians, Colossians, Philemon), and finished his course.",
        keyVerse: "He proclaimed the kingdom of God and taught about the Lord Jesus Christ—with all boldness and without hindrance!",
        reference: "Acts 28:31",
        bookAbbrev: "at",
        chapter: 28,
        verseNum: 31
      }
    ]
  },
  {
    id: "vida-jesus",
    title: "Jesus' Ministry in the Holy Land",
    subtitle: "Galilee, Samaria, and Judea in the footsteps of the Messiah",
    era: "jesus",
    region: "Israel (Galilee, Samaria, Judea, and Jerusalem)",
    period: "Approx. 4 BC – 33 AD",
    center: [32.35, 35.35],
    defaultZoom: 9,
    description: "Explore the villages, historic cities, the Sea of Galilee, and mountains where Jesus Christ was born, taught the Sermon on the Mount, worked miracles, died, and rose victorious.",
    routeCoordinates: [
      [31.7054, 35.2024], // Bethlehem
      [32.6996, 35.3035], // Nazareth
      [32.7483, 35.3386], // Cana
      [32.6869, 35.3900], // Tabor
      [32.8808, 35.5750], // Capernaum
      [32.8806, 35.5558], // Beatitudes
      [32.8222, 35.5847], // Sea of Galilee
      [31.8364, 35.5458], // Jordan Baptism
      [32.2133, 35.2833], // Sychar
      [31.8560, 35.4630], // Jericho
      [31.7708, 35.2606], // Bethany
      [31.7767, 35.2345]  // Jerusalem
    ],
    locations: [
      {
        id: "loc-belem",
        name: "Bethlehem of Judea",
        modernName: "Bethlehem, West Bank / Israel",
        lat: 31.7054,
        lng: 35.2024,
        era: "jesus",
        summary: "City of King David and the birthplace of the Messiah Jesus Christ.",
        historicalNote: "Exact fulfillment of Micah 5:2 declaring that out of Bethlehem would come the eternal Ruler of Israel.",
        keyVerse: "But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel.",
        reference: "Micah 5:2 / Luke 2:4-7",
        bookAbbrev: "lc",
        chapter: 2,
        verseNum: 4
      },
      {
        id: "loc-nazare",
        name: "Nazareth of Galilee",
        modernName: "Nazareth, Israel",
        lat: 32.6996,
        lng: 35.3035,
        era: "jesus",
        summary: "The town where Jesus grew up and announced the beginning of His Messianic ministry.",
        historicalNote: "In the synagogue of Nazareth, Jesus unrolled Isaiah 61 and proclaimed the fulfillment of prophecy.",
        keyVerse: "'The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor.'",
        reference: "Luke 4:18",
        bookAbbrev: "lc",
        chapter: 4,
        verseNum: 18
      },
      {
        id: "loc-cana",
        name: "Cana of Galilee",
        modernName: "Kafr Kanna, Israel",
        lat: 32.7483,
        lng: 35.3386,
        era: "jesus",
        summary: "Site of Jesus' first public miracle, turning water into wine at a wedding feast.",
        historicalNote: "Jesus revealed His glory and His disciples believed in Him at the beginning of His Galilean ministry.",
        keyVerse: "What Jesus did here in Cana of Galilee was the first of the signs through which he revealed his glory; and his disciples believed in him.",
        reference: "John 2:11",
        bookAbbrev: "jo",
        chapter: 2,
        verseNum: 11
      },
      {
        id: "loc-cafarnaum",
        name: "Capernaum",
        modernName: "Kfar Nahum, Israel",
        lat: 32.8808,
        lng: 35.5750,
        era: "jesus",
        summary: "'His own town' - the vibrant operational headquarters of Jesus' ministry in Galilee.",
        historicalNote: "Site of Peter's home, the healing of the centurion's servant, and numerous miraculous healings.",
        keyVerse: "A few days later, when Jesus again entered Capernaum, the people heard that he had come home.",
        reference: "Mark 2:1",
        bookAbbrev: "mc",
        chapter: 2,
        verseNum: 1
      },
      {
        id: "loc-monte-bencoes",
        name: "Mount of Beatitudes",
        modernName: "Mount Eremos, Sea of Galilee",
        lat: 32.8806,
        lng: 35.5558,
        era: "jesus",
        summary: "Natural amphitheater overlooking the Sea of Galilee where Jesus delivered the Sermon on the Mount.",
        historicalNote: "The foundational moral teaching of God's Kingdom (Matthew 5-7), including the Beatitudes and the Lord's Prayer.",
        keyVerse: "Blessed are the pure in heart, for they will see God.",
        reference: "Matthew 5:8",
        bookAbbrev: "mt",
        chapter: 5,
        verseNum: 8
      },
      {
        id: "loc-mar-galileia",
        name: "Sea of Galilee (Lake of Gennesaret)",
        modernName: "Lake Kinneret, Israel",
        lat: 32.8222,
        lng: 35.5847,
        era: "jesus",
        summary: "Setting for extraordinary miracles: calming the storm, walking on water, and the miraculous catch.",
        historicalNote: "Here Jesus called Peter, Andrew, James, and John to become fishers of men.",
        keyVerse: "He got up, rebuked the wind and said to the waves, 'Quiet! Be still!' Then the wind died down and it was completely calm.",
        reference: "Mark 4:39",
        bookAbbrev: "mc",
        chapter: 4,
        verseNum: 39
      },
      {
        id: "loc-jordao-batismo",
        name: "Jordan River (Baptism Site)",
        modernName: "Qasr al-Yahud / Jordan River",
        lat: 31.8364,
        lng: 35.5458,
        era: "jesus",
        summary: "Where John the Baptist baptized Jesus and the Holy Spirit descended like a dove.",
        historicalNote: "The Father's voice resounded from heaven: 'This is my Son, whom I love; with him I am well pleased.'",
        keyVerse: "As soon as Jesus was baptized, he went up out of the water. At that moment heaven was opened, and he saw the Spirit of God descending like a dove.",
        reference: "Matthew 3:16-17",
        bookAbbrev: "mt",
        chapter: 3,
        verseNum: 16
      },
      {
        id: "loc-sicar",
        name: "Sychar (Jacob's Well, Samaria)",
        modernName: "Nablus / Tel Balata",
        lat: 32.2133,
        lng: 35.2833,
        era: "jesus",
        summary: "Jesus' transformative encounter with the Samaritan Woman at historic Jacob's Well.",
        historicalNote: "Jesus crossed cultural divides to offer living water and teach true worship in spirit and truth.",
        keyVerse: "Whoever drinks the water I give them will never thirst. Indeed, the water I give them will become in them a spring of water welling up to eternal life.",
        reference: "John 4:14",
        bookAbbrev: "jo",
        chapter: 4,
        verseNum: 14
      },
      {
        id: "loc-jerico",
        name: "Jericho",
        modernName: "Jericho, West Bank",
        lat: 31.8560,
        lng: 35.4630,
        era: "jesus",
        summary: "Ancient city where Jesus healed blind Bartimaeus and dined with Zacchaeus.",
        historicalNote: "Zacchaeus experienced genuine repentance and restoration, demonstrating the Gospel's transforming power.",
        keyVerse: "For the Son of Man came to seek and to save the lost.",
        reference: "Luke 19:10",
        bookAbbrev: "lc",
        chapter: 19,
        verseNum: 10
      },
      {
        id: "loc-betania",
        name: "Bethany",
        modernName: "Al-Eizariya, Mount of Olives",
        lat: 31.7708,
        lng: 35.2606,
        era: "jesus",
        summary: "Home of Mary, Martha, and Lazarus, where Jesus raised Lazarus after four days in the tomb.",
        historicalNote: "Jesus declared at the open tomb: 'I am the resurrection and the life. The one who believes in me will live, even though they die.'",
        keyVerse: "Jesus said to her, 'I am the resurrection and the life. The one who believes in me will live, even though they die.'",
        reference: "John 11:25",
        bookAbbrev: "jo",
        chapter: 11,
        verseNum: 25
      },
      {
        id: "loc-jerusalem-jesus",
        name: "Jerusalem and Golgotha",
        modernName: "Old City of Jerusalem",
        lat: 31.7767,
        lng: 35.2345,
        era: "jesus",
        summary: "Site of the Last Supper, Gethsemane, the Crucifixion, and Christ's Glorious Resurrection.",
        historicalNote: "The empty tomb of Jesus Christ is the everlasting seal of salvation and victory over death.",
        keyVerse: "He is not here; he has risen, just as he said. Come and see the place where he lay.",
        reference: "Matthew 28:6",
        bookAbbrev: "mt",
        chapter: 28,
        verseNum: 6
      }
    ]
  },
  {
    id: "exodo-peregrinacao",
    title: "The Exodus and Wilderness Route",
    subtitle: "From Egyptian bondage to the Jordan River crossing into Canaan",
    era: "exodo",
    region: "Egypt, Sinai Peninsula, Negev, and Canaan",
    period: "Approx. 1446 BC – 1406 BC",
    center: [29.8, 33.6],
    defaultZoom: 7,
    description: "Trace the 40-year journey of Israel under Moses: the plagues, the parting of the Red Sea, the law at Mount Sinai, and the entrance into the Promised Land.",
    routeCoordinates: [
      [30.7870, 31.8310], // Rameses
      [30.5500, 32.1000], // Succoth
      [29.9667, 32.5500], // Red Sea
      [29.2500, 32.8500], // Marah
      [28.9500, 33.2000], // Elim
      [28.7000, 33.6500], // Rephidim
      [28.5397, 33.9753], // Mount Sinai
      [28.8500, 34.4000], // Hazeroth
      [30.6500, 34.4200], // Kadesh-Barnea
      [30.3167, 35.4167], // Mount Hor
      [31.7681, 35.7275], // Mount Nebo
      [31.8600, 35.5400]  // Jericho
    ],
    locations: [
      {
        id: "loc-ramses",
        name: "Rameses / Land of Goshen",
        modernName: "Eastern Nile Delta, Egypt",
        lat: 30.7870,
        lng: 31.8310,
        era: "exodo",
        summary: "Starting point of Israel's exodus following the tenth plague and the first Passover.",
        historicalNote: "God delivered His people with an outstretched arm after four centuries of dwelling in Egypt.",
        keyVerse: "The Israelites journeyed from Rameses to Succoth. There were about six hundred thousand men on foot, besides women and children.",
        reference: "Exodus 12:37",
        bookAbbrev: "ex",
        chapter: 12,
        verseNum: 37
      },
      {
        id: "loc-mar-vermelho",
        name: "Crossing of the Red Sea",
        modernName: "Gulf of Suez / Red Sea",
        lat: 29.9667,
        lng: 32.5500,
        era: "exodo",
        summary: "The miraculous deliverance where the waters parted into towering walls.",
        historicalNote: "Moses stretched out his staff over the sea and the Lord opened a dry path through the waters.",
        keyVerse: "The Lord will fight for you; you need only to be still.",
        reference: "Exodus 14:14",
        bookAbbrev: "ex",
        chapter: 14,
        verseNum: 14
      },
      {
        id: "loc-mara-elim",
        name: "Marah and Elim",
        modernName: "Wadi Gharandel Oasis, Sinai",
        lat: 28.9500,
        lng: 33.2000,
        era: "exodo",
        summary: "Bitter waters sweetened by the tree and the lush oasis of 12 springs and 70 palm trees.",
        historicalNote: "God revealed Himself as 'Yahweh Rapha' — the Lord who heals you.",
        keyVerse: "He said, 'If you listen carefully to the Lord your God... I will not bring on you any of the diseases I brought on the Egyptians, for I am the Lord, who heals you.'",
        reference: "Exodus 15:26",
        bookAbbrev: "ex",
        chapter: 15,
        verseNum: 26
      },
      {
        id: "loc-refidim",
        name: "Rephidim",
        modernName: "Wadi Feiran, Sinai Peninsula",
        lat: 28.7000,
        lng: 33.6500,
        era: "exodo",
        summary: "The struck rock at Horeb yielding water and victory over Amalek with Moses' raised arms.",
        historicalNote: "Aaron and Hur held up Moses' hands until sunset, building the altar 'Yahweh Nissi' (The Lord is my Banner).",
        keyVerse: "Moses built an altar and called it The Lord is my Banner.",
        reference: "Exodus 17:15",
        bookAbbrev: "ex",
        chapter: 17,
        verseNum: 15
      },
      {
        id: "loc-monte-sinai",
        name: "Mount Sinai (Horeb)",
        modernName: "Gebel Musa, Sinai Peninsula",
        lat: 28.5397,
        lng: 33.9753,
        era: "exodo",
        summary: "The Holy Mountain where the Law, Covenant, and Ten Commandments were delivered on stone tablets.",
        historicalNote: "Where God's presence descended in fire and smoke and the pattern of the Tabernacle was shown to Moses.",
        keyVerse: "Mount Sinai was covered with smoke, because the Lord descended on it in fire. The smoke billowed up from it like smoke from a furnace.",
        reference: "Exodus 19:18",
        bookAbbrev: "ex",
        chapter: 19,
        verseNum: 18
      },
      {
        id: "loc-cades-barneia",
        name: "Kadesh-Barnea",
        modernName: "Ein el-Qudeirat, Negev",
        lat: 30.6500,
        lng: 34.4200,
        era: "exodo",
        summary: "Strategic oasis from which the 12 spies were sent to scout the Promised Land of Canaan.",
        historicalNote: "Joshua and Caleb stood firm in faith while others trembled at the giants in the land.",
        keyVerse: "Joshua son of Nun and Caleb son of Jephunneh... said to the entire Israelite assembly, 'The land we passed through and explored is exceedingly good.'",
        reference: "Numbers 14:6-7",
        bookAbbrev: "nm",
        chapter: 14,
        verseNum: 6
      },
      {
        id: "loc-monte-nebo",
        name: "Mount Nebo and the Jordan River",
        modernName: "Mount Nebo, Jordan",
        lat: 31.7681,
        lng: 35.7275,
        era: "exodo",
        summary: "Moses viewed the entire Promised Land before being gathered to his fathers.",
        historicalNote: "Under Joshua's leadership, the new generation crossed the Jordan on dry ground and took possession of the land.",
        keyVerse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        reference: "Joshua 1:9",
        bookAbbrev: "js",
        chapter: 1,
        verseNum: 9
      }
    ]
  },
  {
    id: "sete-igrejas-apocalipse",
    title: "The Seven Churches of Revelation",
    subtitle: "The prophetic letters of Christ sent from the Island of Patmos",
    era: "apocalipse",
    region: "Asia Minor (Western Turkey and the Aegean Sea)",
    period: "Approx. 95 AD",
    center: [38.4, 27.8],
    defaultZoom: 8,
    description: "Discover the Roman postal route and historic cities of the seven churches in Revelation: Ephesus, Smyrna, Pergamum, Thyatira, Sardis, Philadelphia, and Laodicea.",
    routeCoordinates: [
      [37.3150, 26.5417], // Patmos
      [37.9489, 27.3678], // 1. Ephesus
      [38.4192, 27.1287], // 2. Smyrna
      [39.1294, 27.1806], // 3. Pergamum
      [38.9244, 27.8397], // 4. Thyatira
      [38.4883, 28.0400], // 5. Sardis
      [38.3514, 28.5175], // 6. Philadelphia
      [37.8344, 29.1083]  // 7. Laodicea
    ],
    locations: [
      {
        id: "loc-patmos",
        name: "Island of Patmos",
        modernName: "Patmos, Dodecanese Islands, Greece",
        lat: 37.3150,
        lng: 26.5417,
        era: "apocalipse",
        summary: "Rocky Aegean island where the Apostle John was exiled and received the Apocalypse of Jesus Christ.",
        historicalNote: "John was in the Spirit on the Lord's Day when he heard a majestic voice like the sound of rushing waters.",
        keyVerse: "I, John... was on the island of Patmos because of the word of God and the testimony of Jesus.",
        reference: "Revelation 1:9",
        bookAbbrev: "ap",
        chapter: 1,
        verseNum: 9
      },
      {
        id: "loc-efeso-apoc",
        name: "1. Ephesus (The Desirable Church)",
        modernName: "Selçuk / Ephesus, Turkey",
        lat: 37.9489,
        lng: 27.3678,
        era: "apocalipse",
        summary: "Diligent church that tested false apostles, exhorted to return to its First Love.",
        historicalNote: "First stop on the circular Roman imperial postal route in the province of Asia.",
        keyVerse: "Yet I hold this against you: You have forsaken the love you had at first. Consider how far you have fallen! Repent and do the things you did at first.",
        reference: "Revelation 2:4-5",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 4
      },
      {
        id: "loc-esmirna",
        name: "2. Smyrna (The Persecuted Church)",
        modernName: "Izmir, Turkey",
        lat: 38.4192,
        lng: 27.1287,
        era: "apocalipse",
        summary: "Church tested through suffering and imperial persecution, promised the Crown of Life.",
        historicalNote: "One of only two churches in Revelation that received no rebuke from Jesus.",
        keyVerse: "Be faithful, even to the point of death, and I will give you life as your victor's crown.",
        reference: "Revelation 2:10",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 10
      },
      {
        id: "loc-pergamo",
        name: "3. Pergamum (The Church at Satan's Throne)",
        modernName: "Bergama, Turkey",
        lat: 39.1294,
        lng: 27.1806,
        era: "apocalipse",
        summary: "Center of massive pagan temples, cautioned against worldly compromise and Balaam's doctrine.",
        historicalNote: "To the overcomer, Christ promises the 'hidden manna' and a 'white stone' with a new name.",
        keyVerse: "To the one who is victorious, I will give some of the hidden manna. I will also give that person a white stone with a new name written on it.",
        reference: "Revelation 2:17",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 17
      },
      {
        id: "loc-tiatira",
        name: "4. Thyatira (The Tolerant Church)",
        modernName: "Akhisar, Turkey",
        lat: 38.9244,
        lng: 27.8397,
        era: "apocalipse",
        summary: "Trade guild center and purple dye capital, warned against tolerating false doctrine.",
        historicalNote: "The promise to the victorious is authority over nations and the Morning Star.",
        keyVerse: "To the one who is victorious and does my will to the end, I will give authority over the nations.",
        reference: "Revelation 2:26",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 26
      },
      {
        id: "loc-sardes",
        name: "5. Sardis (The Church Appearing Alive)",
        modernName: "Sart, Turkey",
        lat: 38.4883,
        lng: 28.0400,
        era: "apocalipse",
        summary: "Historic capital of Lydia, urged to wake up so as not to be caught by surprise.",
        historicalNote: "Famed for its seemingly impregnable acropolis that fell historically because guards failed to stay awake.",
        keyVerse: "Wake up! Strengthen what remains and is about to die, for I have found your deeds unfinished in the sight of my God.",
        reference: "Revelation 3:2",
        bookAbbrev: "ap",
        chapter: 3,
        verseNum: 2
      },
      {
        id: "loc-filadelfia",
        name: "6. Philadelphia (The Church of Brotherly Love)",
        modernName: "Alaşehir, Turkey",
        lat: 38.3514,
        lng: 28.5175,
        era: "apocalipse",
        summary: "The church of the 'Open Door' that kept Christ's Word and did not deny His Name.",
        historicalNote: "Located in an earthquake-prone valley; Christ promises to make overcomers immovable pillars in His temple.",
        keyVerse: "I know your deeds. See, I have placed before you an open door that no one can shut.",
        reference: "Revelation 3:8",
        bookAbbrev: "ap",
        chapter: 3,
        verseNum: 8
      },
      {
        id: "loc-laodiceia",
        name: "7. Laodicea (The Lukewarm Church)",
        modernName: "Denizli / Pamukkale, Turkey",
        lat: 37.8344,
        lng: 29.1083,
        era: "apocalipse",
        summary: "Wealthy banking and textile center, rebuked for spiritual complacency and lukewarmness.",
        historicalNote: "Hierapolis thermal waters arrived lukewarm via aqueducts. Christ knocks at the door offering gold refined by fire.",
        keyVerse: "Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me.",
        reference: "Revelation 3:20",
        bookAbbrev: "ap",
        chapter: 3,
        verseNum: 20
      }
    ]
  },
  {
    id: "antigo-testamento-reinos",
    title: "Biblical Lands and Kingdoms of Israel",
    subtitle: "Canaan, the Patriarchs, Judges, and Kings of Judah and Israel",
    era: "reinos",
    region: "Canaan and the Tribes of Israel (Dan to Beersheba)",
    period: "Approx. 2000 BC – 586 BC",
    center: [32.1, 35.2],
    defaultZoom: 8,
    description: "Explore the sacred mountains, altars, and towns of Abraham, Isaac, Jacob, the City of David, and mighty prophets of Israel.",
    routeCoordinates: [
      [31.2589, 34.7997], // Beersheba
      [31.5247, 35.1107], // Hebron
      [31.7767, 35.2345], // Jerusalem
      [31.9306, 35.2208], // Bethel
      [32.0556, 35.2894], // Shiloh
      [32.2139, 35.2847], // Shechem
      [32.2778, 35.1889], // Samaria
      [32.7381, 35.0489], // Carmel
      [33.2486, 35.6528]  // Dan
    ],
    locations: [
      {
        id: "loc-hebrom",
        name: "Hebron (Machpelah)",
        modernName: "Hebron (Al-Khalil), West Bank",
        lat: 31.5247,
        lng: 35.1107,
        era: "patriarcas",
        summary: "Site of the Oaks of Mamre and burial cave of Abraham, Sarah, Isaac, Rebekah, Jacob, and Leah.",
        historicalNote: "Where David was anointed king over Judah and reigned for seven and a half years before conquering Jerusalem.",
        keyVerse: "When all the elders of Israel had come to King David at Hebron... they anointed David king over Israel.",
        reference: "2 Samuel 5:3",
        bookAbbrev: "2sm",
        chapter: 5,
        verseNum: 3
      },
      {
        id: "loc-jerusalem-davi",
        name: "Jerusalem (Zion and Mount Moriah)",
        modernName: "Jerusalem, Israel",
        lat: 31.7767,
        lng: 35.2345,
        era: "reinos",
        summary: "David's royal capital and the site where Solomon built the First Temple on Mount Moriah.",
        historicalNote: "Where Abraham offered Isaac and where the Ark of the Covenant rested in the Holy of Holies.",
        keyVerse: "Pray for the peace of Jerusalem: 'May those who love you be secure.'",
        reference: "Psalm 122:6",
        bookAbbrev: "sl",
        chapter: 122,
        verseNum: 6
      },
      {
        id: "loc-silo",
        name: "Shiloh",
        modernName: "Tel Shiloh, Samaria",
        lat: 32.0556,
        lng: 35.2894,
        era: "reinos",
        summary: "Spiritual center of Israel during the period of the Judges where the Tabernacle stood for over three centuries.",
        historicalNote: "Where Hannah poured out her soul in prayer and young Samuel heard God calling his name in the night.",
        keyVerse: "The Lord came and stood there, calling as at the other times, 'Samuel! Samuel!' Then Samuel said, 'Speak, for your servant is listening.'",
        reference: "1 Samuel 3:10",
        bookAbbrev: "1sm",
        chapter: 3,
        verseNum: 10
      },
      {
        id: "loc-samaria",
        name: "Samaria (Sebaste)",
        modernName: "Sebastia, Samaria",
        lat: 32.2778,
        lng: 35.1889,
        era: "reinos",
        summary: "Capital of the Northern Kingdom of Israel founded by King Omri and beautified by Ahab.",
        historicalNote: "Setting for prophetic confrontations by Elijah and Elisha until the city fell to the Assyrian Empire in 722 BC.",
        keyVerse: "He bought the hill of Samaria from Shemer... and built a city on the hill, calling it Samaria.",
        reference: "1 Kings 16:24",
        bookAbbrev: "1rs",
        chapter: 16,
        verseNum: 24
      },
      {
        id: "loc-carmelo",
        name: "Mount Carmel",
        modernName: "Mount Carmel (Muhraqa), Haifa",
        lat: 32.7381,
        lng: 35.0489,
        era: "reinos",
        summary: "Sacred mountain where Elijah challenged the 450 prophets of Baal and fire fell from heaven.",
        historicalNote: "The people bowed shouting 'The Lord—he is God! The Lord—he is God!', followed by abundant rain ending a 3.5-year drought.",
        keyVerse: "Then the fire of the Lord fell and burned up the sacrifice, the wood, the stones and the soil, and also licked up the water in the trench.",
        reference: "1 Kings 18:38",
        bookAbbrev: "1rs",
        chapter: 18,
        verseNum: 38
      },
      {
        id: "loc-dan",
        name: "Dan (Northern Frontier of Israel)",
        modernName: "Tel Dan Nature Reserve, Israel",
        lat: 33.2486,
        lng: 35.6528,
        era: "reinos",
        summary: "Northern boundary of Israel ('from Dan to Beersheba'), famous for pristine springs feeding the Jordan.",
        historicalNote: "Where Jeroboam I established a golden calf shrine to deter pilgrimage to Jerusalem.",
        keyVerse: "And all Israel from Dan to Beersheba recognized that Samuel was attested as a prophet of the Lord.",
        reference: "1 Samuel 3:20",
        bookAbbrev: "1sm",
        chapter: 3,
        verseNum: 20
      },
      {
        id: "loc-berseba",
        name: "Beersheba (Well of the Oath)",
        modernName: "Beer Sheva, Israel",
        lat: 31.2589,
        lng: 34.7997,
        era: "patriarcas",
        summary: "Southern boundary of Israel where Abraham and Isaac dug covenant wells and planted tamarisk trees.",
        historicalNote: "Abraham called on the Name of the Lord, the Eternal God (El Olam) in Beersheba.",
        keyVerse: "Abraham planted a tamarisk tree in Beersheba, and there he called on the name of the Lord, the Eternal God.",
        reference: "Genesis 21:33",
        bookAbbrev: "gn",
        chapter: 21,
        verseNum: 33
      }
    ]
  }
];
