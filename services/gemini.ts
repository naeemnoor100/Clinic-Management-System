import { GoogleGenAI } from "@google/genai";
import { Patient, Visit, Medication } from "../types";

export const getPatientHistorySummary = async (patient: Patient, visits: Visit[], medications: Medication[]) => {
  // Added comment: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  // Always use a named parameter and direct process.env.API_KEY reference
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const visitContext = visits.map(v => {
    const meds = v.prescribedMeds.map(pm => {
      const med = medications.find(m => m.id === pm.medicationId);
      // Fix: Medication type uses 'brandName' instead of 'name'
      return `${med?.brandName} (${pm.dosage})`;
    }).join(", ");
    return `Date: ${v.date}, Symptoms: ${v.symptoms}, Diagnosis: ${v.diagnosis}, Meds: ${meds}`;
  }).join("\n");

  const prompt = `
    Summarize the clinical history of the following patient in English. 
    Focus on recurring issues and progress. 
    Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}.
    Visits:
    ${visitContext}
    
    Please provide the summary in a professional medical tone.
  `;

  try {
    // Correctly call generateContent with model name and prompt
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // response.text is a getter, do not call as a method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate patient history summary.";
  }
};