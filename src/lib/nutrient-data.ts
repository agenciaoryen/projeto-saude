/**
 * Dados de micronutrientes — compartilhado entre WeeklyReport e MonthlyReport.
 *
 * Cada entrada define:
 *  - nutrient: nome do nutriente
 *  - emoji:   ícone visual
 *  - keywords: palavras-chave que indicam presença do nutriente (busca nos itens das refeições)
 *  - synonyms: mapeia sinônimos/categorias → lista de alimentos que contam como match
 *    (ex: "carne vermelha" expande para bife, filé, picanha, contrafilé, etc.)
 *  - sources:  alimentos ricos nesse nutriente — exibidos como sugestão quando há lacuna
 */

export interface NutrientDef {
  nutrient: string;
  emoji: string;
  keywords: string[];
  synonyms: Record<string, string[]>; // categoria → itens específicos
  sources: string[];                   // sugestões de alimentos ricos
}

export const NUTRIENT_DEFS: NutrientDef[] = [
  {
    nutrient: "Ferro",
    emoji: "🩸",
    keywords: [
      "feijão", "lentilha", "grão de bico", "ervilha",
      "beterraba", "espinafre", "couve", "rúcula", "agrião",
      "fígado", "coração", "moela",
      "castanha", "nozes", "amêndoa",
      "cacau", "chocolate amargo",
      "aveia", "quinoa",
    ],
    synonyms: {
      "carne vermelha": ["bife", "filé", "picanha", "contrafilé", "alcatra", "maminha", "patinho", "coxão", "fraldinha", "costela", "hambúrguer", "carne moída", "carne assada", "carne cozida", "carne grelhada", "churrasco", "strogonoff"],
    },
    sources: ["fígado", "carne vermelha", "feijão", "lentilha", "espinafre", "beterraba", "castanhas", "cacau"],
  },
  {
    nutrient: "Cálcio",
    emoji: "🦴",
    keywords: [
      "leite", "queijo", "iogurte", "coalhada", "requeijão", "manteiga", "creme de leite",
      "brócolis", "couve", "rúcula", "espinafre",
      "gergelim", "amêndoa", "castanha",
      "tofu", "soja",
      "sardinha", "salmão",
    ],
    synonyms: {
      "latícinios": ["leite", "queijo", "iogurte", "requeijão", "manteiga", "coalhada", "creme de leite", "mussarela", "parmesão", "minas", "ricota", "cottage"],
      "verduras escuras": ["brócolis", "couve", "rúcula", "espinafre", "agrião", "mostarda"],
    },
    sources: ["leite", "queijo", "iogurte", "brócolis", "couve", "sardinha", "tofu", "gergelim"],
  },
  {
    nutrient: "Vitamina C",
    emoji: "🍊",
    keywords: [
      "laranja", "limão", "acerola", "kiwi", "morango", "manga",
      "abacaxi", "tomate", "pimentão", "brócolis", "couve",
      "goiaba", "caju", "maracujá", "mexerica", "tangerina",
      "melão", "melancia", "mamão",
    ],
    synonyms: {
      "cítricos": ["laranja", "limão", "acerola", "kiwi", "abacaxi", "mexerica", "tangerina", "maracujá", "caju"],
      "frutas": ["goiaba", "morango", "manga", "melão", "melancia", "mamão"],
    },
    sources: ["acerola", "goiaba", "pimentão", "laranja", "kiwi", "morango", "brócolis", "limão"],
  },
  {
    nutrient: "Fibras",
    emoji: "🌾",
    keywords: [
      "aveia", "chia", "linhaça", "granola", "cereal integral",
      "farelo", "ameixa", "mamão", "legume", "verdura",
      "feijão", "lentilha", "grão de bico", "ervilha",
      "pão integral", "arroz integral", "macarrão integral",
      "abacate", "banana", "maçã", "pera",
      "castanha", "amêndoa", "nozes",
      "batata doce", "mandioca", "aipim",
    ],
    synonyms: {
      "integrais": ["aveia", "granola", "pão integral", "arroz integral", "macarrão integral", "farelo", "cereal integral", "biscoito integral", "torrada integral"],
      "leguminosas": ["feijão", "lentilha", "grão de bico", "ervilha", "soja"],
    },
    sources: ["aveia", "chia", "linhaça", "frutas com casca", "feijão", "lentilha", "pão integral", "castanhas"],
  },
  {
    nutrient: "Ômega 3",
    emoji: "🐟",
    keywords: [
      "salmão", "sardinha", "atum", "bacalhau", "tilápia", "truta",
      "nozes", "linhaça", "chia",
      "arenque", "cavala", "anchova", "pescada",
      "azeite de oliva", "azeite",
      "abacate",
    ],
    synonyms: {
      "peixes gordurosos": ["salmão", "sardinha", "atum", "bacalhau", "cavala", "arenque", "anchova", "truta", "pescada"],
      "peixes": ["tilápia", "merluza", "linguado", "robalo", "badejo", "corvina", "namorado", "dourado", "pintado", "tambaqui", "pirarucu", "filé de peixe", "peixe grelhado", "peixe assado", "peixe frito"],
    },
    sources: ["salmão", "sardinha", "atum", "linhaça", "chia", "nozes", "azeite de oliva"],
  },
  {
    nutrient: "Magnésio",
    emoji: "🔋",
    keywords: [
      "banana", "castanha", "amêndoa", "abacate", "espinafre",
      "cacau", "chocolate amargo",
      "aveia", "feijão", "semente de abóbora",
      "quinoa", "tofu",
      "arroz integral", "pão integral",
    ],
    synonyms: {
      "oleaginosas": ["castanha", "amêndoa", "nozes", "amendoim", "pistache", "macadâmia", "avelã"],
      "sementes": ["semente de abóbora", "semente de girassol", "gergelim", "linhaça", "chia"],
    },
    sources: ["banana", "castanhas", "amêndoas", "abacate", "espinafre", "cacau", "aveia", "semente de abóbora"],
  },
  {
    nutrient: "Vitamina D",
    emoji: "☀️",
    keywords: [
      "salmão", "sardinha", "atum", "bacalhau",
      "ovo", "ovos", "gema",
      "cogumelo", "champignon", "shitake",
      "leite", "iogurte", "queijo",
      "fígado",
    ],
    synonyms: {
      "peixes gordurosos": ["salmão", "sardinha", "atum", "bacalhau", "cavala", "arenque"],
      "ovos": ["ovo", "ovos", "omelete", "ovo frito", "ovo cozido", "ovo mexido"],
    },
    sources: ["salmão", "sardinha", "gema de ovo", "cogumelos", "leite fortificado", "exposição solar 15-20 min/dia"],
  },
  {
    nutrient: "Vitamina B12",
    emoji: "🧠",
    keywords: [
      "fígado", "carne", "bovina",
      "salmão", "atum", "sardinha", "truta",
      "ovo", "ovos",
      "leite", "queijo", "iogurte",
      "frango", "peru",
    ],
    synonyms: {
      "carnes": ["bife", "filé", "picanha", "alcatra", "carne moída", "carne assada", "carne grelhada", "hambúrguer", "strogonoff", "churrasco", "costela", "porco", "lombo", "presunto", "bacon"],
      "aves": ["frango", "peru", "filé de frango", "peito de frango", "coxa", "sobrecoxa", "asa"],
      "ovos": ["ovo", "ovos", "omelete", "ovo frito", "ovo cozido", "ovo mexido"],
      "peixes": ["salmão", "atum", "sardinha", "truta", "tilápia", "bacalhau", "pescada"],
    },
    sources: ["fígado", "carnes vermelhas", "peixes", "ovos", "leite", "queijo"],
  },
  {
    nutrient: "Zinco",
    emoji: "🛡️",
    keywords: [
      "carne", "bovina", "frango", "peru",
      "feijão", "grão de bico", "lentilha",
      "castanha", "amêndoa", "nozes",
      "ovo", "ovos",
      "quinoa", "aveia",
      "semente de abóbora",
      "chocolate amargo", "cacau",
    ],
    synonyms: {
      "carnes": ["bife", "filé", "picanha", "alcatra", "carne moída", "carne assada", "carne grelhada", "hambúrguer", "churrasco", "strogonoff", "costela", "porco", "lombo"],
      "aves": ["frango", "peru", "filé de frango", "peito de frango", "coxa", "sobrecoxa"],
      "oleaginosas": ["castanha", "amêndoa", "nozes", "amendoim", "pistache"],
    },
    sources: ["carne vermelha", "frango", "feijão", "castanhas", "ovos", "semente de abóbora"],
  },
  {
    nutrient: "Potássio",
    emoji: "⚡",
    keywords: [
      "banana", "abacate", "batata doce", "batata",
      "espinafre", "couve",
      "feijão", "lentilha",
      "tomate", "molho de tomate",
      "laranja", "melão", "melancia",
      "iogurte", "leite",
      "salmão", "atum",
    ],
    synonyms: {
      "tubérculos": ["batata", "batata doce", "mandioca", "aipim", "inhame", "cará", "mandioquinha"],
      "frutas frescas": ["banana", "abacate", "laranja", "melão", "melancia", "mamão", "manga"],
    },
    sources: ["banana", "abacate", "batata doce", "espinafre", "feijão", "iogurte", "salmão"],
  },
  {
    nutrient: "Vitamina A",
    emoji: "👁️",
    keywords: [
      "cenoura", "batata doce", "abóbora", "moranga",
      "espinafre", "couve", "rúcula",
      "manga", "mamão", "melão",
      "ovo", "ovos", "gema",
      "fígado",
      "queijo", "leite integral", "manteiga",
    ],
    synonyms: {
      "vegetais alaranjados": ["cenoura", "abóbora", "moranga", "batata doce"],
      "verduras escuras": ["espinafre", "couve", "rúcula", "agrião", "brócolis"],
      "ovos": ["ovo", "ovos", "omelete", "ovo frito", "ovo cozido", "ovo mexido"],
    },
    sources: ["cenoura", "batata doce", "abóbora", "espinafre", "manga", "gema de ovo", "fígado"],
  },
  {
    nutrient: "Vitamina E",
    emoji: "💆",
    keywords: [
      "amêndoa", "castanha", "nozes", "amendoim",
      "semente de girassol", "gergelim",
      "abacate",
      "azeite de oliva", "azeite", "óleo vegetal",
      "espinafre", "brócolis",
      "manga", "kiwi",
    ],
    synonyms: {
      "oleaginosas": ["castanha", "amêndoa", "nozes", "amendoim", "pistache", "macadâmia", "avelã"],
      "óleos": ["azeite", "azeite de oliva", "óleo vegetal", "óleo de girassol", "óleo de canola", "óleo de milho"],
    },
    sources: ["amêndoas", "semente de girassol", "abacate", "azeite de oliva", "castanhas", "espinafre"],
  },
];

/**
 * Detecta lacunas de micronutrientes analisando os itens das refeições.
 *
 * @param allItems - nomes dos itens (lowercase, trimmed) de todas as refeições do período
 * @returns array de { nutrient, emoji, sources } para nutrientes NÃO encontrados
 */
export function detectNutrientGaps(allItems: string[]): {
  nutrient: string;
  emoji: string;
  sources: string[];
}[] {
  return NUTRIENT_DEFS
    .filter((def) => {
      // Verifica keywords diretas
      const hasKeyword = allItems.some((item) =>
        def.keywords.some((kw) => item.includes(kw))
      );
      if (hasKeyword) return false; // encontrou, não é lacuna

      // Verifica sinônimos: expande categorias → itens
      return !allItems.some((item) =>
        Object.values(def.synonyms).some((terms) =>
          terms.some((term) => item.includes(term))
        )
      );
    })
    .map((def) => ({
      nutrient: def.nutrient,
      emoji: def.emoji,
      sources: def.sources,
    }));
}
