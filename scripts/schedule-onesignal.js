/**
 * Script de Agendamento em Lote para OneSignal (Biblia Online)
 * 
 * Este script agenda os 100 versículos diários na API do OneSignal.
 * Regra: 2 notificações por dia (uma às 08:00 e outra às 20:00),
 * começando a partir de amanhã.
 * 
 * Como rodar:
 * 1. Defina as variáveis de ambiente:
 *    export ONESIGNAL_APP_ID="seu-app-id"
 *    export ONESIGNAL_REST_API_KEY="sua-chave-api-rest"
 * 
 * 2. Execute o script:
 *    node scripts/schedule-onesignal.js
 */

const https = require('https');

// Chaves de Configuração (Puxa do ambiente ou placeholders)
const APP_ID = process.env.ONESIGNAL_APP_ID || "COLOQUE_SEU_APP_ID_AQUI";
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "COLOQUE_SUA_CHAVE_REST_API_AQUI";

// Lista Completa dos 100 Versículos extraídos do PDF
const verses = [
  { text: "O SENHOR é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", ref: "João 3:16" },
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Se Deus é por nós, quem será contra nós?", ref: "Romanos 8:31" },
  { text: "Lancem sobre ele todas as suas ansiedades, porque ele cuida de vocês.", ref: "1 Pedro 5:7" },
  { text: "Busquem em primeiro lugar o Reino de Deus e a sua justiça, e todas estas coisas lhes serão acrescentadas.", ref: "Mateus 6:33" },
  { text: "Não fui eu que lhe ordenei? Seja forte e corajoso! Não tenha medo, nem desanime, pois o SENHOR, seu Deus, estará com você por onde quer que você andar.", ref: "Josué 1:9" },
  { text: "Confie no SENHOR de todo o seu coração, e não se apoie em seu próprio entendimento.", ref: "Provérbios 3:5" },
  { text: "Mil poderão cair ao seu lado, e dez mil à sua direita, mas você não será atingido.", ref: "Salmos 91:7" },
  { text: "E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", ref: "Romanos 8:28" },
  { text: "Não fiquem ansiosos por coisa alguma; antes, as suas petições sejam conhecidas diante de Deus em toda oração e súplica, com ação de graças.", ref: "Filipenses 4:6" },
  { text: "E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.", ref: "Filipenses 4:7" },
  { text: "O SENHOR é a minha luz e a minha salvação; de quem terei medo? O SENHOR é a fortaleza da minha vida; de quem terei temor?", ref: "Salmos 27:1" },
  { text: "A vossa palavra seja sempre agradável, temperada com sal, para que saibais como deveis responder a cada um.", ref: "Colossenses 4:6" },
  { text: "Porque sou eu que conheço os planos que tenho para vocês, diz o SENHOR, planos de paz e não de mal, para lhes dar um futuro e uma esperança.", ref: "Jeremias 29:11" },
  { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", ref: "1 Coríntios 13:4" },
  { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" },
  { text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim.", ref: "João 14:6" },
  { text: "Fiz o meu clamor ao SENHOR, e ele me respondeu; livrou-me de todos os meus temores.", ref: "Salmos 34:4" },
  { text: "Mas os que esperam no SENHOR renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.", ref: "Isaías 40:31" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", ref: "Mateus 11:28" },
  { text: "O SENHOR está perto dos que têm o coração quebrantado, e salva os de espírito abatido.", ref: "Salmos 34:18" },
  { text: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.", ref: "Romanos 12:12" },
  { text: "Instrua a criança no caminho em que deve andar, e, mesmo quando envelhecer, não se desviará dele.", ref: "Provérbios 22:6" },
  { text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.", ref: "João 14:27" },
  { text: "A resposta branda desvia o furor, mas a palavra dura suscita a ira.", ref: "Provérbios 15:1" },
  { text: "Eis que Deus é a minha salvação; confiarei e não temerei, porque o SENHOR Deus é a minha força e o meu cântico.", ref: "Isaías 12:2" },
  { text: "Portanto, agora, nenhuma condenação há para os que estão em Cristo Jesus.", ref: "Romanos 8:1" },
  { text: "Deleite-se no SENHOR, e ele lhe concederá os desejos do seu coração.", ref: "Salmos 37:4" },
  { text: "O coração do homem traça o seu caminho, mas o SENHOR estabelece os seus passos.", ref: "Provérbios 16:9" },
  { text: "A graça do Senhor Jesus Cristo, o amor de Deus e a comunhão do Espírito Santo sejam com todos vocês.", ref: "2 Coríntios 13:14" },
  { text: "Porque para Deus nada será impossível.", ref: "Lucas 1:37" },
  { text: "Em tudo deem graças, porque esta é a vontade de Deus em Cristo Jesus para com vocês.", ref: "1 Tessalonicenses 5:18" },
  { text: "Ensina-nos a contar os nossos dias, para que alcancemos um coração sábio.", ref: "Salmos 90:12" },
  { text: "O que guarda a sua boca e a sua língua guarda a sua alma de angústias.", ref: "Provérbios 21:23" },
  { text: "Pois vocês foram salvos pela graça, por meio da fé; e isto não vem de vocês, é dom de Deus.", ref: "Efésios 2:8" },
  { text: "Honra a teu pai e a tua mãe, para que se prolonguem os teus dias na terra que o SENHOR, teu Deus, te dá.", ref: "Êxodo 20:12" },
  { text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", ref: "Salmos 91:1" },
  { text: "Guardei a tua palavra no meu coração, para não pecar contra ti.", ref: "Salmos 119:11" },
  { text: "Eu sou a videira, vós as videiras; quem permanece em mim, e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer.", ref: "João 15:5" },
  { text: "Mas, sede cumpridores da palavra, e não apenas ouvintes, enganando-vos a vós mesmos.", ref: "Tiago 1:22" },
  { text: "Bem-aventurados os limpos de coração, porque eles verão a Deus.", ref: "Mateus 5:8" },
  { text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.", ref: "Salmos 23:4" },
  { text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados, e nos purificar de toda injustiça.", ref: "1 João 1:9" },
  { text: "Não se deixem vencer pelo mal, mas vençam o mal com o bem.", ref: "Romanos 12:21" },
  { text: "O SENHOR pelejará por vós, e vós vos calareis.", ref: "Êxodo 14:14" },
  { text: "Toda a Escritura é divinamente inspirada e proveitosa para ensinar, para redarguir, para corrigir, para instruir em justiça.", ref: "2 Timóteo 3:16" },
  { text: "De que serve ao homem ganhar o mundo inteiro e perder a sua alma?", ref: "Marcos 8:36" },
  { text: "Em paz me deitarei e dormirei, porque só tu, SENHOR, me fazes habitar em segurança.", ref: "Salmos 4:8" },
  { text: "A verdade os libertará.", ref: "João 8:32" },
  { text: "No amor não há medo, antes o perfeito amor lança fora o medo.", ref: "1 João 4:18" },
  { text: "Como são belos sobre os montes os pés do que anuncia as boas-novas, que proclama a paz.", ref: "Isaías 52:7" },
  { text: "Elevo os meus olhos para os montes; de onde me virá o socorro? O meu socorro vem do SENHOR, que fez o céu e a terra.", ref: "Salmos 121:1-2" },
  { text: "O fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio.", ref: "Gálatas 5:22-23" },
  { text: "Melhor é um dia nos teus átrios do que mil em outro lugar.", ref: "Salmos 84:10" },
  { text: "Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta se abrirá para vocês.", ref: "Mateus 7:7" },
  { text: "Mas a nossa pátria está nos céus, de onde também aguardamos o Salvador, o Senhor Jesus Cristo.", ref: "Filipenses 3:20" },
  { text: "Criou Deus o homem à sua imagem; à imagem de Deus o criou; homem e mulher os criou.", ref: "Gênesis 1:27" },
  { text: "Não se cansem de fazer o bem, pois no tempo certo colheremos, se não desanimarmos.", ref: "Gálatas 6:9" },
  { text: "Combati o bom combate, acabei a carreira, guardei a fé.", ref: "2 Timóteo 4:7" },
  { text: "Porque a palavra de Deus é viva e eficaz, e mais cortante do que qualquer espada de dois gumes.", ref: "Hebreus 4:12" },
  { text: "Amados, amemo-nos uns aos outros, porque o amor é de Deus; e qualquer que ama é nascido de Deus e conhece a Deus.", ref: "1 João 4:7" },
  { text: "Deem graças ao SENHOR, porque ele é bom; porque a sua misericórdia dura para sempre.", ref: "Salmos 136:1" },
  { text: "Portanto, amem os seus inimigos e orem pelos que perseguem vocês.", ref: "Mateus 5:44" },
  { text: "Sejam fortes e corajosos; não tenham medo nem fiquem apavorados diante deles, pois o SENHOR, seu Deus, vai com vocês; ele nunca os deixará, nunca os abandonará.", ref: "Deuteronômio 31:6" },
  { text: "Provai e vede que o SENHOR é bom; bem-aventurado o homem que nele confia.", ref: "Salmos 34:8" },
  { text: "Consagre ao SENHOR tudo o que você faz, e os seus planos serão bem-sucedidos.", ref: "Provérbios 16:3" },
  { text: "Porventura não se vendem dois passarinhos por uma moedinha? Contudo, nenhum deles cairá no chão sem o consentimento do vosso Pai.", ref: "Mateus 10:29" },
  { text: "Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente.", ref: "Romanos 12:2" },
  { text: "A bênção do SENHOR traz riqueza, e ele não acrescenta dores a ela.", ref: "Provérbios 10:22" },
  { text: "O SENHOR é a minha força e o meu escudo; nele o meu coração confiou, e fui socorrido.", ref: "Salmos 28:7" },
  { text: "Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que não se veem.", ref: "Hebreus 11:1" },
  { text: "Fomos sepultados com ele na morte pelo batismo, para que, como Cristo ressuscitou dos mortos pela glória do Pai, assim andemos nós também em novidade de vida.", ref: "Romanos 6:4" },
  { text: "Portanto, confessem os seus pecados uns aos outros e orem pelos que perseguem vocês para serem curados. A oração fervorosa de um justo tem grande poder.", ref: "Tiago 5:16" },
  { text: "Sede vós, pois, perfeitos, como é perfeito o vosso Pai que está nos céus.", ref: "Mateus 5:48" },
  { text: "O SENHOR guardará a tua saída e a tua entrada, desde agora e para sempre.", ref: "Salmos 121:8" },
  { text: "Toda boa dádiva e todo dom perfeito vêm do alto, descendo do Pai das luzes, em quem não há mudança nem sombra de variação.", ref: "Tiago 1:17" },
  { text: "O que encobre as suas transgressões nunca prosperará, mas o que as confessa e deixa, alcançará misericórdia.", ref: "Provérbios 28:13" },
  { text: "Mas aquele que perseverar até o fim, esse será salvo.", ref: "Mateus 24:13" },
  { text: "Quem poupa a vara odeia seu filho, mas quem o ama castiga-o logo.", ref: "Provérbios 13:24" },
  { text: "A soberba precede a destruição, e a altivez do espírito precede a queda.", ref: "Provérbios 16:18" },
  { text: "Eu te invoquei, ó Deus, pois tu me ouvirás; inclina para mim os teus ouvidos, e escuta as minhas palavras.", ref: "Salmos 17:6" },
  { text: "Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna em Cristo Jesus, nosso Senhor.", ref: "Romanos 6:23" },
  { text: "Justificados, pois, mediante a fé, temos paz com Deus por meio de nosso Senhor Jesus Cristo.", ref: "Romanos 5:1" },
  { text: "Sejam bondosos e compassivos uns para com os outros, perdoando-se mutuamente, assim como Deus os perdoou em Cristo.", ref: "Efésios 4:32" },
  { text: "O meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus.", ref: "Filipenses 4:19" },
  { text: "Preciosa é aos olhos do SENHOR a morte dos seus santos.", ref: "Salmos 116:15" },
  { text: "E, acima de tudo, tenham amor intenso uns para com os outros, porque o amor cobre uma multidão de pecados.", ref: "1 Pedro 4:8" },
  { text: "A vossa moderação seja conhecida de todos os homens. Perto está o Senhor.", ref: "Filipenses 4:5" },
  { text: "A esperança que se vê não é esperança; afinal, por que alguém ainda espera o que já vê? Mas, se esperamos o que não vemos, com paciência esperamos.", ref: "Romanos 8:24-25" },
  { text: "Fui moço, e agora sou velho; contudo nunca vi desamparado o justo, nem a sua descendência a mendigar o pão.", ref: "Salmos 37:25" },
  { text: "Portanto, deem a cada um o que lhe é devido: a quem imposto, imposto; a quem tributo, tributo; a quem temor, temor; a quem honra, honra.", ref: "Romanos 13:7" },
  { text: "Ensina-me a fazer a tua vontade, pois tu és o meu Deus; guie-me o teu bom Espírito por terra plana.", ref: "Salmos 143:10" },
  { text: "Porque todos pecaram e destituídos estão da glória de Deus.", ref: "Romanos 3:23" },
  { text: "Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores.", ref: "Romanos 5:8" },
  { text: "Para trás de mim, Satanás! Porque está escrito: Adorarás ao Senhor teu Deus, e só a ele servirás.", ref: "Lucas 4:8" },
  { text: "Porque as armas da nossa milícia não são carnais, mas sim poderosas em Deus para destruição de fortalezas.", ref: "2 Coríntios 10:4" },
  { text: "Sonda-me, ó Deus, e conhece o meu coração; prova-me, e conhece os meus pensamentos.", ref: "Salmos 139:23" },
  { text: "No mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", ref: "João 16:33" },
  { text: "A graça do Senhor Jesus seja com todos. Amém.", ref: "Apocalipse 22:21" }
];

// Helper para padronizar números com dois dígitos (ex: 9 -> "09")
const pad = (num) => String(num).padStart(2, '0');

// Função para enviar uma notificação individual via HTTPS para a API do OneSignal
function sendNotification(verse, scheduleDateStr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      app_id: APP_ID,
      contents: {
        en: `${verse.text}\n— ${verse.ref}`,
        pt: `${verse.text}\n— ${verse.ref}`
      },
      headings: {
        en: `Biblia Online 📖`,
        pt: `Biblia Online 📖`
      },
      included_segments: ["Subscribed Users"],
      send_after: scheduleDateStr // Formato: "YYYY-MM-DD HH:MM:ss GMT-0300"
    });

    const options = {
      hostname: 'onesignal.com',
      path: '/api/v1/notifications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${REST_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Erro HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

// Função principal de agendamento em lote
async function scheduleAll() {
  if (APP_ID === "COLOQUE_SEU_APP_ID_AQUI" || REST_API_KEY === "COLOQUE_SUA_CHAVE_REST_API_AQUI") {
    console.error("❌ ERRO: Por favor, configure as variáveis de ambiente antes de executar:");
    console.error("   export ONESIGNAL_APP_ID=\"seu-app-id\"");
    console.error("   export ONESIGNAL_REST_API_KEY=\"sua-chave-api-rest\"");
    process.exit(1);
  }

  console.log(`🚀 Iniciando agendamento em lote de ${verses.length} versículos no OneSignal...`);

  // Começa amanhã
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    
    // Determina se o versículo atual vai de manhã (índice par) ou à noite (índice ímpar)
    const isEvening = i % 2 !== 0;
    const hourStr = isEvening ? "20:00:00" : "08:00:00";

    // Formata a data: YYYY-MM-DD HH:MM:SS GMT-0300 (Brasília)
    const year = targetDate.getFullYear();
    const month = pad(targetDate.getMonth() + 1);
    const day = pad(targetDate.getDate());
    
    const scheduleDateStr = `${year}-${month}-${day} ${hourStr} GMT-0300`;

    try {
      console.log(`[${i + 1}/${verses.length}] Agendando para ${scheduleDateStr}...`);
      await sendNotification(verse, scheduleDateStr);
      successCount++;
    } catch (err) {
      console.error(`❌ Falha ao agendar versículo ${i + 1}:`, err.message);
      failureCount++;
    }

    // Se mudou de noite para o próximo dia, incrementa a data alvo
    if (isEvening) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // Delay de 100ms para evitar rate limiting da API do OneSignal
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n🎉 Processo de agendamento em lote concluído!`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
}

scheduleAll();
