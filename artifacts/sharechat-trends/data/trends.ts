export type TrendCategory =
  | "sports"
  | "news"
  | "entertainment"
  | "festival"
  | "finance"
  | "tech"
  | "weather"
  | "politics"
  | "viral";

export type TrendSource =
  | "search"
  | "social"
  | "news"
  | "video"
  | "cross-platform";

export type RelatedPost = {
  author: string;
  handle: string;
  language: string;
  text: string;
  likes: number;
  shares: number;
};

export type Trend = {
  id: string;
  rank: number;
  tag: string;
  titleHi: string;
  descriptionHi: string;
  category: TrendCategory;
  categoryLabelHi: string;
  heat: number;
  postsCount: number;
  viewsCount: number;
  sources: TrendSource[];
  primarySource: TrendSource;
  region: string;
  startedHoursAgo: number;
  momentum: "rising" | "peaking" | "cooling";
  relatedPosts: RelatedPost[];
  topLanguages: string[];
};

const T = (n: number) => `${n.toLocaleString("en-IN")}`;

export const trends: Trend[] = [
  {
    id: "ind-vs-aus",
    rank: 1,
    tag: "#IndiaVsAustralia",
    titleHi: "भारत बनाम ऑस्ट्रेलिया",
    descriptionHi:
      "वनडे सीरीज़ का तीसरा मुक़ाबला आज रात — रोहित और कोहली प्लेइंग इलेवन में वापसी।",
    category: "sports",
    categoryLabelHi: "खेल",
    heat: 98,
    postsCount: 412000,
    viewsCount: 28400000,
    sources: ["news", "social", "search", "video"],
    primarySource: "news",
    region: "अखिल भारत",
    startedHoursAgo: 6,
    momentum: "peaking",
    topLanguages: ["हिन्दी", "मराठी", "तमिल"],
    relatedPosts: [
      {
        author: "क्रिकेट दीवाने",
        handle: "@cricketdeewane",
        language: "हिन्दी",
        text:
          "रोहित भाई का बल्ला बोले तो ऑस्ट्रेलिया का बैंड बजना तय है आज। कौन देख रहा है मैच? 🏏",
        likes: 18420,
        shares: 4210,
      },
      {
        author: "स्पोर्ट्स लाइव",
        handle: "@sportslivehi",
        language: "हिन्दी",
        text:
          "विराट कोहली ने नेट प्रैक्टिस में जमकर पसीना बहाया — फॉर्म वापसी के सारे संकेत।",
        likes: 9120,
        shares: 1840,
      },
    ],
  },
  {
    id: "diwali-2026",
    rank: 2,
    tag: "#Diwali2026",
    titleHi: "दिवाली 2026",
    descriptionHi:
      "त्यौहारों का मौसम — रंगोली, मिठाई और दीयों की सर्च और रील्स में तेज़ी।",
    category: "festival",
    categoryLabelHi: "त्यौहार",
    heat: 95,
    postsCount: 358000,
    viewsCount: 22100000,
    sources: ["search", "social", "video"],
    primarySource: "search",
    region: "उत्तर व पश्चिम भारत",
    startedHoursAgo: 18,
    momentum: "rising",
    topLanguages: ["हिन्दी", "गुजराती", "पंजाबी"],
    relatedPosts: [
      {
        author: "घर सजावट",
        handle: "@gharsajavat",
        language: "हिन्दी",
        text:
          "इस बार दिवाली पर ट्राय करें मिनिमल रंगोली — सिर्फ़ 5 रंग, 10 मिनट में तैयार। टटोरियल कमेंट में।",
        likes: 24130,
        shares: 8920,
      },
    ],
  },
  {
    id: "mumbai-rains",
    rank: 3,
    tag: "#MumbaiRains",
    titleHi: "मुंबई बारिश",
    descriptionHi:
      "मुंबई में मूसलाधार बारिश — अंधेरी, दादर में जलजमाव, लोकल ट्रेन देरी से।",
    category: "weather",
    categoryLabelHi: "मौसम",
    heat: 92,
    postsCount: 287000,
    viewsCount: 14800000,
    sources: ["social", "news", "video"],
    primarySource: "social",
    region: "मुंबई महानगर",
    startedHoursAgo: 4,
    momentum: "peaking",
    topLanguages: ["मराठी", "हिन्दी"],
    relatedPosts: [
      {
        author: "मुंबईकर खबरें",
        handle: "@mumbaikarnews",
        language: "मराठी / हिन्दी",
        text:
          "अंधेरी सबवे फिर बंद। ऑफ़िस से जल्दी निकलिए और लोकल का स्टेटस ज़रूर चेक कर लें।",
        likes: 12490,
        shares: 5320,
      },
    ],
  },
  {
    id: "rbi-repo-cut",
    rank: 4,
    tag: "#RBIRepoRateCut",
    titleHi: "RBI रेपो रेट कटौती",
    descriptionHi:
      "रिज़र्व बैंक ने रेपो रेट 25 बेसिस पॉइंट घटाया — होम लोन EMI में राहत संभव।",
    category: "finance",
    categoryLabelHi: "वित्त",
    heat: 89,
    postsCount: 198000,
    viewsCount: 9600000,
    sources: ["news", "search"],
    primarySource: "news",
    region: "अखिल भारत",
    startedHoursAgo: 8,
    momentum: "rising",
    topLanguages: ["हिन्दी", "अंग्रेज़ी"],
    relatedPosts: [
      {
        author: "पैसा बात",
        handle: "@paisabaat",
        language: "हिन्दी",
        text:
          "रेपो रेट कटा तो आपकी 50 लाख की होम लोन EMI पर लगभग ₹850 की मासिक बचत — बैंक से रिसेट करवाना न भूलें।",
        likes: 15820,
        shares: 6710,
      },
    ],
  },
  {
    id: "stranger-things-5",
    rank: 5,
    tag: "#StrangerThings5",
    titleHi: "स्ट्रेंजर थिंग्स 5",
    descriptionHi:
      "अंतिम सीज़न आज रिलीज़ — हिंदी डब उपलब्ध, फैन थ्योरी और रील्स की बाढ़।",
    category: "entertainment",
    categoryLabelHi: "मनोरंजन",
    heat: 87,
    postsCount: 245000,
    viewsCount: 19200000,
    sources: ["video", "social", "cross-platform"],
    primarySource: "video",
    region: "मेट्रो शहर",
    startedHoursAgo: 12,
    momentum: "rising",
    topLanguages: ["हिन्दी", "अंग्रेज़ी", "तमिल"],
    relatedPosts: [
      {
        author: "OTT देसी",
        handle: "@ottdesi",
        language: "हिन्दी",
        text:
          "स्ट्रेंजर थिंग्स 5 का पहला एपिसोड देख लिया — बिना स्पॉइलर के बस इतना: रुलाएगा भी, हँसाएगा भी।",
        likes: 31040,
        shares: 9870,
      },
    ],
  },
  {
    id: "bigg-boss-finale",
    rank: 6,
    tag: "#BiggBossFinale",
    titleHi: "बिग बॉस फ़िनाले",
    descriptionHi:
      "वोटिंग के अंतिम 24 घंटे — टॉप 4 की लड़ाई, फ़ैन्डम सोशल पर ज़ोरों पर।",
    category: "entertainment",
    categoryLabelHi: "मनोरंजन",
    heat: 84,
    postsCount: 312000,
    viewsCount: 17500000,
    sources: ["social", "video"],
    primarySource: "social",
    region: "हिन्दी पट्टी",
    startedHoursAgo: 22,
    momentum: "peaking",
    topLanguages: ["हिन्दी", "भोजपुरी"],
    relatedPosts: [
      {
        author: "टीवी तड़का",
        handle: "@tvtadka",
        language: "हिन्दी",
        text:
          "इस बार ट्रॉफ़ी किसके घर? कमेंट में अपना पिक बताओ — हम लाइव करेंगे आज रात 9 बजे।",
        likes: 22310,
        shares: 7140,
      },
    ],
  },
  {
    id: "iphone-launch-india",
    rank: 7,
    tag: "#iPhone17India",
    titleHi: "iPhone 17 भारत में",
    descriptionHi:
      "Apple का नया मॉडल भारत में आज से उपलब्ध — स्टोर्स के बाहर लाइन, अनबॉक्सिंग वायरल।",
    category: "tech",
    categoryLabelHi: "टेक्नोलॉजी",
    heat: 81,
    postsCount: 167000,
    viewsCount: 11300000,
    sources: ["search", "video", "news"],
    primarySource: "search",
    region: "मेट्रो शहर",
    startedHoursAgo: 10,
    momentum: "rising",
    topLanguages: ["हिन्दी", "अंग्रेज़ी"],
    relatedPosts: [
      {
        author: "टेक देसी",
        handle: "@techdesi",
        language: "हिन्दी",
        text:
          "iPhone 17 का कैमरा सच में अगले लेवल पर है, लेकिन कीमत? वो भी अगले लेवल पर है। फ़ुल रिव्यू कल।",
        likes: 18650,
        shares: 4920,
      },
    ],
  },
  {
    id: "uttarakhand-trekking",
    rank: 8,
    tag: "#UttarakhandTrek",
    titleHi: "उत्तराखंड ट्रेक सीज़न",
    descriptionHi:
      "केदारकंठा और चोपता ट्रेक की बुकिंग में उछाल — यंग ट्रैवलर्स के बीच चर्चा।",
    category: "viral",
    categoryLabelHi: "वायरल",
    heat: 76,
    postsCount: 89000,
    viewsCount: 7400000,
    sources: ["video", "social"],
    primarySource: "video",
    region: "उत्तर भारत",
    startedHoursAgo: 30,
    momentum: "rising",
    topLanguages: ["हिन्दी", "गढ़वाली"],
    relatedPosts: [
      {
        author: "पहाड़ी सफ़र",
        handle: "@pahadisafar",
        language: "हिन्दी",
        text:
          "केदारकंठा से सूर्योदय देखना ज़िंदगी का सबसे यादगार पल था। 5 दिन, ₹6500, और बहुत सारी यादें।",
        likes: 27890,
        shares: 11250,
      },
    ],
  },
  {
    id: "up-board-result",
    rank: 9,
    tag: "#UPBoardResult",
    titleHi: "UP बोर्ड रिज़ल्ट",
    descriptionHi:
      "10वीं और 12वीं के नतीजे जारी — टॉपर्स की लिस्ट और कट-ऑफ ट्रेंड में।",
    category: "news",
    categoryLabelHi: "ख़बरें",
    heat: 74,
    postsCount: 142000,
    viewsCount: 8900000,
    sources: ["search", "news"],
    primarySource: "search",
    region: "उत्तर प्रदेश",
    startedHoursAgo: 5,
    momentum: "peaking",
    topLanguages: ["हिन्दी"],
    relatedPosts: [
      {
        author: "शिक्षा अपडेट",
        handle: "@shikshaupdate",
        language: "हिन्दी",
        text:
          "रिज़ल्ट देखने के लिए सीधा लिंक — रोल नंबर और जन्मतिथि तैयार रखें। ऑल द बेस्ट! 📚",
        likes: 9410,
        shares: 3820,
      },
    ],
  },
  {
    id: "viral-chai-wala",
    rank: 10,
    tag: "#BanarasChaiWala",
    titleHi: "बनारस चाय वाला",
    descriptionHi:
      "वाराणसी के एक चायवाले की कहानी — अंग्रेज़ी में फ़र्राटेदार बातचीत, यूज़र्स में प्यार।",
    category: "viral",
    categoryLabelHi: "वायरल",
    heat: 71,
    postsCount: 198000,
    viewsCount: 15600000,
    sources: ["video", "social", "cross-platform"],
    primarySource: "video",
    region: "अखिल भारत",
    startedHoursAgo: 16,
    momentum: "peaking",
    topLanguages: ["हिन्दी", "भोजपुरी"],
    relatedPosts: [
      {
        author: "देसी कहानियाँ",
        handle: "@desikahaniyan",
        language: "हिन्दी",
        text:
          "ये चाय वाले भैया का जोश देखो — IIT वालों को भी मात दे दें इंग्लिश में। बनारस की मिट्टी में कुछ बात है।",
        likes: 45120,
        shares: 18790,
      },
    ],
  },
  {
    id: "metro-line-launch",
    rank: 11,
    tag: "#DelhiMetroPhase4",
    titleHi: "दिल्ली मेट्रो फेज़ 4",
    descriptionHi:
      "मजेंटा लाइन का नया स्ट्रेच आज से शुरू — एयरपोर्ट तक यात्रा 18 मिनट कम।",
    category: "news",
    categoryLabelHi: "ख़बरें",
    heat: 68,
    postsCount: 76000,
    viewsCount: 5200000,
    sources: ["news", "social"],
    primarySource: "news",
    region: "दिल्ली NCR",
    startedHoursAgo: 9,
    momentum: "rising",
    topLanguages: ["हिन्दी", "पंजाबी"],
    relatedPosts: [
      {
        author: "दिल्ली डायरी",
        handle: "@delhidiary",
        language: "हिन्दी",
        text:
          "एयरपोर्ट जाने वालों के लिए जश्न का मौक़ा — अब ओला-ऊबर सर्ज को बाय-बाय कहो।",
        likes: 8920,
        shares: 2410,
      },
    ],
  },
  {
    id: "election-rally",
    rank: 12,
    tag: "#BiharChunav",
    titleHi: "बिहार चुनाव",
    descriptionHi:
      "पहले चरण की वोटिंग कल — पटना, गया और मुज़फ़्फ़रपुर में रैलियाँ चरम पर।",
    category: "politics",
    categoryLabelHi: "राजनीति",
    heat: 64,
    postsCount: 134000,
    viewsCount: 7100000,
    sources: ["news", "social"],
    primarySource: "news",
    region: "बिहार",
    startedHoursAgo: 14,
    momentum: "rising",
    topLanguages: ["हिन्दी", "भोजपुरी", "मैथिली"],
    relatedPosts: [
      {
        author: "राजनीति लाइव",
        handle: "@rajneetilive",
        language: "हिन्दी",
        text:
          "इस बार युवा वोटर निर्णायक भूमिका में — फ़र्स्ट टाइम वोटर्स की संख्या रिकॉर्ड पर।",
        likes: 11340,
        shares: 4520,
      },
    ],
  },
  {
    id: "karwa-chauth",
    rank: 13,
    tag: "#KarwaChauth",
    titleHi: "करवा चौथ",
    descriptionHi:
      "मेहंदी डिज़ाइन और सरगी रेसिपी की सर्च में 5 गुना बढ़ोतरी — रील्स में चाँद लाइव।",
    category: "festival",
    categoryLabelHi: "त्यौहार",
    heat: 61,
    postsCount: 178000,
    viewsCount: 9800000,
    sources: ["search", "video"],
    primarySource: "search",
    region: "उत्तर भारत",
    startedHoursAgo: 26,
    momentum: "cooling",
    topLanguages: ["हिन्दी", "पंजाबी"],
    relatedPosts: [
      {
        author: "मेहंदी आर्ट",
        handle: "@mehndiart",
        language: "हिन्दी",
        text:
          "इस करवा चौथ ट्राय करो ये सिंपल अरेबिक डिज़ाइन — 15 मिनट और लुक एकदम क्लासी।",
        likes: 19840,
        shares: 7250,
      },
    ],
  },
];

export const sourceLabelsHi: Record<TrendSource, string> = {
  search: "सर्च ट्रेंड",
  social: "सोशल बज़",
  news: "न्यूज़ कवरेज",
  video: "वीडियो वायरल",
  "cross-platform": "क्रॉस-प्लेटफ़ॉर्म",
};

export const momentumLabelsHi: Record<Trend["momentum"], string> = {
  rising: "बढ़ रहा है",
  peaking: "चरम पर",
  cooling: "धीमा पड़ रहा",
};

export function formatCount(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} करोड़`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} लाख`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return T(n);
}

export function getTrendById(id: string): Trend | undefined {
  return trends.find((t) => t.id === id);
}
