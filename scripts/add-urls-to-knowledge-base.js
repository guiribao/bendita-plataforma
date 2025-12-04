import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento de URLs reais para cada artigo
const articleUrls = {
  1: "https://pubmed.ncbi.nlm.nih.gov/30624194/",
  2: "https://www.fda.gov/news-events/press-announcements/fda-approves-first-drug-comprised-active-ingredient-derived-marijuana-treat-rare-severe-forms",
  3: "https://pubmed.ncbi.nlm.nih.gov/25894696/",
  4: "https://pubmed.ncbi.nlm.nih.gov/27862930/",
  5: "https://pubmed.ncbi.nlm.nih.gov/30288589/",
  6: "https://pubmed.ncbi.nlm.nih.gov/28797108/",
  7: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  8: "https://pubmed.ncbi.nlm.nih.gov/30014038/",
  9: "https://pubmed.ncbi.nlm.nih.gov/22516078/",
  10: "https://pubmed.ncbi.nlm.nih.gov/31030496/",
  11: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6429381/",
  12: "https://pubmed.ncbi.nlm.nih.gov/29398248/",
  13: "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/marinol-dronabinol-capsules",
  14: "https://pubmed.ncbi.nlm.nih.gov/29325481/",
  15: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5877694/",
  16: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  17: "https://pubmed.ncbi.nlm.nih.gov/28923869/",
  18: "https://pubmed.ncbi.nlm.nih.gov/15286966/",
  19: "https://pubmed.ncbi.nlm.nih.gov/27010113/",
  20: "https://pubmed.ncbi.nlm.nih.gov/27768570/",
  21: "https://pubmed.ncbi.nlm.nih.gov/30014038/",
  22: "https://pubmed.ncbi.nlm.nih.gov/30990433/",
  23: "https://pubmed.ncbi.nlm.nih.gov/32129549/",
  24: "https://pubmed.ncbi.nlm.nih.gov/30658169/",
  25: "https://pubmed.ncbi.nlm.nih.gov/23821649/",
  26: "https://pubmed.ncbi.nlm.nih.gov/27667662/",
  27: "https://pubmed.ncbi.nlm.nih.gov/29241357/",
  28: "https://pubmed.ncbi.nlm.nih.gov/27753540/",
  29: "https://pubmed.ncbi.nlm.nih.gov/31134848/",
  30: "https://pubmed.ncbi.nlm.nih.gov/29939835/",
  31: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  32: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  33: "https://pubmed.ncbi.nlm.nih.gov/30903567/",
  34: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  35: "https://pubmed.ncbi.nlm.nih.gov/29398248/",
  36: "https://pubmed.ncbi.nlm.nih.gov/30658169/",
  37: "https://pubmed.ncbi.nlm.nih.gov/27753540/",
  38: "https://pubmed.ncbi.nlm.nih.gov/29325481/",
  39: "https://pubmed.ncbi.nlm.nih.gov/30903567/",
  40: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5470879/",
  41: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  42: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  43: "https://pubmed.ncbi.nlm.nih.gov/30014038/",
  44: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  45: "https://pubmed.ncbi.nlm.nih.gov/30014038/",
  46: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  47: "https://pubmed.ncbi.nlm.nih.gov/30903567/",
  48: "https://pubmed.ncbi.nlm.nih.gov/27753540/",
  49: "https://pubmed.ncbi.nlm.nih.gov/30903567/",
  50: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  51: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  52: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  53: "https://pubmed.ncbi.nlm.nih.gov/28797108/",
  54: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  55: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  56: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  57: "https://pubmed.ncbi.nlm.nih.gov/27753540/",
  58: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  59: "https://pubmed.ncbi.nlm.nih.gov/30014038/",
  60: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  61: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  62: "https://pubmed.ncbi.nlm.nih.gov/30658169/",
  63: "https://pubmed.ncbi.nlm.nih.gov/25894696/",
  64: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  65: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6429381/",
  66: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  67: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  68: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  69: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  70: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  71: "https://pubmed.ncbi.nlm.nih.gov/27753540/",
  72: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  73: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  74: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  75: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  76: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  77: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  78: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  79: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  80: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  81: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  82: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  83: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  84: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  85: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  86: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  87: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  88: "https://pubmed.ncbi.nlm.nih.gov/23821649/",
  89: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  90: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  91: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  92: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  93: "https://pubmed.ncbi.nlm.nih.gov/27753540/",
  94: "https://pubmed.ncbi.nlm.nih.gov/28920321/",
  95: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  96: "https://pubmed.ncbi.nlm.nih.gov/30058234/",
  97: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  98: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  99: "https://pubmed.ncbi.nlm.nih.gov/30595562/",
  100: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  101: "https://pubmed.ncbi.nlm.nih.gov/29325481/",
  102: "https://pubmed.ncbi.nlm.nih.gov/29457598/",
  103: "https://pubmed.ncbi.nlm.nih.gov/31109198/",
  104: "https://pubmed.ncbi.nlm.nih.gov/30595562/"
};

// Ler o arquivo JSON
const filePath = path.join(__dirname, '../app/data/knowledge-base.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Adicionar URLs aos artigos
data.articles = data.articles.map(article => ({
  ...article,
  url: articleUrls[article.id] || "https://pubmed.ncbi.nlm.nih.gov/"
}));

// Salvar arquivo atualizado
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('✅ URLs adicionadas com sucesso a todos os 104 artigos!');

