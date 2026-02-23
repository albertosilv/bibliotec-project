import { Livro } from "../models/Livro";

export interface Recomendacao {
  livro: Livro;
  score: number;
  motivo: string;
  tipo: 'categoria' | 'autor';
}