import { supabase } from '@/integrations/supabase/client';

export const checkAndIncrementUsage = async (type: 'simple' | 'complex' | 'image' | 'translation', providedUserId?: string): Promise<boolean> => {
  let userId = providedUserId;
  
  try {
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        if (authError?.message?.includes("Failed to fetch")) {
          console.warn("Falha de rede ao autenticar para cota. Permitindo uso local.");
          return true;
        }
        console.error("Erro de autenticação ao verificar cotas:", authError);
        throw new Error("Usuário não autenticado no sistema.");
      }
      userId = user.id;
    }

    const limits = { simple: 10, complex: 7, image: 5, translation: 20 };
    const limitValue = limits[type];
    const tipoUso = type === 'translation' ? 'simple' : type;

    if (!navigator.onLine) {
      console.warn("Dispositivo offline. Permitindo uso local sem registrar na nuvem.");
      return true;
    }

    // Usar a função atômica do Supabase para garantir consistência
    const { data, error } = await supabase.rpc('registrar_uso_ia_atomico', {
      p_user_id: userId,
      p_tipo_uso: tipoUso,
      p_limite_diario: limitValue
    });

    if (error) {
      if (error.message?.includes("Failed to fetch")) {
        console.warn("Conexão falhou ao verificar cota (Failed to fetch). Permitindo ação local.");
        return true; 
      }
      console.error("Erro ao registrar uso via RPC:", error);
      // Fallback básico se a função não existir ou falhar
      throw new Error(`Erro ao verificar cota: ${error.message}`);
    }

    return !!data;
  } catch (error: any) {
    if (error?.message?.includes("Failed to fetch")) {
      console.warn("Falha ao registrar uso devido a erro de conexão (Failed to fetch). Permitindo uso local.");
      return true;
    }
    console.error("Erro geral no usageService:", error);
    throw error;
  }
};

export const getUserUsage = async (providedUserId?: string) => {
  let userId = providedUserId;
  
  try {
    if (!userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { simple_count: 0, complex_count: 0, image_count: 0 };
        userId = user.id;
      } catch (authErr: any) {
        if (authErr?.message?.includes("Failed to fetch")) {
          console.warn("Falha de rede ao buscar usuário para estatísticas de uso.");
          return { simple_count: 0, complex_count: 0, image_count: 0 };
        }
        throw authErr;
      }
    }
    
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
      if (error.message?.includes("Failed to fetch")) {
        console.warn("Conexão falhou ao buscar estatísticas do usuário (Failed to fetch). Retornando zerado seguro.");
      } else {
        console.error("Erro ao buscar uso do usuário:", error);
      }
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
  } catch (error: any) {
    if (error?.message?.includes("Failed to fetch")) {
      console.warn("Erro ao buscar uso devido a falha de conexão (Failed to fetch).");
    } else {
      console.error("Erro ao processar uso:", error);
    }
    return { simple_count: 0, complex_count: 0, image_count: 0 };
  }
};

export const refundUsage = async (type: 'simple' | 'complex' | 'image'): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const userId = user.id;

    // Remove o último registro de uso desse tipo hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: lastUsage, error: selectError } = await supabase
      .from('user_ai_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo_uso', type)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      if (selectError.message?.includes("Failed to fetch")) {
        console.warn("Falha de rede ao buscar uso para estorno.");
      } else {
        console.error("Erro ao buscar último uso para estorno:", selectError);
      }
      return;
    }

    if (lastUsage) {
      const { error: deleteError } = await supabase
        .from('user_ai_usage')
        .delete()
        .eq('id', lastUsage.id);

      if (deleteError) {
        if (deleteError.message?.includes("Failed to fetch")) {
          console.warn("Falha de rede ao deletar uso para estorno.");
        } else {
          console.error("Erro ao deletar uso para estorno:", deleteError);
        }
      }
    }
  } catch (error: any) {
    if (error?.message?.includes("Failed to fetch")) {
      console.warn("Erro ao reembolsar uso devido a falha de conexão (Failed to fetch).");
    } else {
      console.error("Erro ao reembolsar uso:", error);
    }
  }
};
