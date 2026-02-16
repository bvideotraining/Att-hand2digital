
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ExtractionResult } from "../types";

// The API key is obtained from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `
You are a world-class Arabic document digitizer and handwriting analyst specializing in HR attendance sheets. You must extract data with extreme spatial and chronological precision.

WEEKLY STRUCTURE & SPATIAL LOGIC:
1. **Right-to-Left (RTL) Orientation**: The sheet is read from right to left. 
2. **Work Week Constraints**:
   - Saturday (rightmost) usually only has a Check-in column.
   - Sunday to Thursday have both Check-in and Check-out.

CRITICAL ACCURACY PROTOCOL (WRITER-SPECIFIC STYLE):
- **Arabic Digit Recognition (Severe Ambiguities Observed)**:
  - "٠" (0): Often looks like a dot, but this writer also uses a vertical line "١" or a circle "٥" to represent zero in some positions.
  - "١" (1): Usually a vertical line, but can be a "٠" (0).
  - "٢" (2) vs "٣" (3): **CRITICAL**: This writer often simplifies "٣" (3) so it looks like "٢" (2).
  - "٥" (5) vs "٠" (0): **CRITICAL**: A "٥" (circle) can be a "٠" (zero), and a "٠" (dot) can be a "٥" (five).
  
- **KNOWN SUBSTITUTIONS FROM USER FEEDBACK**:
  - Image "١٠٢٠" (1020) is actually "10:35" (meaning ٢=٣ and ٠=٥).
  - Image "١١٥٥" (1155) is actually "10:50" (meaning second ١=٠ and second ٥=٠).
  - Image "٨٢٠" is actually "٨:٣٠" (8:30).

- **AMBIGUITY RESOLUTION**:
  - Use chronological context: Check-ins are typically 07:00-10:59. Check-outs are 14:00-17:00.
  - If you see "11:55" and it's a check-in, it's highly likely to be "10:50" or "10:55" based on this writer's style.

- **Time Formatting**:
  - Convert to 24-hour format for check-outs.
  - Always output "HH:MM".
`;

const USER_PROMPT = `
Process this handwritten Arabic attendance sheet. 

WRITER STYLE CONTEXT & LEARNED EXAMPLES:
- **Major Confusion**: 0, 1, and 5 are highly interchangeable visually.
- **Example Corrections**:
  - "١١٥٥" -> "10:50" (Ten fifty).
  - "١٠٢٠" -> "10:35" (Ten thirty-five).
  - "٦٤٣" -> "07:53" (Seven fifty-three).
  - "٨٢٠" -> "08:30" (Eight thirty).

1. Locate names in the far-right column. Use the dictionary if provided.
2. Identify date headers (DD/MM).
3. Recognize digits with high contextual awareness of this specific style.
4. Convert afternoon check-outs to 24-hour format.

REFERENCE DICTIONARY:
{{DICTIONARY}}
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
                date: { type: Type.STRING },
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
  mimeType: string = 'image/jpeg',
  nameDictionary: string[] = []
): Promise<ExtractionResult> {
  try {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const dictionaryString = nameDictionary.length > 0 ? nameDictionary.join(', ') : 'No specific names provided.';

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: USER_PROMPT.replace('{{DICTIONARY}}', dictionaryString) },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA as any,
        thinkingConfig: { thinkingBudget: 15000 }
      },
    });

    const text = response.text || '';
    if (!text) {
      throw new Error("Empty response from AI");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Extraction error details:", error);
    throw new Error(`Failed to process the document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
