import type { Square } from "chess.js";

export interface LessonTaskDefinition {
  type: "select-square";
  prompt: string;
  fen: string;
  orientation?: "w" | "b";
  highlightSquares?: Square[];
  validSquares: Square[];
  successMessage: string;
  failureMessage: string;
}

export interface LessonDefinition {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  shortTitle: string;
  duration: string;
  goal: string;
  summary: string;
  teachingTools: string[];
  output: string[];
  motivation: string[];
  rewardTitle: string;
  rewardEmoji: string;
  miniMission: string;
  gameMission: string;
  task?: LessonTaskDefinition;
}

export interface LessonModuleDefinition {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  theme: string;
  moduleGoal: string;
  rewardTrack: string;
  lessons: LessonDefinition[];
}

export interface LearningRewardDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export const LESSON_MODULES: LessonModuleDefinition[] = [
  {
    id: "bli-venn-med-brettet",
    order: 1,
    title: "Bli venn med brettet",
    subtitle: "Trygg start med brett og brikker",
    theme: "grunnforståelse",
    moduleGoal:
      "Gi barnet trygghet på brett, ruter og brikker, slik at sjakk føles oversiktlig og lekent.",
    rewardTrack: "Brettoppdager",
    lessons: [
      {
        id: "brettet-og-rutene",
        moduleId: "bli-venn-med-brettet",
        order: 1,
        title: "Brettet og rutene",
        shortTitle: "Brettet",
        duration: "5 min",
        goal: "Forstå at sjakkbrettet består av rader, linjer og diagonaler.",
        summary:
          "Barnet lærer å se brettet som et mønster i stedet for en tilfeldig flate.",
        teachingTools: [
          "Visuelle highlights på rader og diagonaler",
          "Korte pek-og-finn-oppgaver",
          "Vennlig språk uten faglig tyngde",
        ],
        output: [
          "Kan gjenkjenne rad, linje og diagonal",
          "Forstår at brikker beveger seg i bestemte retninger",
        ],
        motivation: [
          "Tidlig mestring uten risiko for å feile stort",
          "Belønning: Brettoppdager",
          "Oppmuntring: Nå begynner du å se brettet som en sjakkspiller",
        ],
        rewardTitle: "Brettoppdager",
        rewardEmoji: "🗺️",
        miniMission: "Finn én diagonal og én rett linje på brettet.",
        gameMission: "Når du spiller neste parti, prøv å legge merke til om brikkene dine går rett eller diagonalt.",
        task: {
          type: "select-square",
          prompt: "Trykk på en av de fire sentrumsrutene på brettet.",
          fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
          highlightSquares: ["d4", "e4", "d5", "e5"],
          validSquares: ["d4", "e4", "d5", "e5"],
          successMessage: "Ja. Disse rutene er midt på brettet og blir ofte viktige i partiet.",
          failureMessage: "Prøv igjen og let etter de fire rutene som ligger nærmest midten.",
        },
      },
      {
        id: "bonden",
        moduleId: "bli-venn-med-brettet",
        order: 2,
        title: "Bonden",
        shortTitle: "Bonden",
        duration: "5 min",
        goal: "Forstå hvordan bonden går fremover og slår diagonalt.",
        summary:
          "Bonden ser enkel ut, men lærer barnet forskjellen mellom å gå og å slå.",
        teachingTools: [
          "Små stillinger med én bonde om gangen",
          "Først riktig eksempel, så moteksempel",
          "Kort utfordring med bondeslag",
        ],
        output: [
          "Kan gjøre lovlige bondetrekk",
          "Forstår forskjellen på fremdrift og slag",
        ],
        motivation: [
          "Belønning: Bondestarter",
          "Minioppdrag som kan prøves i ekte parti",
          "Feedback: Små brikker kan gjøre stor forskjell",
        ],
        rewardTitle: "Bondestarter",
        rewardEmoji: "🌱",
        miniMission: "Finn ett bondetrekk og ett bondeslag som er lovlige.",
        gameMission: "Prøv å slå en brikke med bonde i et ekte parti denne uka.",
        task: {
          type: "select-square",
          prompt: "Den hvite bonden står på d2. Trykk på en lovlig rute bonden kan gå til nå.",
          fen: "4k3/8/8/8/8/8/3P4/4K3 w - - 0 1",
          orientation: "w",
          validSquares: ["d3", "d4"],
          successMessage: "Riktig. Bonden går rett frem, og fra startfeltet kan den også gå to ruter.",
          failureMessage: "Bonden går rett frem, ikke diagonalt når den bare flytter seg.",
        },
      },
      {
        id: "tarn-og-loper",
        moduleId: "bli-venn-med-brettet",
        order: 3,
        title: "Tårn og løper",
        shortTitle: "Tårn og løper",
        duration: "6 min",
        goal: "Skille mellom rette linjer og diagonaler.",
        summary:
          "Barnet sammenligner to brikker som er lette å huske når retningene blir tydelige.",
        teachingTools: [
          "Sammenligningsoppgaver med to mulige brikker",
          "Visuell markering av gyldige felt",
          "Liten quiz med raske svar",
        ],
        output: [
          "Kan velge riktig brikke til riktig retning",
          "Blir tryggere på hvordan linjebrikker fungerer",
        ],
        motivation: [
          "Belønning: Linjemester",
          "Oppmuntring: Nå leser du bevegelsene mye raskere",
        ],
        rewardTitle: "Linjemester",
        rewardEmoji: "📏",
        miniMission: "Se på to ruter og avgjør om tårn eller løper kommer dit raskest.",
        gameMission: "Når du spiller, prøv å få minst ett tårn eller én løper aktivt med i partiet.",
        task: {
          type: "select-square",
          prompt: "Løperen står på c1. Trykk på en rute løperen kan nå diagonalt.",
          fen: "4k3/8/8/8/8/8/8/2B1K3 w - - 0 1",
          orientation: "w",
          validSquares: ["b2", "a3", "d2", "e3", "f4", "g5", "h6"],
          successMessage: "Ja. Løperen går bare diagonalt, og den kan gli så langt det er ledig.",
          failureMessage: "Prøv igjen. Løperen går ikke rett frem eller sidelengs, bare diagonalt.",
        },
      },
      {
        id: "springer-og-dronning",
        moduleId: "bli-venn-med-brettet",
        order: 4,
        title: "Springer og dronning",
        shortTitle: "Springer og dronning",
        duration: "6 min",
        goal: "Forstå springerhoppet og hvor kraftig dronningen er.",
        summary:
          "To veldig ulike brikker gjør det lettere å huske både mønster og rekkevidde.",
        teachingTools: [
          "Springerhopp som små puslespill",
          "Dronningsruter med tydelig mønster",
          "Korte 'hvem når flest ruter'-oppgaver",
        ],
        output: [
          "Kan forklare springerens L-form",
          "Vet hvorfor dronningen er en sterk brikke",
        ],
        motivation: [
          "Belønning: Springerutforsker",
          "Liten animert feiring ved riktig springerhopp",
        ],
        rewardTitle: "Springerutforsker",
        rewardEmoji: "🐴",
        miniMission: "Finn ett felt bare springeren kan nå.",
        gameMission: "I neste parti: prøv å flytte springeren ut tidlig uten å miste den.",
        task: {
          type: "select-square",
          prompt: "Springeren står på d4. Trykk på en rute springeren kan hoppe til.",
          fen: "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1",
          orientation: "w",
          validSquares: ["b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5"],
          successMessage: "Flott. Springeren hopper i L-form og bryr seg ikke om brikker i mellom.",
          failureMessage: "Prøv igjen. Tenk ett hakk bort og så ett til siden, som en liten L.",
        },
      },
      {
        id: "kongen",
        moduleId: "bli-venn-med-brettet",
        order: 5,
        title: "Kongen",
        shortTitle: "Kongen",
        duration: "5 min",
        goal: "Forstå hvordan kongen går og hvorfor han må stå trygt.",
        summary:
          "Kongen er langsom, men viktigst. Barnet får tidlig forståelse for sjakk og sikkerhet.",
        teachingTools: [
          "Finn trygg rute-oppgaver",
          "Rolige én-trekks-eksempler",
          "Tydelig språk rundt 'truet' og 'trygg'",
        ],
        output: [
          "Kan gjøre lovlige kongtrekk",
          "Vet at kongen ikke kan stå i sjakk",
        ],
        motivation: [
          "Belønning: Kongens venn",
          "Oppmuntring: Nå passer du på den viktigste brikken",
        ],
        rewardTitle: "Kongens venn",
        rewardEmoji: "👑",
        miniMission: "Finn den tryggeste ruten for kongen.",
        gameMission: "Se etter én ting som gjør kongen din tryggere i neste parti.",
        task: {
          type: "select-square",
          prompt: "Kongen står på e4 og tårnet angriper hele e-linjen. Trykk på en trygg rute kongen kan gå til.",
          fen: "k3r3/8/8/8/4K3/8/8/8 w - - 0 1",
          orientation: "w",
          validSquares: ["d3", "d4", "d5", "f3", "f4", "f5"],
          successMessage: "Ja. Kongen må ut av fare og kan ikke bli stående på felt som er truet.",
          failureMessage: "Kongen kan ikke bli stående i tårnets angrep. Se etter en trygg rute ved siden av.",
        },
      },
    ],
  },
  {
    id: "spill-et-helt-parti",
    order: 2,
    title: "Spill et helt parti",
    subtitle: "Fra første trekk til slutt",
    theme: "grunnspill",
    moduleGoal:
      "Gjøre barnet i stand til å forstå viktige spillsituasjoner og fullføre enkle partier.",
    rewardTrack: "Partistarter",
    lessons: [
      {
        id: "sjakk-og-sjakk-matt",
        moduleId: "spill-et-helt-parti",
        order: 1,
        title: "Sjakk og sjakk matt",
        shortTitle: "Sjakk og matt",
        duration: "6 min",
        goal: "Skille mellom sjakk, sjakk matt og trygg stilling.",
        summary:
          "Barnet lærer hva som gjør et trekk farlig og når partiet faktisk er slutt.",
        teachingTools: [
          "Tre små stillinger å sammenligne",
          "Klassifisering med ett trykk",
          "Tydelig forskjell mellom fare og slutt",
        ],
        output: [
          "Kjenner igjen sjakk",
          "Vet hva sjakk matt betyr",
        ],
        motivation: [
          "Belønning: Mattoppdager",
          "Oppmuntring: Nå forstår du hva som virkelig avgjør partiet",
        ],
        rewardTitle: "Mattoppdager",
        rewardEmoji: "🎯",
        miniMission: "Se på tre stillinger og finn den som faktisk er matt.",
        gameMission: "Neste gang noen sier 'sjakk', stopp opp og se om kongen også har en trygg rute.",
        task: {
          type: "select-square",
          prompt: "Hvit dronning står på h5 og kongen på e1. Trykk på ruten dronningen kan gå til for å gi sjakk matt.",
          fen: "6k1/6pp/8/7Q/8/8/8/4K3 w - - 0 1",
          orientation: "w",
          validSquares: ["e8"],
          successMessage: "Riktig. Dette trekket fanger kongen helt og partiet er slutt.",
          failureMessage: "Se etter ruten der dronningen både angriper kongen og stenger alle fluktveier.",
        },
      },
      {
        id: "rokade",
        moduleId: "spill-et-helt-parti",
        order: 2,
        title: "Rokade",
        shortTitle: "Rokade",
        duration: "5 min",
        goal: "Forstå hva rokade er og hvorfor det ofte er smart.",
        summary:
          "Rokade introduseres som et enkelt grep for å få kongen i sikkerhet og tårnet i spill.",
        teachingTools: [
          "Før/etter-bilder av kongestilling",
          "Én kort regel om når det er lov",
          "Minioppgave: rokade eller ikke?",
        ],
        output: [
          "Vet hva rokade gjør",
          "Forstår at rokade handler om trygg konge",
        ],
        motivation: [
          "Belønning: Rokadestarter",
          "Oppmuntring: Nå kan du beskytte kongen på en smart måte",
        ],
        rewardTitle: "Rokadestarter",
        rewardEmoji: "🏰",
        miniMission: "Finn en stilling der rokade er både lov og lurt.",
        gameMission: "Prøv å rokere i ett ekte parti denne uka.",
        task: {
          type: "select-square",
          prompt: "Hvit kan rokere kort. Trykk på ruten kongen ender på etter rokade.",
          fen: "4k2r/8/8/8/8/8/8/4K2R w Kk - 0 1",
          orientation: "w",
          validSquares: ["g1"],
          successMessage: "Ja. Ved kort rokade flytter kongen til g1 og tårnet hjelper til fra f1.",
          failureMessage: "Ved kort rokade går kongen to ruter mot tårnet, ikke bare én.",
        },
      },
      {
        id: "forvandling",
        moduleId: "spill-et-helt-parti",
        order: 3,
        title: "Bøndenes mål: forvandling",
        shortTitle: "Forvandling",
        duration: "5 min",
        goal: "Forstå hva som skjer når en bonde når siste rad.",
        summary:
          "Barnet lærer at bønder kan bli store helter sent i partiet.",
        teachingTools: [
          "Liten bondeløpsoppgave",
          "Tydelig visning av ny dronning",
          "Enkelt språk om hvorfor dette er viktig",
        ],
        output: [
          "Vet at bonden kan bli til ny brikke",
          "Forstår hvorfor bønder blir farlige sent i partiet",
        ],
        motivation: [
          "Belønning: Ny dronning!",
          "Oppmuntring: Små brikker kan vokse til store overraskelser",
        ],
        rewardTitle: "Ny dronning!",
        rewardEmoji: "✨",
        miniMission: "Finn veien til siste rad for bonden.",
        gameMission: "I sluttspill: se om en bonde kan begynne å løpe fremover.",
        task: {
          type: "select-square",
          prompt: "Den hvite bonden er ett trekk unna. Trykk på ruten den må gå til for å forvandle seg.",
          fen: "7k/3P4/8/8/8/8/8/4K3 w - - 0 1",
          orientation: "w",
          validSquares: ["d8"],
          successMessage: "Flott. Når bonden når siste raden, kan den bli til en ny brikke.",
          failureMessage: "Bonden må helt frem til siste raden for å forvandle seg.",
        },
      },
      {
        id: "forste-treningsparti",
        moduleId: "spill-et-helt-parti",
        order: 4,
        title: "Spill ditt første treningsparti",
        shortTitle: "Treningsparti",
        duration: "10 min",
        goal: "Fullføre et kort, veiledet parti fra start til slutt.",
        summary:
          "Barnet får en første opplevelse av å holde et parti i gang og komme helt i mål.",
        teachingTools: [
          "Vennlige meldinger underveis",
          "Siste trekk-highlight",
          "Etterpå-kommentar med ros",
        ],
        output: [
          "Har fullført et helt parti",
          "Vet at det går fint å bruke tid og gjøre feil underveis",
        ],
        motivation: [
          "Trofé: Første fullførte parti",
          "Oppmuntring: Et fullført parti er en stor milepæl",
        ],
        rewardTitle: "Første fullførte parti",
        rewardEmoji: "🏆",
        miniMission: "Fullfør et kort parti uten å gi opp underveis.",
        gameMission: "Ta med en i familien og spill et helt parti sammen.",
      },
    ],
  },
  {
    id: "se-farer-og-sjanser",
    order: 3,
    title: "Se farer og sjanser",
    subtitle: "Taktikk på barnespråk",
    theme: "grunnleggende taktikk",
    moduleGoal:
      "Lære barnet å kjenne igjen enkle farer, hengende brikker og små taktiske sjanser.",
    rewardTrack: "Taktikkspotter",
    lessons: [
      {
        id: "ubeskyttede-brikker",
        moduleId: "se-farer-og-sjanser",
        order: 1,
        title: "Ubeskyttede brikker",
        shortTitle: "Hengende brikker",
        duration: "6 min",
        goal: "Oppdage når en brikke står alene og kan tapes gratis.",
        summary:
          "Barnet får en enkel vane: se etter brikker som ingen passer på.",
        teachingTools: [
          "Pek-ut-oppgaver",
          "Rød highlight på truede brikker",
          "Rolig coach-tekst i stedet for advarsler",
        ],
        output: [
          "Ser oftere gratis trusler",
          "Tenker mer før brikker slippes løse",
        ],
        motivation: [
          "Belønning: Vaktmester",
          "Oppmuntring: Nå begynner du å passe bedre på hele laget ditt",
        ],
        rewardTitle: "Vaktmester",
        rewardEmoji: "🛡️",
        miniMission: "Finn én brikke som henger og én som er trygg.",
        gameMission: "Før du slipper et trekk i neste parti: se om noen av brikkene dine står ubeskyttet.",
        task: {
          type: "select-square",
          prompt: "Hvilken hvit brikke står ubeskyttet? Trykk på ruten den står på.",
          fen: "4k3/8/8/8/8/8/3Q4/4K2R w - - 0 1",
          orientation: "w",
          validSquares: ["d2"],
          successMessage: "Ja. Dronningen står alene her, uten at en annen hvit brikke passer på den.",
          failureMessage: "Se etter brikken som ingen andre hvite brikker beskytter.",
        },
      },
      {
        id: "gaffel",
        moduleId: "se-farer-og-sjanser",
        order: 2,
        title: "Gaffel",
        shortTitle: "Gaffel",
        duration: "6 min",
        goal: "Forstå en enkel dobbeltrussel, spesielt med springer.",
        summary:
          "Barnet lærer at ett trekk noen ganger kan true to ting samtidig.",
        teachingTools: [
          "Små gaffeloppgaver",
          "Enkelt språk: to ting på én gang",
          "Belønning for å finne begge truslene",
        ],
        output: [
          "Kan gjenkjenne minst én enkel gaffel",
          "Begynner å lete etter doble trusler",
        ],
        motivation: [
          "Belønning: Gaffeljeger",
          "Oppmuntring: Smarte trekk kan gjøre mer enn én jobb",
        ],
        rewardTitle: "Gaffeljeger",
        rewardEmoji: "🍴",
        miniMission: "Finn et trekk som angriper to brikker samtidig.",
        gameMission: "Se etter én situasjon i et ekte parti der springeren kan true to ting på en gang.",
        task: {
          type: "select-square",
          prompt: "Springeren kan lage gaffel. Trykk på ruten springeren skal hoppe til.",
          fen: "4k3/8/8/3N4/8/8/4r3/6rK w - - 0 1",
          orientation: "w",
          validSquares: ["f6"],
          successMessage: "Ja. Fra f6 angriper springeren to viktige brikker samtidig.",
          failureMessage: "Prøv å finne feltet der springeren kan true mer enn én ting på én gang.",
        },
      },
      {
        id: "matt-i-1",
        moduleId: "se-farer-og-sjanser",
        order: 3,
        title: "Matt i 1",
        shortTitle: "Matt i 1",
        duration: "5 min",
        goal: "Finne helt enkle mattebilder og avslutninger.",
        summary:
          "Barnet får følelsen av å oppdage en direkte vinneridé.",
        teachingTools: [
          "Korte oppgaver med klar løsning",
          "Sterk visuell feiring ved riktig svar",
          "Kun én idé per stilling",
        ],
        output: [
          "Kan finne enkle mattmuligheter",
          "Skjønner at kongen noen ganger kan fanges med ett trekk",
        ],
        motivation: [
          "Belønning: Mattjeger I",
          "Oppmuntring: Nå ser du avslutninger som endrer hele partiet",
        ],
        rewardTitle: "Mattjeger I",
        rewardEmoji: "⚡",
        miniMission: "Finn trekket som avslutter partiet med én gang.",
        gameMission: "Hvis motstanderens konge ser utsatt ut i neste parti, stopp opp og se etter direkte sjanser.",
        task: {
          type: "select-square",
          prompt: "Hvit dronning står på g7. Trykk på ruten som gir matt i ett trekk.",
          fen: "6k1/6Q1/6K1/8/8/8/8/8 w - - 0 1",
          orientation: "w",
          validSquares: ["g8"],
          successMessage: "Sterkt sett. Dette avslutter partiet med én gang.",
          failureMessage: "Se etter trekket som lar dronningen kontrollere kongens siste fluktruter.",
        },
      },
    ],
  },
];

