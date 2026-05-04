import { supabase } from '@/integrations/supabase/client';

export const checkAndIncrementUsage = async (type: 'simple' | 'complex' | 'image' | 'translation'): Promise<boolean> => {
  // 1. Busca o usuário logado com segurança direto do servidor Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado no sistema.");
  const userId = user.id;

  const limits = { simple: 10, complex: 7, image: 5, translation: 15 };
  const column = type === 'translation' ? 'simple_count' : `${type}_count` as keyof typeof limits;
  const now = new Date();

  // 2. Busca o registro de uso atual (usa maybeSingle para evitar erro caso não exista)
  let { data, error: fetchError } = await supabase
    .from('user_ai_usage')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // 3. Se não existe registro, CRIA O REGISTRO INICIAL
  if (!data) {
    const { error: insertError } = await supabase
      .from('user_ai_usage')
      .insert({ 
        user_id: userId, 
        simple_count: 0, 
        complex_count: 0, 
        image_count: 0, 
        last_reset_time: now.toISOString(),
        tipo_uso: 'chat'
      });
      
    if (insertError) {
      console.error("Erro RLS/Insert Completo:", JSON.stringify(insertError, null, 2));
      throw new Error(`Falha ao inicializar cotas de IA: ${insertError.message || insertError.code}`);
    }

    const { data: fetchNewData } = await supabase
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!fetchNewData) throw new Error("Cotas inicializadas, mas não foi possível ler do banco. Verifique as políticas RLS (SELECT).");
    data = fetchNewData;
  } else {
    // 4. Se existe, verifica se já passaram 12 horas para resetar (Recarga de 12h)
    const lastReset = new Date(data.last_reset_time);
    const diffHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    if (diffHours >= 12) {
      const { error: updateError } = await supabase
        .from('user_ai_usage')
        .update({ 
          simple_count: 0, 
          complex_count: 0, 
          image_count: 0, 
          last_reset_time: now.toISOString() 
        })
        .eq('user_id', userId);
        
      if (updateError) throw new Error("Falha ao recarregar as cotas.");
      
      const { data: fetchUpdatedData } = await supabase
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      data = fetchUpdatedData || data;
    }
  }

  // 5. VERIFICAÇÃO DE LIMITE DIÁRIO/12H: Bloqueia a ação se bater no teto
  // @ts-ignore
  if (data[column] >= limits[type]) return false;

  // 6. Incrementa o uso de forma segura
  const { error: finalUpdateError } = await supabase
    .from('user_ai_usage')
    // @ts-ignore
    .update({ [column]: data[column] + 1 })
    .eq('user_id', userId);
    
  if (finalUpdateError) throw new Error("Falha ao registrar uso da IA.");

  return true;
};

export const getUserUsage = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { simple_count: 0, complex_count: 0, image_count: 0 };
  
  const { data } = await supabase.from('user_ai_usage').select('*').eq('user_id', user.id).maybeSingle();

  const now = new Date();
  if (data) {
    const lastReset = data.last_reset_time ? new Date(data.last_reset_time) : new Date(0);
    const diffHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 12) {
      return { simple_count: 0, complex_count: 0, image_count: 0 };
    }
  }
  
  return data || { simple_count: 0, complex_count: 0, image_count: 0 };
};

export const refundUsage = async (type: 'simple' | 'complex' | 'image'): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const userId = user.id;

  const column = `${type}_count`;

  const { data } = await supabase
    .from('user_ai_usage')
    .select(column)
    .eq('user_id', userId)
    .maybeSingle();

  if (data && data[column as keyof typeof data] > 0) {
    await supabase
      .from('user_ai_usage')
      .update({ [column]: (data[column as keyof typeof data] as number) - 1 })
      .eq('user_id', userId);
  }
};
