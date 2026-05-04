import { supabase } from '@/integrations/supabase/client';
import { generateChatTitle } from './aiService';

export const saveAIHistory = async (prompt: string, response: string, complexity: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Gera o título elegante via IA
  const generatedTitle = await generateChatTitle(prompt, response);

  // Salva no banco de dados, agora incluindo a coluna 'title'
  await supabase.from('user_ai_history').insert({ 
    user_id: user.id, 
    prompt: prompt, // Mantém o prompt original intacto com as tags para a IA ter o contexto real
    response: response, 
    complexity: complexity,
    title: generatedTitle // A nova coluna visual
  });
};

export const toggleFavoriteVerse = async (verseReference: string, verseText: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  // Lógica simples: tenta buscar, se existir deleta, se não existir cria.
  const { data } = await supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('verse_reference', verseReference).maybeSingle();
  
  if (data) {
    await supabase.from('user_favorites').delete().eq('id', data.id);
    return false; // Retorna false se removeu
  } else {
    await supabase.from('user_favorites').insert({ user_id: user.id, verse_reference: verseReference, verse_text: verseText });
    return true; // Retorna true se adicionou
  }
};

export const saveUserNote = async (verseReference: string | null, noteText: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  await supabase.from('user_notes').insert({ user_id: user.id, verse_reference: verseReference, note_text: noteText });
};