export function getLessonById(lessonId: string) {
  for (const module of LESSON_MODULES) {
    const lesson = module.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return { module, lesson };
    }
  }

  return null;
}

export function getAllLessons() {
  return LESSON_MODULES.flatMap((module) => module.lessons);
}

const LEARNING_REWARDS: LearningRewardDefinition[] = [
  {
    id: "first-lesson",
    title: "Første læringssteg",
    description: "Du fullførte din første sjakkleksjon.",
    emoji: "🌟",
  },
  {
    id: "three-lessons",
    title: "I gang for alvor",
    description: "Tre leksjoner er fullført. Nå bygges vanen.",
    emoji: "🚀",
  },
  {
    id: "five-lessons",
    title: "Trygg ved brettet",
    description: "Fem leksjoner er fullført. Du kjenner brettet mye bedre nå.",
    emoji: "🧠",
  },
  {
    id: "first-module",
    title: "Brettvenn",
    description: "Hele første modul er fullført.",
    emoji: "🏅",
  },
  {
    id: "all-current-lessons",
    title: "Læringshelt",
    description: "Alle leksjonene i første versjon er fullført.",
    emoji: "🏆",
  },
];

export function getLearningRewards(completedLessonIds: string[]) {
  const completed = new Set(completedLessonIds);
  const earned = new Set<string>();

  if (completedLessonIds.length >= 1) {
    earned.add("first-lesson");
  }

  if (completedLessonIds.length >= 3) {
    earned.add("three-lessons");
  }

  if (completedLessonIds.length >= 5) {
    earned.add("five-lessons");
  }

  const firstModule = LESSON_MODULES[0];
  if (firstModule && firstModule.lessons.every((lesson) => completed.has(lesson.id))) {
    earned.add("first-module");
  }

  if (getAllLessons().every((lesson) => completed.has(lesson.id))) {
    earned.add("all-current-lessons");
  }

  return {
    earnedRewards: LEARNING_REWARDS.filter((reward) => earned.has(reward.id)),
    nextRewards: LEARNING_REWARDS.filter((reward) => !earned.has(reward.id)).slice(0, 3),
  };
}

export function getDailyLessonChallenge(date = new Date()) {
  const lessons = getAllLessons();
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return lessons[dayOfYear % lessons.length] ?? null;
}
