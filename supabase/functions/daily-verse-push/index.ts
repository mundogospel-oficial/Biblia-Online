// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Versículos diários selecionados para o disparo do Push
const DAILY_VERSES = [
  { text: "O SENHOR é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "Se Deus é por nós, quem será contra nós?", reference: "Romanos 8:31" },
  { text: "Lancem sobre ele todas as suas ansiedades, porque ele cuida de vocês.", reference: "1 Pedro 5:7" },
  { text: "Busquem em primeiro lugar o Reino de Deus e a sua justiça, e todas estas coisas lhes serão acrescentadas.", reference: "Mateus 6:33" },
  { text: "Não fui eu que lhe ordenei? Seja forte e corajoso! Não tenha medo, nem desanime, pois o SENHOR, seu Deus, estará com você por onde quer que você andar.", reference: "Josué 1:9" },
  { text: "Confie no SENHOR de todo o seu coração, e não se apoie em seu próprio entendimento.", reference: "Provérbios 3:5" },
  { text: "Mil poderão cair ao seu lado, e dez mil à sua direita, mas você não será atingido.", reference: "Salmos 91:7" },
  { text: "E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", reference: "Romanos 8:28" },
  { text: "Não fiquem ansiosos por coisa alguma; antes, as suas petições sejam conhecidas diante de Deus em toda oração e súplica, com ação de graças.", reference: "Filipenses 4:6" },
  { text: "E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.", reference: "Filipenses 4:7" },
  { text: "O SENHOR é a minha luz e a minha salvação; de quem terei medo? O SENHOR é a fortaleza da minha vida; de quem terei temor?", reference: "Salmos 27:1" },
  { text: "Porque sou eu que conheço os planos que tenho para vocês, diz o SENHOR, planos de paz e não de mal, para lhes dar um futuro e uma esperança.", reference: "Jeremias 29:11" },
  { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105" },
  { text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim.", reference: "João 14:6" },
  { text: "Fiz o meu clamor ao SENHOR, e ele me respondeu; livrou-me de todos os meus temores.", reference: "Salmos 34:4" },
  { text: "Mas os que esperam no SENHOR renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.", reference: "Isaías 40:31" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { text: "O SENHOR está perto dos que têm o coração quebrantado, e salva os de espírito abatido.", reference: "Salmos 34:18" },
  { text: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.", reference: "Romanos 12:12" },
  { text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.", reference: "João 14:27" },
  { text: "Deleite-se no SENHOR, e ele lhe concederá os desejos do seu coração.", reference: "Salmos 37:4" },
  { text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", reference: "Salmos 91:1" },
  { text: "Em paz me deitarei e dormirei, porque só tu, SENHOR, me fazes habitar em segurança.", reference: "Salmos 4:8" },
  { text: "Elevo os meus olhos para os montes; de onde me virá o socorro? O meu socorro vem do SENHOR, que fez o céu e a terra.", reference: "Salmos 121:1-2" }
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const onesignalAppId = Deno.env.get("ONESIGNAL_APP_ID") || "YOUR_ONESIGNAL_APP_ID";
    const onesignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";

    if (!onesignalAppId || onesignalAppId === "YOUR_ONESIGNAL_APP_ID") {
      return new Response(
        JSON.stringify({ 
          error: "ONESIGNAL_APP_ID não configurado nos secrets do Supabase/ambiente." 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    let isEvening = false;
    let customText = "";
    let customRef = "";

    // Permite parâmetros manuais via POST ou GET
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.slot === "evening" || body.isEvening === true) isEvening = true;
        if (body.text) customText = body.text;
        if (body.reference) customRef = body.reference;
      } catch {
        // Se body for vazio, continua com base no horário
      }
    } else {
      const url = new URL(req.url);
      if (url.searchParams.get("slot") === "evening") isEvening = true;
    }

    // Se não especificado manualmente, calcula se é noite com base no horário UTC (20h às 23h UTC)
    if (!customText && !customRef) {
      const now = new Date();
      const utcHours = now.getUTCHours();
      // 20h horário de Brasília é 23h UTC
      if (utcHours >= 20 || utcHours < 2) {
        isEvening = true;
      }

      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      const verseIndex = ((dayOfYear * 2) + (isEvening ? 1 : 0)) % DAILY_VERSES.length;
      const selected = DAILY_VERSES[verseIndex];
      customText = selected.text;
      customRef = selected.reference;
    }

    const titlePt = isEvening ? `Versículo da Noite - ${customRef}` : `Versículo do Dia - ${customRef}`;
    const titleEn = isEvening ? `Evening Verse - ${customRef}` : `Verse of the Day - ${customRef}`;

    const payload: any = {
      app_id: onesignalAppId,
      included_segments: ["Subscribed Users"],
      headings: {
        pt: titlePt,
        en: titleEn,
      },
      contents: {
        pt: customText,
        en: customText,
      },
      url: "https://online-biblia.vercel.app/",
      chrome_web_icon: "https://online-biblia.vercel.app/icons/logo2.png",
      chrome_web_badge: "https://online-biblia.vercel.app/apple-touch-icon.png",
      data: {
        type: isEvening ? "evening_verse" : "morning_verse",
        reference: customRef,
        url: "/"
      }
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
    };

    if (onesignalApiKey) {
      headers["Authorization"] = `Basic ${onesignalApiKey}`;
    }

    console.log(`[Push Notification] Disparando: ${titlePt}`);

    const onesignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const onesignalData = await onesignalRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        slot: isEvening ? "evening" : "morning",
        verse: { reference: customRef, text: customText },
        onesignal: onesignalData,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[Push Notification Error]:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro ao processar notificação push" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
