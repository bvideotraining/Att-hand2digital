
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
   - For example, if a provided sample shows a '١' (1) that looks like a '٧' (7), use that knowledge to correctly decode the attendance times.

2. **Core Recognition Rules**:
   - "١" (1) vs "٧" (7): Check for visual match with reference samples.
   - "٣" (3) vs "٤" (4): Distinguish between "teeth" and "zigzags" based on samples.
   - "٢٥" (25) vs "٥٠" (50): Crucial for departure times.
   - "٥" (5) vs "٠" (0): Circle vs Dot.

3. **Time Normalization**:
   - Convert all inputs to "HH:MM" format.
   - Handle various separators (., : , space) or no separator.

4. **Shift Context**:
   - Check-in: 07:00 - 11:00.
   - Check-out: 14:00 - 18:00 (Convert to 24h).

5. **Table Logic (Strict RTL)**:
   - Start from Saturday on the far right.
   - Pair columns for Sun-Thu.
`;

const USER_PROMPT = `
Process this attendance sheet for the year {{YEAR}}.

CONTEXTUAL AIDS:
1. **Name Dictionary**: {{DICTIONARY}}
2. **Visual Reference Samples**: I am providing multiple images labeled with their intended digit values. Use these as your primary visual guide for character recognition.

INSTRUCTIONS:
- Digitize all names and times.
- Format times strictly as HH:MM.
- If a cell is blank, return null.
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
  visualRefs: VisualReference[] = []
): Promise<ExtractionResult> {
  try {
    const mainImageBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const dictionaryString = nameDictionary.length > 0 ? nameDictionary.join(', ') : 'None';

    // Build parts: User Prompt + Main Image + Reference Images
    const parts: any[] = [
      { text: USER_PROMPT.replace('{{DICTIONARY}}', dictionaryString).replace('{{YEAR}}', year.toString()) },
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
