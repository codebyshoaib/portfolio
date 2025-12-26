export async function POST(req: Request) {
  try {
    const { messages, profileData } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not set" }),
        { status: 500 }
      );
    }

    // Build system message with profile context
    const buildSystemMessage = () => {
      const { profile, experience, projects, skills, education } =
        profileData || {};

      if (!profile) {
        return "You are a helpful AI assistant.";
      }

      let systemPrompt = `You are ${profile.firstName || ""} ${
        profile.lastName || ""
      }. `;

      if (profile.headline) {
        systemPrompt += `Your professional headline is: ${profile.headline}. `;
      }

      if (profile.shortBio) {
        systemPrompt += `About you: ${profile.shortBio} `;
      }

      if (profile.yearsOfExperience) {
        systemPrompt += `You have ${profile.yearsOfExperience} years of professional experience. `;
      }

      if (profile.location) {
        systemPrompt += `You are located in ${profile.location}. `;
      }

      // Add experience
      if (experience && experience.length > 0) {
        systemPrompt += `\n\nYour Professional Experience:\n`;
        experience.forEach((exp: any, idx: number) => {
          systemPrompt += `${idx + 1}. ${exp.jobTitle} at ${exp.company}`;
          if (exp.location) systemPrompt += ` (${exp.location})`;
          if (exp.startDate) {
            systemPrompt += ` from ${exp.startDate}`;
            if (exp.endDate) systemPrompt += ` to ${exp.endDate}`;
            if (exp.current) systemPrompt += ` (Current)`;
          }
          if (exp.description) systemPrompt += `\n   ${exp.description}`;
          if (exp.achievements && exp.achievements.length > 0) {
            systemPrompt += `\n   Key Achievements: ${exp.achievements.join(
              ", "
            )}`;
          }
          if (exp.technologies && exp.technologies.length > 0) {
            const techNames = exp.technologies
              .map((t: any) => t.name)
              .filter(Boolean);
            if (techNames.length > 0) {
              systemPrompt += `\n   Technologies: ${techNames.join(", ")}`;
            }
          }
          systemPrompt += `\n`;
        });
      }

      // Add projects
      if (projects && projects.length > 0) {
        systemPrompt += `\n\nYour Projects:\n`;
        projects.forEach((proj: any, idx: number) => {
          systemPrompt += `${idx + 1}. ${proj.title}`;
          if (proj.tagline) systemPrompt += ` - ${proj.tagline}`;
          if (proj.category) systemPrompt += ` (${proj.category})`;
          if (proj.liveUrl) systemPrompt += `\n   Live: ${proj.liveUrl}`;
          if (proj.githubUrl) systemPrompt += `\n   GitHub: ${proj.githubUrl}`;
          if (proj.technologies && proj.technologies.length > 0) {
            const techNames = proj.technologies
              .map((t: any) => t.name)
              .filter(Boolean);
            if (techNames.length > 0) {
              systemPrompt += `\n   Technologies: ${techNames.join(", ")}`;
            }
          }
          systemPrompt += `\n`;
        });
      }

      // Add skills
      if (skills && skills.length > 0) {
        systemPrompt += `\n\nYour Skills:\n`;
        const skillsByCategory: Record<string, any[]> = {};
        skills.forEach((skill: any) => {
          const category = skill.category || "Other";
          if (!skillsByCategory[category]) skillsByCategory[category] = [];
          skillsByCategory[category].push(skill);
        });

        Object.entries(skillsByCategory).forEach(
          ([category, categorySkills]) => {
            systemPrompt += `${category}: `;
            const skillNames = categorySkills
              .map((s: any) => {
                let name = s.name;
                if (s.level) name += ` (${s.level})`;
                if (s.yearsOfExperience)
                  name += ` - ${s.yearsOfExperience} years`;
                return name;
              })
              .join(", ");
            systemPrompt += `${skillNames}\n`;
          }
        );
      }

      // Add education
      if (education && education.length > 0) {
        systemPrompt += `\n\nYour Education:\n`;
        education.forEach((edu: any, idx: number) => {
          systemPrompt += `${idx + 1}. ${edu.degree}`;
          if (edu.field) systemPrompt += ` in ${edu.field}`;
          systemPrompt += ` from ${edu.institution}`;
          if (edu.location) systemPrompt += ` (${edu.location})`;
          if (edu.startDate && edu.endDate) {
            systemPrompt += `, ${edu.startDate} - ${edu.endDate}`;
          }
          if (edu.gpa) systemPrompt += `, GPA: ${edu.gpa}`;
          if (edu.description) systemPrompt += `\n   ${edu.description}`;
          systemPrompt += `\n`;
        });
      }

      systemPrompt += `\n\nIMPORTANT: Answer all questions as if you ARE this person. Use "I" and "my" when referring to your experience, projects, and skills. Be conversational and authentic. If asked about something not in your profile, politely say you don't have that information rather than making things up.`;

      return systemPrompt;
    };

    const systemMessage = buildSystemMessage();

    // Prepend system message to the messages array
    const messagesWithSystem = [
      {
        role: "system",
        content: systemMessage,
      },
      ...messages,
    ];

    // Use Groq's native API directly
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Can change to "llama-3.1-70b-versatile" for better quality
          messages: messagesWithSystem,
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Groq API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500 }
    );
  }
}
