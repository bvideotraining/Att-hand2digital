
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";
import { jsonrepair } from "jsonrepair";

// Lazy initialization
let aiInstance: any = null;
let currentApiKey: string | null = null;

function getAI(customApiKey?: string) {
  const apiKeyToUse = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!aiInstance || currentApiKey !== apiKeyToUse) {
    if (!apiKeyToUse) {
      throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment variables or provide it in CMS settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKeyToUse });
    currentApiKey = apiKeyToUse;
  }
  return aiInstance;
}

const SYSTEM_PROMPT = `
You are a specialized Arabic Handwriting Analyst for HR Attendance systems. 
The provided sheets are filled by MULTIPLE people, so styles vary significantly. 

AMBIGUITY RESOLUTION PROTOCOL (USING VISUAL REFERENCES):
1. **Visual Keying**: You will be provided with "Reference Samples" (images of digits labeled with their digital values).
   - Use these samples to understand the specific handwriting style of the writers.
   - If a digit on the sheet matches the visual style of a reference image, map it to that digital value.

2. **Date Alignment**: 
   - You will be provided with an optional Start Date and End Date for the sheet.
   - Use this range to correctly identify the days of the week and the specific dates for each column.
   - Attendance sheets usually follow a weekly or monthly pattern.

3. **Correction Learning**:
   - You will be provided with a "Correction History" which contains previous manual corrections made by the user.
   - If you see a handwritten name or time that matches an "original" value in the history, use the "corrected" value instead.
   - This history is your primary source for learning the specific handwriting and naming conventions of this workplace.

4. **Core Recognition Rules**:
   - "١" (1) vs "٧" (7): Check for visual match with reference samples.
   - "٣" (3) vs "٤" (4): Distinguish between "teeth" and "zigzags" based on samples.
   - "٢٥" (25) vs "٥٠" (50): Crucial for departure times.
   - "٥" (5) vs "٠" (0): Circle vs Dot.

5. **Time Normalization**:
   - Convert all inputs to "HH:MM" format.
   - Handle various separators (., : , space) or no separator.

6. **Shift Context**:
   - Check-in: 07:00 - 11:00.
   - Check-out: 14:00 - 18:00 (Convert to 24h).

7. **Table Logic (Strict RTL)**:
   - The sheet is read from Right-to-Left (RTL).
   - Start from the far right column (usually Saturday).
   - Each date has a PAIR of columns: Check-in (right) and Check-out (left).
   - The columns follow a strict chronological sequence from right to left.

8. **Grid Integrity (CRITICAL)**:
   - **No Shifting**: If an employee has no data for a specific date (empty cell), you MUST return null for that date. 
   - **Positional Mapping**: Do NOT shift the next day's data into an empty slot. Each column pair is locked to a specific date based on its position in the grid.
   - **Last Day Preservation**: Ensure the very last day in the range (e.g., 05/03) is extracted. Do not truncate the data.
   - If the Start Date is 18/02 and End Date is 05/03, there are exactly 16 days. You must account for all 16 slots in the grid.

9. **Completeness and End-Date Preservation**:
   - You MUST process every row in the image.
   - You MUST process every column from the Start Date (Right) to the End Date (Left).
   - Do NOT stop early. The final column on the far left MUST correspond to the End Date. Truncating the last day is a failure.
`;

