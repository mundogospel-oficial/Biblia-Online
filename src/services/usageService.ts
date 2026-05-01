import { supabase } from '@/integrations/supabase/client';

export const checkAndIncrementUsage = async (userId: string, type: 'simple' | 'complex' | 'image'): Promise<boolean> => {
  const limits = { simple: 10, complex: 7, image: 5 };
  const tipoUsoMap = {
    simple: 'chat',
    complex: 'gemini_chat',
    image: 'imagem'
  };
  const tipo_uso = tipoUsoMap[type] || type;

  const { data, error } = await supabase.rpc('registrar_uso_ia_atomico', {
    p_user_id: userId,
    p_tipo_uso: tipo_uso,
    p_limite_diario: limits[type]
  });

  if (error) {
    console.error('Erro ao verificar cota:', error);
    // Em caso de erro na RPC, podemos negar o uso por precaução ou permitir. Melhor negar se não consegue validar.
    return false;
  }

  return !!data;
};
