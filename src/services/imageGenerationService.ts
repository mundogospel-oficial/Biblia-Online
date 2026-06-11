import { getSystemRule } from './aiService';

export const generateBiblicalImage = async (
  userPrompt: string, 
  signal?: AbortSignal,
  aspectRatio: 'square' | 'story' | 'landscape' = 'square',
  returnRawUrl: boolean = false
): Promise<string> => {
  throw new Error("SISTEMA EM MANUTENÇÃO: A criação de Imagens com Inteligência Artificial está temporariamente suspensa para manutenção planejada na infraestrutura do servidor de renderização. Voltará em breve!");
};
