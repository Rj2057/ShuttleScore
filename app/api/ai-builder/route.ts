import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // High accuracy reasoning model
        messages: [
          {
            role: "system",
            content: `You are an AI Tournament Architect. The user will provide complex tournament rules or a list of teams (possibly from a parsed PDF).
            Your job is to design the complete tournament structure based on those rules.
            
            Return ONLY a JSON object in this exact format, with no markdown wrappers or conversational text:
            {
              "tournament": {
                "teams": [ { "id": "t1", "name": "Team A" } ],
                "stages": [
                  {
                    "id": "stage_1",
                    "name": "Preliminary Round",
                    "type": "knockout",
                    "matches": [
                      { "id": "m1", "team1_id": "t1", "team2_id": "t2", "winner_goes_to": "group_1", "loser_goes_to": "stage_2_m1" }
                    ]
                  }
                ],
                "groups": [
                  { "id": "group_1", "name": "Group 1", "capacity": 4 }
                ]
              }
            }
            
            Follow the user's rules strictly (e.g., uneven group capacities, losers rounds feeding into groups). Ensure all IDs link correctly.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Groq API Error details:", data);
      return NextResponse.json({ error: `AI Generation failed: ${data.error?.message || 'Unknown error'}` }, { status: 500 });
    }

    let parsedContent;
    let cleanJson = "";
    try {
      const contentStr = data.choices[0].message.content.trim();
      // Remove possible markdown formatting if the model disobeys
      cleanJson = contentStr.replace(/```json/g, "").replace(/```/g, "");
      
      // Some models prefix with "Here is the JSON:" or similar, let's strip anything before the first { and after the last }
      const firstBracket = cleanJson.indexOf('{');
      const lastBracket = cleanJson.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
      }
      
      parsedContent = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", parseError);
      console.error("Raw content was:", cleanJson || data.choices?.[0]?.message?.content);
      return NextResponse.json({ error: "Failed to parse AI output into JSON. Please try rewording your prompt." }, { status: 500 });
    }

    return NextResponse.json({ tournament: parsedContent.tournament || parsedContent });
  } catch (error) {
    console.error("AI Builder Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
