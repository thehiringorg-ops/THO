
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ScreeningResult, EmploymentItem, EducationItem } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export interface GeneratedJobContent {
  description: string;
  responsibilities: string[];
  requirements: string[];
  desirableSkills: string[];
  benefits: string[];
}

export const generateJobDescription = async (
  title: string,
  department: string,
  industry: string,
  location: string,
  skills: string,
  level: string
): Promise<GeneratedJobContent> => {
  const ai = getAiClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "A compelling overview of the role and company culture (2-3 paragraphs)." },
      responsibilities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5-8 key responsibilities." },
      requirements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of essential qualifications and skills." },
      desirableSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of nice-to-have skills or experience." },
      benefits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of benefits, perks, and reasons to join." },
    },
    required: ["description", "responsibilities", "requirements", "desirableSkills", "benefits"]
  };

  const prompt = `
    Act as a professional HR recruiter. Create a job specification for:
    - Role: ${title}
    - Department: ${department}
    - Industry: ${industry}
    - Location: ${location}
    - Skills: ${skills}
    - Level: ${level}
    
    Ensure the tone is professional, inclusive, and engaging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    let text = response.text;
    if (!text) throw new Error("No response from AI");
    text = text.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(text) as GeneratedJobContent;
  } catch (error) {
    console.error("Job Gen Error:", error);
    throw error;
  }
};

export interface ExtractedCandidateData {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  noticePeriod?: string;
  skills: string[];
  languages?: string[];
  experienceYears: number;
  summary?: string;
  employmentHistory?: EmploymentItem[];
  education?: EducationItem[];
}

export const extractCandidateInfo = async (
  base64Data: string,
  mimeType: string
): Promise<ExtractedCandidateData> => {
  // Validation to prevent API 400 errors for unsupported types
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
      throw new Error("Word documents are not currently supported for auto-extraction. Please upload a PDF.");
  }

  const ai = getAiClient();

  const extractionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Candidate's full name." },
      email: { type: Type.STRING, description: "Email address." },
      phone: { type: Type.STRING, description: "Phone number." },
      linkedin: { type: Type.STRING, description: "LinkedIn profile URL." },
      location: { type: Type.STRING, description: "City and Country/Region of residence." },
      noticePeriod: { type: Type.STRING, description: "Notice period or availability (e.g., '30 days', 'Immediate')." },
      
      skills: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of top 10 technical and professional skills." 
      },
      languages: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of languages spoken."
      },
      experienceYears: { 
        type: Type.NUMBER, 
        description: "Total years of relevant professional experience." 
      },
      summary: { 
        type: Type.STRING, 
        description: "A concise professional summary (3-4 sentences)." 
      },
      
      employmentHistory: {
        type: Type.ARRAY,
        description: "List of previous employment positions.",
        items: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            role: { type: Type.STRING },
            startDate: { type: Type.STRING, description: "Month Year (e.g. Jan 2020)" },
            endDate: { type: Type.STRING, description: "Month Year or 'Present'" },
            description: { type: Type.STRING, description: "Brief summary of duties." }
          }
        }
      },
      
      education: {
        type: Type.ARRAY,
        description: "List of educational qualifications.",
        items: {
          type: Type.OBJECT,
          properties: {
            institution: { type: Type.STRING },
            qualification: { type: Type.STRING },
            year: { type: Type.STRING, description: "Graduation year" }
          }
        }
      }
    },
    required: ["skills", "experienceYears", "name", "email", "summary", "employmentHistory", "education"]
  };

  const prompt = `
    Analyze the uploaded CV. Extract detailed structured data. 
    Look specifically for:
    1. Employment History (Company, Role, Dates, Description).
    2. Education (Institution, Degree, Year).
    3. Notice Period or Availability (if not explicitly stated, return null).
    4. Contact details including Location.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    text = text.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(text) as ExtractedCandidateData;
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};

export const screenCandidate = async (
  cvText: string,
  jobDescription: string
): Promise<ScreeningResult> => {
  const ai = getAiClient();

  const screeningSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      matchScore: { 
        type: Type.NUMBER, 
        description: "A score from 0 to 100 indicating how well the candidate matches the job." 
      },
      summary: { 
        type: Type.STRING, 
        description: "A brief summary (2-3 sentences) of the candidate's fit." 
      },
      strengths: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 3-5 key strengths relevant to the job."
      },
      weaknesses: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 1-3 potential gaps or areas for improvement."
      },
      matchingSkills: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of specific hard and soft skills present in the CV that directly match requirements in the Job Description."
      }
    },
    required: ["matchScore", "summary", "strengths", "weaknesses", "matchingSkills"],
  };

  const prompt = `
    You are an expert AI Recruiter. Evaluate the following candidate based on the provided job description.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    CANDIDATE PROFILE / CV DATA:
    ${cvText}
    
    Analyze the fit critically. Be objective. 
    Identify specific skills that appear in both the job description and the CV for the 'matchingSkills' field.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: screeningSchema,
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    text = text.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(text) as ScreeningResult;
  } catch (error) {
    console.error("Screening Error:", error);
    throw error;
  }
};
