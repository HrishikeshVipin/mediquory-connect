- 1. # Error Type
Console AxiosError

## Error Message
Request failed with status code 403


    at async Object.getPatientHistory (lib/api.ts:266:22)
    at async fetchConsultationHistory (app/doctor/patients/[patientId]/consult/page.tsx:272:24)

## Code Frame
  264 |   // Get patient consultation history
  265 |   getPatientHistory: async (patientId: string) => {
> 266 |     const { data } = await api.get<ApiResponse<{ consultations: any[] }>>(`/prescriptions/patient/${patientId}/history`);
      |                      ^
  267 |     return data;
  268 |   },
  269 | };

Next.js version: 16.0.10 (Turbopack)

2. set all pages default stage at top. 
3. http://localhost:3002/p/8bf370b3-a938-4eff-b519-bcb7e8b7d787  localhost refused to connect
4. to manage subscription plans for admin, instead of prisma page, can we manage it from admin panel? so it will be easy in production stage. 
5. we planned the patient limit from patient registration link has no limit. but to consult with them, doctor need the balance towards patient. how could we manage that? i need your oppinion. if doctor has only 25 patient limit remains, but if he or she post the link in social media, the patient will register for enquiry.