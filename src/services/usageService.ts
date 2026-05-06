import { supabase } from '@/integrations/supabase/client';

export const checkAndIncrementUsage = async (type: 'simple' | 'complex' | 'image' | 'translation', providedUserId?: string): Promise<boolean> => {
  let userId = providedUserId;
  
  if (!userId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Erro de autenticação ao verificar cotas:", authError);
      throw new Error("Usuário não autenticado no sistema.");
    }
    userId = user.id;
  }

  const limits = { simple: 10, complex: 7, image: 5, translation: 20 };
  const limitValue = limits[type];
  const tipoUso = type === 'translation' ? 'simple' : type;

  try {
    if (!navigator.onLine) throw new Error("A verificação de cotas requer internet.");

    // Usar a função atômica do Supabase para garantir consistência
    const { data, error } = await supabase.rpc('registrar_uso_ia_atomico', {
      p_user_id: userId,
      p_tipo_uso: tipoUso,
      p_limite_diario: limitValue
    });

    if (error) {
      console.error("Erro ao registrar uso via RPC:", error);
      if (error.message.includes("Failed to fetch")) {
        // Se falhar a conexão, vamos permitir o uso localmente (graceful degradation)
        // ou pelo menos dar um aviso melhor.
        console.warn("Conexão falhou ao verificar cota. Permitindo ação local.");
        return true; 
      }
      // Fallback básico se a função não existir ou falhar
      throw new Error(`Erro ao verificar cota: ${error.message}`);
    }

    return !!data;
  } catch (error: any) {
    console.error("Erro geral no usageService:", error);
    throw error;
  }
};

export const getUserUsage = async (providedUserId?: string) => {
  let userId = providedUserId;
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { simple_count: 0, complex_count: 0, image_count: 0 };
    userId = user.id;
  }
  
  try {
    if (!navigator.onLine) return { simple_count: 0, complex_count: 0, image_count: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from('user_ai_usage')
      .select('tipo_uso')
      .eq('user_id', userId)
      .gte('created_at', todayISO);

    if (error) {
      console.error("Erro ao buscar uso do usuário:", error);
      return { simple_count: 0, complex_count: 0, image_count: 0 };
    }

    const usage = {
      simple_count: 0,
      complex_count: 0,
      image_count: 0
    };

    data?.forEach(row => {
      if (row.tipo_uso === 'simple' || row.tipo_uso === 'translation') usage.simple_count++;
      else if (row.tipo_uso === 'complex') usage.complex_count++;
      else if (row.tipo_uso === 'image') usage.image_count++;
    });

    return usage;
  } catch (error) {
    console.error("Erro ao processar uso:", error);
    return { simple_count: 0, complex_count: 0, image_count: 0 };
  }
};

export const refundUsage = async (type: 'simple' | 'complex' | 'image'): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const userId = user.id;

  try {
    // Remove o último registro de uso desse tipo hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: lastUsage } = await supabase
      .from('user_ai_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo_uso', type)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastUsage) {
      await supabase
        .from('user_ai_usage')
        .delete()
        .eq('id', lastUsage.id);
    }
  } catch (error) {
    console.error("Erro ao reembolsar uso:", error);
  }
};
