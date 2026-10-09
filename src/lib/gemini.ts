import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuoteLineItem, QuoteReferenceData, UploadedQuoteDoc, MaterialCostItem } from '@/types';

export interface AIQuoteResponse {
  lineItems: QuoteLineItem[];
  totalAmount: number;
  aiExplanation: string;
}

export async function generateQuoteWithGemini(
  problemDescription: string,
  tradeType: string,
  referenceCatalog: QuoteReferenceData[],
  uploadedDocsText?: string
): Promise<AIQuoteResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const docsPromptContext = uploadedDocsText && uploadedDocsText.trim().length > 0
        ? `\nUPLOADED ADMIN PRICING DOCUMENTS & RATE CARDS (PDF/EXCEL):\n${uploadedDocsText.substring(0, 4000)}\n`
        : '';

      const prompt = `
You are an expert ${tradeType} estimator for TradeFlow vertical CRM in India.
Analyze the following customer problem description and calculate an itemized service quotation based on the provided reference catalog pricing AND uploaded admin pricing documents (PDF/Excel) in Indian Rupees (₹ / INR).

CUSTOMER PROBLEM:
"${problemDescription}"

REFERENCE PRICING & SERVICE CATALOG (in ₹ / INR):
${JSON.stringify(referenceCatalog, null, 2)}
${docsPromptContext}

INSTRUCTIONS:
1. Break down the quotation into specific line items. Each line item must be assigned a type: "labor", "material", or "fee".
2. Match the problem requirements to catalog items or uploaded PDF/Excel rate cards where applicable, estimating quantities and labor hours.
3. Calculate subtotal for each item (quantity * unit_price) in ₹ and total quotation amount.
4. Output STRICT JSON ONLY in the following exact format:
{
  "line_items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit_price": 500,
      "total": 500,
      "type": "labor"
    }
  ],
  "total_amount": 500,
  "ai_explanation": "Brief explanation of how the quote was derived from catalog and uploaded PDF/Excel price sheets"
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      if (parsed && Array.isArray(parsed.line_items)) {
        const lineItems: QuoteLineItem[] = parsed.line_items.map((item: any, idx: number) => ({
          id: `li-ai-${Date.now()}-${idx}`,
          description: String(item.description || 'Service Line Item'),
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
          type: (['labor', 'material', 'fee'].includes(item.type) ? item.type : 'labor') as any,
        }));

        const calculatedTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

        return {
          lineItems,
          totalAmount: parsed.total_amount || calculatedTotal,
          aiExplanation: parsed.ai_explanation || 'Generated using Google Gemini AI analysis.',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed or fallback triggered:', err);
    }
  }

  // Intelligent Rules Engine Fallback (when API key is absent or fails)
  return generateFallbackQuote(problemDescription, tradeType, referenceCatalog);
}

function generateFallbackQuote(
  problem: string,
  trade: string,
  catalog: QuoteReferenceData[]
): AIQuoteResponse {
  const lineItems: QuoteLineItem[] = [];
  const lowerProb = problem.toLowerCase();

  // Find matching catalog item or use default
  let matchedCatalog = catalog.find((c) =>
    c.service_name.toLowerCase().split(' ').some((word) => word.length > 3 && lowerProb.includes(word))
  );

  if (!matchedCatalog && catalog.length > 0) {
    matchedCatalog = catalog[0];
  }

  if (matchedCatalog) {
    // Labor
    const laborRate = matchedCatalog.base_labor_rate || 500;
    const isMajor = lowerProb.includes('replacement') || lowerProb.includes('upgrade') || lowerProb.includes('install');
    const laborHours = isMajor ? 3 : 1.5;

    lineItems.push({
      id: `li-rule-1-${Date.now()}`,
      description: `${matchedCatalog.service_name} Labor (${laborHours} hrs)`,
      quantity: laborHours,
      unit_price: laborRate,
      total: laborHours * laborRate,
      type: 'labor',
    });

    // Materials
    if (matchedCatalog.material_costs && matchedCatalog.material_costs.length > 0) {
      matchedCatalog.material_costs.forEach((m, idx) => {
        const qty = isMajor ? 2 : 1;
        lineItems.push({
          id: `li-rule-m${idx}-${Date.now()}`,
          description: m.name,
          quantity: qty,
          unit_price: m.unit_cost,
          total: qty * m.unit_cost,
          type: 'material',
        });
      });
    }
  } else {
    // Default fallback line item
    lineItems.push({
      id: `li-def-1-${Date.now()}`,
      description: `${trade} Diagnostic & Initial Service`,
      quantity: 1,
      unit_price: 500,
      total: 500,
      type: 'labor',
    });
  }

  // Standard service fee line item
  lineItems.push({
    id: `li-fee-${Date.now()}`,
    description: 'Standard Service Call & Equipment Fee',
    quantity: 1,
    unit_price: 250,
    total: 250,
    type: 'fee',
  });

  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  return {
    lineItems,
    totalAmount,
    aiExplanation: `Analyzed customer problem against ${trade} service catalog standards. Itemized labor and materials automatically.`,
  };
}

export async function extractCatalogFromDocumentWithGemini(
  documentText: string,
  tradeType: string
): Promise<QuoteReferenceData[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
You are an expert ${tradeType} catalog parser for TradeFlow vertical CRM in India.
Analyze the following uploaded spreadsheet/document content (Excel/CSV/PDF rate sheet) and extract ALL service rate templates with labor rates and material costs in Indian Rupees (₹ / INR).

DOCUMENT CONTENT:
"${documentText.substring(0, 10000)}"

OUTPUT INSTRUCTIONS:
Return a JSON array of service rate objects. Extract EVERY row or item in the document.
Format:
[
  {
    "service_name": "Service Name",
    "base_labor_rate": 500,
    "material_costs": [
      { "name": "Material Name", "unit_cost": 250, "unit": "item" }
    ],
    "notes_for_ai": "Estimation guidelines"
  }
]
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      let itemsArray: any[] = [];
      if (Array.isArray(parsed)) {
        itemsArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        itemsArray = parsed.items || parsed.catalog || parsed.services || parsed.data || parsed.rate_cards || [];
      }

      if (itemsArray.length > 0) {
        return itemsArray.map((item: any, idx: number) => ({
          id: `ref-doc-${Date.now()}-${idx}`,
          profile_id: 'usr-default-01',
          service_name: String(item.service_name || item.name || item.title || `Service Item ${idx + 1}`),
          base_labor_rate: Number(item.base_labor_rate || item.labor_rate || item.rate || item.labor) || 500,
          material_costs: Array.isArray(item.material_costs)
            ? item.material_costs.map((m: any, mIdx: number) => {
                const mName = String(m.name || m.material || 'Material');
                const rawCost = Number(m.unit_cost || m.cost || m.price) || 0;
                const safeCost = rawCost > 100000 ? 250 : rawCost;
                return {
                  id: `m-doc-${Date.now()}-${mIdx}`,
                  name: mName,
                  unit_cost: safeCost,
                  unit: String(m.unit || 'item'),
                };
              })
            : typeof item.material_name === 'string'
            ? parseMaterialString(item.material_name)
            : [],
          notes_for_ai: String(item.notes_for_ai || item.notes || item.description || 'Extracted from uploaded rate sheet document.'),
        }));
      }
    } catch (err) {
      console.warn('extractCatalogFromDocumentWithGemini failed, falling back to local parser:', err);
    }
  }

  // Fallback CSV / Text Line parsing when Gemini API is unavailable or returns empty
  return parseCSVToCatalogItems(documentText);
}

export function parseMaterialString(matString: string): MaterialCostItem[] {
  if (!matString || !matString.trim()) return [];

  const parts = matString.split(/;|\n/).map((p) => p.trim()).filter((p) => p.length > 0);
  const items: MaterialCostItem[] = [];

  parts.forEach((part, idx) => {
    let cost = 0;
    let name = part;

    const priceMatch = part.match(/(?:[—–\-:\(]\s*(?:₹|Rs\.?)?\s*([0-9.]+)|(?:₹|Rs\.?)\s*([0-9.]+))/i);
    if (priceMatch) {
      cost = Number(priceMatch[1] || priceMatch[2]) || 0;
      name = part.replace(priceMatch[0], '').replace(/[\(\)\—–\-:]/g, '').trim();
    } else {
      const numMatch = part.match(/([0-9.]+)\s*$/);
      if (numMatch) {
        cost = Number(numMatch[1]) || 0;
        name = part.replace(numMatch[0], '').replace(/[\(\)\—–\-:]/g, '').trim();
      }
    }

    if (!name) name = part.trim();
    if (cost > 100000) cost = 250; // Guard against astronomical numbers

    items.push({
      id: `m-parsed-${Date.now()}-${idx}`,
      name: name,
      unit_cost: cost,
      unit: 'item',
    });
  });

  return items;
}

export function parseCSVToCatalogItems(csvText: string): QuoteReferenceData[] {
  if (!csvText || csvText.trim().length === 0) return [];

  const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (rawLines.length === 0) return [];

  const firstLine = rawLines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';

  const splitLine = (line: string) => {
    return line.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
  };

  const header = splitLine(rawLines[0]).map((h) => h.toLowerCase());

  let serviceIdx = header.findIndex((h) =>
    ['service', 'task', 'item', 'name', 'title', 'service_name', 'service name'].some((k) => h.includes(k))
  );
  let rateIdx = header.findIndex((h) =>
    ['labor', 'rate', 'price', 'cost', 'hourly', 'base_labor_rate', 'base labor rate'].some((k) => h.includes(k))
  );
  let matNameIdx = header.findIndex(
    (h) => ['material', 'material_name', 'material name', 'materials'].some((k) => h.includes(k)) && !h.includes('cost') && !h.includes('price')
  );
  if (matNameIdx === -1) {
    matNameIdx = header.findIndex((h) => h.includes('material'));
  }
  let matCostIdx = header.findIndex((h) =>
    ['mat_cost', 'material_cost', 'material cost', 'material price', 'material_price'].some((k) => h.includes(k))
  );
  let notesIdx = header.findIndex((h) =>
    ['note', 'notes', 'guideline', 'guidelines', 'desc', 'description', 'notes_for_ai'].some((k) => h.includes(k))
  );

  const hasHeader = serviceIdx !== -1 || rateIdx !== -1;
  const startRow = hasHeader ? 1 : 0;
  if (!hasHeader) {
    serviceIdx = 0;
    rateIdx = 1;
    matNameIdx = 2;
    matCostIdx = 3;
    notesIdx = 4;
  }

  const items: QuoteReferenceData[] = [];

  for (let i = startRow; i < rawLines.length; i++) {
    const cols = splitLine(rawLines[i]);
    if (cols.length === 0) continue;

    const sName = cols[serviceIdx] || (cols[0] !== undefined ? cols[0] : '');
    if (!sName || sName.toLowerCase().startsWith('service') || sName.toLowerCase().startsWith('task')) continue;

    const rateVal = cols[rateIdx] !== undefined ? cols[rateIdx] : '';
    const parsedRate = Number(rateVal.replace(/[^0-9.]/g, '')) || 500;

    const mName = matNameIdx !== -1 && cols[matNameIdx] ? cols[matNameIdx] : '';
    const mCostVal = matCostIdx !== -1 && cols[matCostIdx] ? cols[matCostIdx] : '';

    let materialCosts: MaterialCostItem[] = [];
    if (mName) {
      if (mName.includes(';') || mName.includes('—') || mName.includes('₹')) {
        materialCosts = parseMaterialString(mName);
      } else {
        const parsedMCost = Number(mCostVal.replace(/[^0-9.]/g, '')) || 0;
        const safeCost = parsedMCost > 100000 ? 250 : parsedMCost;
        materialCosts = [
          {
            id: `m-csv-${Date.now()}-${i}`,
            name: mName,
            unit_cost: safeCost,
            unit: 'item',
          },
        ];
      }
    }

    const notesVal = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : 'Extracted from uploaded rate sheet.';

    items.push({
      id: `ref-csv-${Date.now()}-${i}`,
      profile_id: 'usr-default-01',
      service_name: sName,
      base_labor_rate: parsedRate,
      material_costs: materialCosts,
      notes_for_ai: notesVal || 'Extracted from uploaded rate sheet.',
    });
  }

  return items;
}

