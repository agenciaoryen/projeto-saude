export interface FinSubcat {
  id: string;
  label: string;
}

export interface FinCat {
  id: string;
  emoji: string;
  hue: number;
  subcats: FinSubcat[];
  custom?: boolean;
}

export const EXPENSE_CATS: FinCat[] = [
  {
    id: "moradia", emoji: "🏠", hue: 40,
    subcats: [
      { id: "aluguel",    label: "Aluguel de Imóvel" },
      { id: "condominio", label: "Condomínio" },
      { id: "agua",       label: "Consumo de Água" },
      { id: "decoracao",  label: "Decoração" },
      { id: "energia",    label: "Energia Elétrica" },
      { id: "iptu",       label: "IPTU" },
      { id: "manutencao", label: "Manutenção/Reforma" },
      { id: "limpeza",    label: "Serv. de Limpeza" },
      { id: "utensils",   label: "Utensílios/Eletr." },
      { id: "seguradora", label: "Seguradora" },
    ],
  },
  {
    id: "alimentacao", emoji: "🍽️", hue: 30,
    subcats: [
      { id: "supermercado",  label: "Supermercado" },
      { id: "restaurante",   label: "Restaurante" },
      { id: "delivery",      label: "Lanches/Delivery" },
      { id: "padaria",       label: "Padaria" },
      { id: "acougue",       label: "Açougue" },
      { id: "frutas",        label: "Frutas/Verduras" },
      { id: "mercadinho",    label: "Mercadinho" },
      { id: "jantas",        label: "Jantas" },
      { id: "outras_alim",   label: "Outras" },
    ],
  },
  {
    id: "transporte", emoji: "🚗", hue: 220,
    subcats: [
      { id: "uber",          label: "Uber" },
      { id: "99app",         label: "99" },
      { id: "bus",           label: "Ônibus" },
      { id: "outros_transp", label: "Outros" },
    ],
  },
  {
    id: "saude_beleza", emoji: "💊", hue: 160,
    subcats: [
      { id: "plano_saude",  label: "Plano de Saúde" },
      { id: "consultas",    label: "Consultas/Exames" },
      { id: "dentista",     label: "Dentista" },
      { id: "remedios",     label: "Remédios" },
      { id: "suplementos",  label: "Suplementação" },
      { id: "academia",     label: "Academia/Esportes" },
      { id: "terapias",     label: "Tratamentos" },
      { id: "cabeleireiro", label: "Cabeleireiro" },
      { id: "manicure",     label: "Manicure" },
      { id: "higiene",      label: "Higiene Pessoal" },
      { id: "outras_saude", label: "Outras" },
    ],
  },
  {
    id: "educacao", emoji: "📚", hue: 270,
    subcats: [
      { id: "mensalidade",  label: "Mensalidade" },
      { id: "cursos",       label: "Cursos" },
      { id: "treinamentos", label: "Treinamentos" },
      { id: "livros_edu",   label: "Livros" },
      { id: "outras_edu",   label: "Outras" },
    ],
  },
  {
    id: "lazer", emoji: "🎮", hue: 185,
    subcats: [
      { id: "cinema",         label: "Cinema/Teatro/Shows" },
      { id: "viagens",        label: "Viagens/Férias" },
      { id: "streaming_lz",   label: "Streaming" },
      { id: "festas",         label: "Festas" },
      { id: "clube",          label: "Clube/Parques" },
      { id: "jogos",          label: "Jogos" },
      { id: "livros_lz",      label: "Livros/Revistas" },
      { id: "restaurante_lz", label: "Restaurantes" },
      { id: "outras_lz",      label: "Outras" },
    ],
  },
  {
    id: "pessoal", emoji: "👗", hue: 300,
    subcats: [
      { id: "roupas",      label: "Roupas" },
      { id: "calcados",    label: "Calçados" },
      { id: "acessorios",  label: "Acessórios" },
      { id: "presentes",   label: "Presentes" },
      { id: "perfumaria",  label: "Perfumaria" },
      { id: "outras_vest", label: "Outras" },
    ],
  },
  {
    id: "servicos_fin", emoji: "🏦", hue: 220,
    subcats: [
      { id: "dividas",      label: "Pag. de Dívidas" },
      { id: "emprestimos",  label: "Empréstimos" },
      { id: "seguros",      label: "Seguros" },
      { id: "tarifas",      label: "Tarifas Bancárias" },
      { id: "tramites",     label: "Trâmites" },
      { id: "outros_sfin",  label: "Outros" },
    ],
  },
  {
    id: "comunicacao", emoji: "📡", hue: 200,
    subcats: [
      { id: "cel_let",    label: "Plano Vivo Letierre" },
      { id: "internet",   label: "Internet Wifi" },
      { id: "netflix",    label: "Netflix" },
      { id: "spotify",    label: "Spotify" },
      { id: "memoria",    label: "Memória iPhone" },
      { id: "outros_com", label: "Outros" },
    ],
  },
  {
    id: "doacoes", emoji: "🙏", hue: 310,
    subcats: [
      { id: "dizimo_let",    label: "Dízimo Letierre" },
      { id: "dizimo_jos",    label: "Dízimo Josefa" },
      { id: "oferta_let",    label: "Ofertas Letierre" },
      { id: "oferta_jos",    label: "Ofertas Josefa" },
      { id: "caravana",      label: "Caravana ao Templo" },
      { id: "roupas_templo", label: "Roupas Templo" },
      { id: "ajudas",        label: "Ajudas ao Próximo" },
    ],
  },
  {
    id: "pet", emoji: "🐾", hue: 50,
    subcats: [
      { id: "racao",       label: "Ração/Comida" },
      { id: "veterinario", label: "Veterinário" },
      { id: "remedios_pet",label: "Medicamentos" },
      { id: "areia",       label: "Areia" },
      { id: "brinquedos",  label: "Brinquedos" },
      { id: "outros_pet",  label: "Outros" },
    ],
  },
  {
    id: "personalizada", emoji: "⭐", hue: 160,
    subcats: [],
    custom: true,
  },
];

