// src/constants.js
export const CFG_KEY = "config";
export const PROD_KEY = "produtos";
export const BORDAS_KEY = "bordas";
export const BAIRROS_KEY = "bairros";
export const PEDIDOS_PREFIX = "pedido_";
export const PEDIDOS_INDEX_KEY = "pedidos_index";
 
export const DEFAULT_CONFIG = {
  nomeLoja: "Pizzaria Oliveira",
  cidade: "Pinda-SP",
  telefone: "(12) 99111-9914",
  tempoEntrega: "40–60 min",
  whatsapp: "",
  aberto: true,
  senhaAdmin: "oliveira123",
};

export const DEFAULT_BORDAS = [
  { id: "b1", nome: "Tradicional", preco: 0 },
  { id: "b2", nome: "Catupiry", preco: 6 },
  { id: "b3", nome: "Cheddar", preco: 6 },
];

export const DEFAULT_BAIRROS = [
  { id: "bai1", nome: "Centro", taxa: 5 },
  { id: "bai2", nome: "Crispim", taxa: 8 },
];

export const DEFAULT_PRODUTOS = [
  { id: "p1", nome: "Marguerita", descricao: "Mussarela, tomate e manjericão", preco: 39.9, categoria: "Pizzas", foto: null, disponivel: true },
  { id: "p2", nome: "Calabresa", descricao: "Calabresa, cebola e azeitona", preco: 39.9, categoria: "Pizzas", foto: null, disponivel: true },
  { id: "p3", nome: "Ninho com morango", descricao: "Leite ninho cremoso e morango", preco: 12.5, categoria: "Esfihas Doces", foto: null, disponivel: true },
  { id: "p4", nome: "Coca 2L", descricao: "Refrigerante gelado", preco: 15, categoria: "Bebidas", foto: null, disponivel: true },
];

export const CATEGORIA_ICONES = {
  Pizzas: "🍕",
  "Esfihas Doces": "🫓",
  "Esfihas Salgadas": "🫓",
  Bebidas: "🥤",
  Sobremesas: "🍰",
};

export const brl = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const COR = {
  verde: "#2ecc40", verdeEscuro: "#1e8e2c", verdeLight: "#163320", verdeMuted: "#2a4a2e",
  cinza: "#0a0a0a", borda: "#2a2a2a", texto: "#f0f0f0", muted: "#9a9a9a",
  branco: "#1a1a1a", vermelho: "#ff5c5c", vermelhoBg: "#3a1414",
};

export const fontBody = "'Poppins', sans-serif";
