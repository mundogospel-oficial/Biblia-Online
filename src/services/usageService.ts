import { supabase } from '@/integrations/supabase/client';

export const getQuotaCutoff = (): string => {
  // Cota de 12 horas rolantes (recarrega 12 horas após o uso de cada recurso)
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
};

export const checkQuotaOnly = async (type: 'simple' | 'complex' | 'image' | 'create_image' | 'translation' | 'dictionary', providedUserId?: string): Promise<boolean> => {
  let userId = providedUserId;
  
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado no sistema.");
      }
      userId = user.id;
    }

    const limits = { simple: 7, complex: 5, image: 3, create_image: 3, translation: 3, dictionary: 3 };
    const limitValue = limits[type];
    const tipoUso = type;

    if (!navigator.onLine) {
      return true;
    }

    const cutoffISO = getQuotaCutoff();

    const { count, error: countError } = await supabase
      .from('user_ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tipo_uso', tipoUso)
      .gte('created_at', cutoffISO);

    if (!countError && count !== null && count >= limitValue) {
      console.warn(`[Cota Rígida] Limite de ${limitValue} atingido para '${tipoUso}'. Uso bloqueado (contagem atual nas últimas 12h: ${count}).`);
      return false;
    }

    return true;
  } catch (error: any) {
    return true;
  }
};

export const checkAndIncrementUsage = async (type: 'simple' | 'complex' | 'image' | 'create_image' | 'translation' | 'dictionary', providedUserId?: string): Promise<boolean> => {
  let userId = providedUserId;
  
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado no sistema.");
      }
      userId = user.id;
    }

    const limits = { simple: 7, complex: 5, image: 3, create_image: 3, translation: 3, dictionary: 3 };
    const limitValue = limits[type];
    const tipoUso = type;

    if (!navigator.onLine) {
      console.warn("Dispositivo offline. Permitindo uso local sem registrar na nuvem.");
      return true;
    }

    const cutoffISO = getQuotaCutoff();

    // 1. VERIFICAÇÃO RÍGIDA DE COTA (Janela de 12 horas): Consultar contagem na tabela user_ai_usage
    const { count, error: countError } = await supabase
      .from('user_ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tipo_uso', tipoUso)
      .gte('created_at', cutoffISO);

    if (!countError && count !== null && count >= limitValue) {
      console.warn(`[Cota Rígida] Limite de ${limitValue} atingido para '${tipoUso}'. Uso bloqueado (contagem atual nas últimas 12h: ${count}).`);
      return false; // COTA TOTALMENTE ESGOTADA!
    }

    // 2. Registrar consumo diretamente na tabela user_ai_usage para sincronia perfeita
    const { error: insertError } = await supabase
      .from('user_ai_usage')
      .insert({
        user_id: userId,
        tipo_uso: tipoUso,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.warn("Aviso na inserção direta em user_ai_usage, tentando via RPC:", insertError.message);
      try {
        await supabase.rpc('registrar_uso_ia_atomico', {
          p_user_id: userId,
          p_tipo_uso: tipoUso,
          p_limite_diario: limitValue
        });
      } catch (rpcErr) {
        console.warn("Exceção no fallback RPC:", rpcErr);
      }
    }

    return true;
  } catch (error: any) {
    if (error?.message?.includes("Failed to fetch")) {
      console.warn("Falha ao registrar uso devido a erro de conexão (Failed to fetch). Permitindo uso local.");
      return true;
    }
    console.warn("Aviso controlado no usageService (garantindo continuidade do app):", error?.message || error);
    return true;
  }
};

export const getUserUsage = async (providedUserId?: string) => {
  let userId = providedUserId;
  
  try {
    if (!userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { simple_count: 0, complex_count: 0, image_count: 0, create_image_count: 0, translation_count: 0, dictionary_count: 0 };
        userId = user.id;
      } catch (authErr: any) {
        if (authErr?.message?.includes("Failed to fetch")) {
          console.warn("Falha de rede ao buscar usuário para estatísticas de uso.");
          return { simple_count: 0, complex_count: 0, image_count: 0, create_image_count: 0, translation_count: 0, dictionary_count: 0 };
        }
        throw authErr;
      }
    }
    
    if (!navigator.onLine) return { simple_count: 0, complex_count: 0, image_count: 0, create_image_count: 0, translation_count: 0, dictionary_count: 0 };

    const cutoffISO = getQuotaCutoff();

    const { data, error } = await supabase
      .from('user_ai_usage')
      .select('tipo_uso')
      .eq('user_id', userId)
      .gte('created_at', cutoffISO);

    if (error) {
      if (error.message?.includes("Failed to fetch")) {
        console.warn("Conexão falhou ao buscar estatísticas do usuário (Failed to fetch). Retornando zerado seguro.");
      } else {
        console.error("Erro ao buscar uso do usuário:", error);
      }
      return { simple_count: 0, complex_count: 0, image_count: 0, create_image_count: 0, translation_count: 0, dictionary_count: 0 };
    }

    const usage = {
      simple_count: 0,
      complex_count: 0,
      image_count: 0,
      create_image_count: 0,
      translation_count: 0,
      dictionary_count: 0
    };

    data?.forEach(row => {
      if (row.tipo_uso === 'simple') usage.simple_count++;
      else if (row.tipo_uso === 'complex') usage.complex_count++;
      else if (row.tipo_uso === 'image') usage.image_count++;
      else if (row.tipo_uso === 'create_image') usage.create_image_count++;
      else if (row.tipo_uso === 'translation') usage.translation_count++;
      else if (row.tipo_uso === 'dictionary') usage.dictionary_count++;
    });

    return usage;
  } catch (error: any) {
    if (error?.message?.includes("Failed to fetch")) {
      console.warn("Erro ao buscar uso devido a falha de conexão (Failed to fetch).");
    } else {
      console.error("Erro ao processar uso:", error);
    }
    return { simple_count: 0, complex_count: 0, image_count: 0, create_image_count: 0, translation_count: 0, dictionary_count: 0 };
  }
};

export const refundUsage = async (type: 'simple' | 'complex' | 'image' | 'create_image'): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const userId = user.id;

    // Remove o último registro de uso desse tipo nas últimas 12 horas
    const cutoffISO = getQuotaCutoff();
    
    const { data: lastUsage, error: selectError } = await supabase
      .from('user_ai_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo_uso', type)
      .gte('created_at', cutoffISO)
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
