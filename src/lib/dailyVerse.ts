// Curated list of popular verses for "Verse of the Day"
export interface DailyVerseEntry {
  abbrev: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

const curatedVerses: DailyVerseEntry[] = [
  { abbrev: "jo", chapter: 3, verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { abbrev: "sl", chapter: 23, verse: 1, text: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { abbrev: "fp", chapter: 4, verse: 13, text: "Posso todas as coisas naquele que me fortalece.", reference: "Filipenses 4:13" },
  { abbrev: "jr", chapter: 29, verse: 11, text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", reference: "Jeremias 29:11" },
  { abbrev: "rm", chapter: 8, verse: 28, text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", reference: "Romanos 8:28" },
  { abbrev: "is", chapter: 41, verse: 10, text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", reference: "Isaías 41:10" },
  { abbrev: "pv", chapter: 3, verse: 5, text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5" },
  { abbrev: "mt", chapter: 11, verse: 28, text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { abbrev: "sl", chapter: 46, verse: 1, text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", reference: "Salmos 46:1" },
  { abbrev: "ef", chapter: 2, verse: 8, text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.", reference: "Efésios 2:8" },
  { abbrev: "sl", chapter: 119, verse: 105, text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105" },
  { abbrev: "is", chapter: 40, verse: 31, text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.", reference: "Isaías 40:31" },
  { abbrev: "rm", chapter: 12, verse: 2, text: "E não sede conformados com este mundo, mas sede transformados pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável, e perfeita vontade de Deus.", reference: "Romanos 12:2" },
  { abbrev: "tg", chapter: 1, verse: 5, text: "E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente, e o não lança em rosto, e ser-lhe-á dada.", reference: "Tiago 1:5" },
  { abbrev: "sl", chapter: 27, verse: 1, text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", reference: "Salmos 27:1" },
  { abbrev: "gl", chapter: 5, verse: 22, text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.", reference: "Gálatas 5:22" },
  { abbrev: "1co", chapter: 13, verse: 4, text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece.", reference: "1 Coríntios 13:4" },
  { abbrev: "hb", chapter: 11, verse: 1, text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não vêem.", reference: "Hebreus 11:1" },
  { abbrev: "sl", chapter: 37, verse: 4, text: "Deleita-te também no Senhor, e te concederá os desejos do teu coração.", reference: "Salmos 37:4" },
  { abbrev: "2tm", chapter: 1, verse: 7, text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", reference: "2 Timóteo 1:7" },
  { abbrev: "mt", chapter: 6, verse: 33, text: "Mas, buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { abbrev: "jo", chapter: 14, verse: 27, text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.", reference: "João 14:27" },
  { abbrev: "sl", chapter: 91, verse: 1, text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", reference: "Salmos 91:1" },
  { abbrev: "1pe", chapter: 5, verse: 7, text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7" },
  { abbrev: "pv", chapter: 18, verse: 10, text: "Torre forte é o nome do Senhor; a ela correrá o justo, e estará em alto refúgio.", reference: "Provérbios 18:10" },
  { abbrev: "rm", chapter: 15, verse: 13, text: "Ora o Deus de esperança vos encha de todo o gozo e paz em crença, para que abundeis em esperança pela virtude do Espírito Santo.", reference: "Romanos 15:13" },
  { abbrev: "jo", chapter: 16, verse: 33, text: "Tenho-vos dito isto, para que em mim tenhais paz; no mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", reference: "João 16:33" },
  { abbrev: "sl", chapter: 34, verse: 8, text: "Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele confia.", reference: "Salmos 34:8" },
  { abbrev: "is", chapter: 26, verse: 3, text: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.", reference: "Isaías 26:3" },
  { abbrev: "cl", chapter: 3, verse: 23, text: "E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens.", reference: "Colossenses 3:23" },
  { abbrev: "sl", chapter: 121, verse: 1, text: "Levantarei os meus olhos para os montes, de onde vem o meu socorro.", reference: "Salmos 121:1" },
];

export function getDailyVerse(): DailyVerseEntry {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return curatedVerses[dayOfYear % curatedVerses.length];
}