export const INCOME_CATS: FinCat[] = [
  { id: "salario",       emoji: "💼", hue: 160, subcats: [] },
  { id: "freelance",     emoji: "💻", hue: 220, subcats: [] },
  { id: "investimentos", emoji: "📈", hue: 75,  subcats: [] },
  { id: "presente",      emoji: "🎁", hue: 300, subcats: [] },
  { id: "outros",        emoji: "⚙️", hue: 160, subcats: [] },
];

const LEGACY_CAT_MAP: Record<string, string> = {
  saude:       "saude_beleza",
  beleza:      "saude_beleza",
  assinaturas: "comunicacao",
  vestuario:   "pessoal",
};

export function getCatById(id: string, type: "receita" | "despesa"): FinCat {
  const list = type === "despesa" ? EXPENSE_CATS : INCOME_CATS;
  const direct = list.find((c) => c.id === id);
  if (direct) return direct;
  const mapped = LEGACY_CAT_MAP[id];
  if (mapped) {
    const legacy = list.find((c) => c.id === mapped);
    if (legacy) return legacy;
  }
  return { id: "outros", emoji: "⚙️", hue: 160, subcats: [] };
}

export type CustomCat = {
  name: string;
  emoji: string;
  subcats: string[];
};

export function getSubcats(
  catId: string,
  cats: FinCat[],
  customCat: CustomCat | null,
): FinSubcat[] {
  const cat = cats.find((c) => c.id === catId);
  if (!cat) return [];
  if (cat.custom) {
    const labels = customCat?.subcats?.length ? customCat.subcats : ["Personalizado"];
    return labels.map((label, i) => ({ id: `p${i}`, label }));
  }
  return cat.subcats;
}