const USER_PROMPT = `
Process this attendance sheet for the year {{YEAR}}.

CONTEXTUAL AIDS:
1. **Name Dictionary**: {{DICTIONARY}}
2. **Date Range**: Start: {{START_DATE}}, End: {{END_DATE}}
3. **Correction History (Learning)**: {{CORRECTIONS}}
4. **Visual Reference Samples**: I am providing multiple images labeled with their intended digit values. Use these as your primary visual guide for character recognition.

INSTRUCTIONS:
- Digitize all names and times.
- Format times strictly as HH:MM.
- If a cell is blank, return null.
- Use the Date Range to ensure the "date" field in the output for each record is accurate.
- **STRICT ALIGNMENT**: If an employee is absent on a specific date (e.g., 28/02), the record for that date MUST exist with null values. Do NOT skip the date or shift the next day's data into it.
- Ensure the full range from {{START_DATE}} to {{END_DATE}} is covered.
- **EXHAUSTIVE EXTRACTION (CRITICAL)**: You MUST extract data for EVERY SINGLE EMPLOYEE listed in the image. Count the rows before you begin. Do not stop early. If there are 10 employees, you must output 10 employee records.
- **TOKEN SAVING**: Omit the confidence scores ('ic' and 'oc') if you are highly confident in the value, to save output space. Only include them if confidence is below 90.
`;

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    employees: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          n: { type: Type.STRING, description: "Employee name" },
          nc: { type: Type.NUMBER, description: "Name confidence" },
          r: {
            type: Type.ARRAY,
            description: "Records",
            items: {
              type: Type.OBJECT,
              properties: {
                d: { type: Type.STRING, description: "Date DD/MM" },
                i: { type: Type.STRING, nullable: true, description: "Check in time" },
                ic: { type: Type.NUMBER, description: "Check in confidence", nullable: true },
                o: { type: Type.STRING, nullable: true, description: "Check out time" },
                oc: { type: Type.NUMBER, description: "Check out confidence", nullable: true }
              },
              required: ["d"]
            }
          }
        },
        required: ["n", "nc", "r"]
      }
    }
  },
  required: ["employees"]
};

export async function extractAttendanceData(
  imageBase64: string, 
  year: number,
  mimeType: string = 'image/jpeg',
  nameDictionary: string[] = [],
  visualRefs: any[] = [],
  startDate?: string,
  endDate?: string,
  correctionHistory: any[] = [],
  customApiKey?: string
): Promise<ExtractionResult> {
  try {
    const mainImageBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const dictionaryString = nameDictionary.length > 0 ? nameDictionary.join(', ') : 'None';
    const correctionsString = correctionHistory.length > 0 
      ? correctionHistory.map(c => `[${c.type}] "${c.original}" corrected to "${c.corrected}"`).join('; ') 
      : 'None';

    // Build parts: User Prompt + Main Image + Reference Images
    const prompt = USER_PROMPT
      .replace('{{DICTIONARY}}', dictionaryString)
      .replace('{{YEAR}}', year.toString())
      .replace('{{START_DATE}}', startDate || 'Not specified')
      .replace('{{END_DATE}}', endDate || 'Not specified')
      .replace('{{CORRECTIONS}}', correctionsString);

    const parts: any[] = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: mainImageBase64,
        },
      }
    ];

    // Add visual references to the prompt parts
    visualRefs.forEach(ref => {
      const refData = ref.imageBase64.includes(',') ? ref.imageBase64.split(',')[1] : ref.imageBase64;
      parts.push({ text: `REFERENCE SAMPLE FOR DIGIT "${ref.digit}":` });
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: refData
        }
      });
    });

    const response = await getAI(customApiKey).models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA as any,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text || '';
    let cleanText = text.trim();
    
    // Attempt to extract JSON from markdown or conversational text
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        // If standard parsing fails, try to repair it (handles truncation, missing quotes, etc.)
        const repaired = jsonrepair(cleanText);
        parsed = JSON.parse(repaired);
      }
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text length:", text.length);
      console.error("Text starts with:", text.substring(0, 100));
      console.error("Text ends with:", text.substring(text.length - 100));
      if (text.length > 10000) {
        throw new Error("The attendance sheet is too large and the extracted data exceeded the maximum limit. Please try cropping the image into smaller sections (e.g., half a page at a time).");
      }
      throw new Error(`The AI returned malformed data (length: ${text.length}). Please try again. Snippet: ${text.substring(0, 50)}...`);
    }
    
    if (!parsed.employees || parsed.employees.length === 0) {
      throw new Error("No data could be extracted.");
    }

    // Map short keys back to original format
    const mappedResult: ExtractionResult = {
      employees: parsed.employees.map((emp: any) => ({
        employee_name: {
          value: emp.n,
          confidence: emp.nc
        },
        records: emp.r.map((rec: any) => ({
          date: rec.d,
          check_in: {
            value: rec.i || null,
            confidence: rec.ic ?? 100
          },
          check_out: {
            value: rec.o || null,
            confidence: rec.oc ?? 100
          }
        }))
      }))
    };

    return mappedResult;
  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
