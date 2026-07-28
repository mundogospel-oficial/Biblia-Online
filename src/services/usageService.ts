import { supabase } from '@/integrations/supabase/client';

export const checkAndIncrementUsage = async (type: 'simple' | 'complex' | 'image' | 'create_image' | 'translation' | 'dictionary', providedUserId?: string): Promise<boolean> => {
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

    const limits = { simple: 7, complex: 5, image: 3, create_image: 3, translation: 3, dictionary: 3 };
    const limitValue = limits[type];
    const tipoUso = type;

    if (!navigator.onLine) {
      console.warn("Dispositivo offline. Permitindo uso local sem registrar na nuvem.");
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. VERIFICAÇÃO RÍGIDA DE COTA: Consultar contagem direta na tabela user_ai_usage
    const { count, error: countError } = await supabase
      .from('user_ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tipo_uso', tipoUso)
      .gte('created_at', todayISO);

    if (!countError && count !== null && count >= limitValue) {
      console.warn(`[Cota Rígida] Limite diário de ${limitValue} atingido para '${tipoUso}'. Uso bloqueado.`);
      return false; // COTA TOTALMENTE ESGOTADA! NÃO PERMITIR NENHUMA AÇÃO!
    }

    // 2. Tentar registrar consumo via RPC atômico
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('registrar_uso_ia_atomico', {
        p_user_id: userId,
        p_tipo_uso: tipoUso,
        p_limite_diario: limitValue
      });

      if (!rpcError) {
        if (typeof rpcData === 'boolean') {
          return rpcData;
        }
        if (rpcData && typeof rpcData === 'object' && 'allowed' in rpcData) {
          return Boolean((rpcData as any).allowed);
        }
        // Se a chamada RPC executou sem erro, o registro já foi realizado no banco atômico!
        return true;
      }
    } catch (rpcEx) {
      console.warn("Aviso na chamada RPC registrar_uso_ia_atomico:", rpcEx);
    }

    // 3. Fallback: Registrar consumo diretamente na tabela user_ai_usage APENAS se a RPC falhou/não existe
    try {
      const { error: insertError } = await supabase
        .from('user_ai_usage')
        .insert({
          user_id: userId,
          tipo_uso: tipoUso,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn("Aviso na inserção direta em user_ai_usage:", insertError.message);
      }
    } catch (insErr: any) {
      console.warn("Exceção ao inserir em user_ai_usage:", insErr?.message);
    }

    // Se a contagem era menor que o limite, permite o uso pois acabamos de registrar
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
