import { supabase } from '@/integrations/supabase/client';
import { generateChatTitle } from './aiService';
import { encryptPayload, decryptPayload } from '@/lib/security/cryptoService';

export const saveAIHistory = async (prompt: string, response: string, complexity: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Gera o título elegante via IA antes de criptografar
  const generatedTitle = await generateChatTitle(prompt, response);

  // Criptografa o prompt e a resposta com chave derivada do ID do usuário para privacidade total
  const encryptedPrompt = await encryptPayload(prompt, user.id);
  const encryptedResponse = await encryptPayload(response, user.id);

  // Salva no banco de dados com dados criptografados em repouso
  await supabase.from('user_ai_history').insert({ 
    user_id: user.id, 
    prompt: encryptedPrompt, 
    response: encryptedResponse, 
    complexity: complexity,
    title: generatedTitle
  });
};

export const getAIHistory = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_ai_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Descriptografa os registros de forma transparente
  const decryptedHistory = await Promise.all(
    data.map(async (row) => ({
      ...row,
      prompt: await decryptPayload(row.prompt, user.id),
      response: await decryptPayload(row.response, user.id)
    }))
  );

  return decryptedHistory;
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

export const clearAIHistoryOnServer = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_ai_history').delete().eq('user_id', user.id);
};
