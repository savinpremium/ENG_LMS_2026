
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  getLearningTip: async (grade: number) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a short, encouraging 2-sentence English learning tip specifically for a grade ${grade} student.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Keep practicing every day to master English!";
    }
  },

  getAdminInsights: async (students: any[]) => {
    try {
      const gradeCounts = students.reduce((acc, s) => {
        acc[s.grade] = (acc[s.grade] || 0) + 1;
        return acc;
      }, {});

      const prompt = `Analyze this student distribution: ${JSON.stringify(gradeCounts)}. 
      Provide a one-paragraph professional summary of the current enrollment status and one strategic recommendation for growth for 'Smart English' academy.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      return "Unable to generate insights at this time.";
    }
  }
};