
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ExtractionResult, VisualReference } from "../types";

// The API key is obtained from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
`;

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    employees: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          employee_name: {
            type: Type.OBJECT,
            properties: {
              value: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            },
            required: ["value", "confidence"]
          },
          records: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "Date in DD/MM format" },
                check_in: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.STRING, nullable: true },
                    confidence: { type: Type.NUMBER },
                    note: {
                      type: Type.OBJECT,
                      properties: {
                        value: { type: Type.STRING, nullable: true },
                        confidence: { type: Type.NUMBER }
                      },
                      required: ["confidence"]
                    }
                  },
                  required: ["confidence"]
                },
                check_out: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.STRING, nullable: true },
                    confidence: { type: Type.NUMBER },
                    note: {
                      type: Type.OBJECT,
                      properties: {
                        value: { type: Type.STRING, nullable: true },
                        confidence: { type: Type.NUMBER }
                      },
                      required: ["confidence"]
                    }
                  },
                  required: ["confidence"]
                }
              },
              required: ["date", "check_in", "check_out"]
            }
          }
        },
        required: ["employee_name", "records"]
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
  correctionHistory: any[] = []
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA as any,
        thinkingConfig: { thinkingBudget: 24576 }
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    
    if (!parsed.employees || parsed.employees.length === 0) {
      throw new Error("No data could be extracted.");
    }

    return parsed;
  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
