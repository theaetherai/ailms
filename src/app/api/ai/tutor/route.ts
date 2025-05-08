import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { client } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // replace with actual Grok base URL
});

export async function POST(req: Request) {
  try {
    console.log("[AI_TUTOR_REQUEST] New request received");
    
    const user = await currentUser();
    
    if (!user) {
      console.log("[AI_TUTOR_AUTH_ERROR] No authenticated user found");
      return new Response("Unauthorized", { status: 401 });
    }
    
    console.log(`[AI_TUTOR_AUTH] User authenticated: ${user.id}`);
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[AI_TUTOR_REQUEST_PARSE_ERROR]", parseError);
      return new Response("Invalid JSON in request body", { status: 400 });
    }
    
    const { prompt, context, instructions, rubric } = requestBody;
    
    if (!prompt) {
      console.log("[AI_TUTOR_VALIDATION_ERROR] Missing prompt");
      return new Response("Prompt is required", { status: 400 });
    }
    
    console.log(`[AI_TUTOR_REQUEST_INFO] Context: ${context}, Prompt length: ${prompt.length}`);
    
    let systemPrompt = "You are an AI tutor for an online learning platform called Opal.";
    
    // Add context-specific instructions
    switch (context) {
      case "generate_quiz":
        systemPrompt += `
        You are generating a quiz based on video content. The transcript of the video is provided.
        
        Your task is to:
        1. Analyze the transcript and identify key concepts and information
        2. Create quiz questions that test understanding of the material
        3. Format your response as a valid JSON array that can be parsed
        
        For each question:
        - Create either multiple choice (4 options) or true/false questions
        - Ensure there is only one correct answer per question
        - Assign a unique ID to each question and option
        - Focus on meaningful content
        
        NOTE: Some transcripts may be very short. In these cases:
        - Create simple questions based on the limited available content
        - If not enough content is available for meaningful questions, 
          create basic true/false questions about the general topic
        - Create as many questions as the content allows for (even if fewer than 5)
        
        FORMAT REQUIREMENTS (EXTREMELY IMPORTANT):
        Return ONLY valid JSON array matching this exact structure:
        [
          {
            "id": "q1",
            "text": "Question text?",
            "type": "multipleChoice",
            "points": 1,
            "options": [
              {"id": "q1-a", "text": "Option A", "isCorrect": false},
              {"id": "q1-b", "text": "Option B", "isCorrect": true},
              {"id": "q1-c", "text": "Option C", "isCorrect": false},
              {"id": "q1-d", "text": "Option D", "isCorrect": false}
            ]
          }
        ]
        
        CRITICAL JSON FORMATTING RULES:
        - Your response must start with '[' and end with ']'
        - ONLY output the JSON array, nothing else
        - NO explanation text before or after
        - NO Markdown formatting like \`\`\`json or \`\`\`
        - Use double quotes ONLY for ALL strings and property names
        - All JSON objects must be properly closed with matching braces
        - No trailing commas after the last item in arrays or objects
        - Ensure all property names have double quotes: "id", "text", etc.
        - Make sure every opening brace, bracket, or quote has a matching closing one
        
        For true/false questions, only include two options with text "True" and "False".
        
        BLUEPRINT EXAMPLE (FOLLOW THIS FORMAT EXACTLY):
        [
          {
            "id": "q1",
            "text": "What is the main topic of the video?",
            "type": "multipleChoice",
            "points": 1,
            "options": [
              {"id": "q1-a", "text": "Climate change", "isCorrect": false},
              {"id": "q1-b", "text": "Self-reflection", "isCorrect": true},
              {"id": "q1-c", "text": "Economic policy", "isCorrect": false},
              {"id": "q1-d", "text": "Medical research", "isCorrect": false}
            ]
          },
          {
            "id": "q2",
            "text": "Does the speaker mention feeling confident?",
            "type": "trueFalse",
            "points": 1,
            "options": [
              {"id": "q2-a", "text": "True", "isCorrect": true},
              {"id": "q2-b", "text": "False", "isCorrect": false}
            ]
          },
          {
            "id": "q3",
            "text": "What phrase does the speaker use to describe their effort?",
            "type": "multipleChoice",
            "points": 1,
            "options": [
              {"id": "q3-a", "text": "I gave up", "isCorrect": false},
              {"id": "q3-b", "text": "I tried my best", "isCorrect": true},
              {"id": "q3-c", "text": "I made a mistake", "isCorrect": false},
              {"id": "q3-d", "text": "I succeeded easily", "isCorrect": false}
            ]
          },
          {
            "id": "q4",
            "text": "What is the overall sentiment of the video?",
            "type": "multipleChoice",
            "points": 1,
            "options": [
              {"id": "q4-a", "text": "Negative", "isCorrect": false},
              {"id": "q4-b", "text": "Neutral", "isCorrect": false},
              {"id": "q4-c", "text": "Positive", "isCorrect": true},
              {"id": "q4-d", "text": "Sarcastic", "isCorrect": false}
            ]
          },
          {
            "id": "q5",
            "text": "Does the speaker express regret in the video?",
            "type": "trueFalse",
            "points": 1,
            "options": [
              {"id": "q5-a", "text": "True", "isCorrect": false},
              {"id": "q5-b", "text": "False", "isCorrect": true}
            ]
          }
        ]
        
        YOU MUST FOLLOW THIS EXACT BLUEPRINT FORMAT WITH THE SAME STRUCTURE, PROPERTY NAMES, AND ORGANIZATION. YOUR ENTIRE RESPONSE MUST BE PARSEABLE BY JSON.parse() WITH NO MODIFICATIONS.
        `;
        break;
        
      case "assignment_draft":
        systemPrompt += `
        You are helping a student with drafting an assignment response. The assignment instructions are:
        
        ${instructions || "No specific instructions provided"}
        
        Your task is to help the student by creating a draft based on their prompt. 
        DO NOT write a complete solution, but provide a helpful starting point with key ideas,
        structure, and some content they can build upon. Include placeholders where 
        they should add their own analysis or examples.
        
        Make your response focused, helpful, and educational. Format your response 
        in clear sections with headings where appropriate.
        `;
        break;
        
      case "assignment_feedback":
        systemPrompt += `
        You are providing feedback on a student's work in progress for an assignment. 
        The assignment instructions are:
        
        ${instructions}
        
        ${rubric?.length ? `The assignment will be graded according to this rubric:
        ${JSON.stringify(rubric, null, 2)}` : ''}
        
        Your task is to provide constructive feedback to help the student improve their work.
        Focus on:
        1. Strengths - what they've done well
        2. Areas for improvement - specific points they should revise
        3. Suggestions - concrete ways to enhance their work
        
        Be supportive, specific, and actionable in your feedback. Don't rewrite their work,
        but guide them toward improving it themselves.
        `;
        break;
        
      case "assignment_assessment":
        systemPrompt += `
        You are conducting a pre-submission assessment of a student's assignment.
        The assignment instructions are:
        
        ${instructions}
        
        ${rubric?.length ? `The assignment will be graded according to this rubric:
        ${JSON.stringify(rubric, null, 2)}` : ''}
        
        Evaluate the submission against each rubric criterion and provide a detailed assessment.
        For each criterion:
        1. Indicate the current performance level
        2. Highlight strengths and weaknesses
        3. Provide specific recommendations for improvement
        
        Also provide an overall assessment and estimated score based on the current state.
        Format your response with clear headings and structure.
        `;
        break;
        
      case "quiz_help":
        systemPrompt += `
        You are helping a student understand a concept related to a quiz. 
        Your task is to explain the concept in a way that helps them understand, 
        but do NOT provide direct answers to quiz questions.
        
        Instead, focus on explaining the underlying concepts, providing examples,
        and guiding their thinking process. Be educational and helpful while 
        maintaining academic integrity.
        `;
        break;
        
      case "generate_summary":
        systemPrompt += `
        You are an educational content summarizer. Create a structured summary with key concepts, definitions, and important points that would help a student understand this material.
          
        Format your response in a clear, organized structure:
        1. Start with a brief overview of the content IN FIRST PERSON (use "I", "me", "my")
        2. Use sections with clear headings like "**Key Concepts I've Identified:**", "**Important Definitions:**", "**Main Points I Want to Highlight:**", etc.
        3. Use bullet points (with * symbol) for each item within a section
        4. Provide a concise conclusion in first person, as if you're directly speaking to the student

        DO NOT ask for more information or state that no transcript was provided. Work with the transcript provided, even if it seems incomplete.
        
        Keep your summary concise - no more than 2-3 short paragraphs for the overview and 2-4 bullet points per section.
        
        IMPORTANT: Write in first person throughout, as if you (the AI tutor) are personally explaining the content to the student.
        For example: "In this video, I'll summarize the key points about..." or "I've identified these important concepts..."
        `;
        break;
        
      default:
        systemPrompt += `
        You're helping the student learn and understand course materials. Provide
        clear, concise, and educational responses to their questions. Use examples
        when helpful, and explain concepts in a way that promotes learning.
        `;
    }
    
    // Generate AI response
    console.log(`[AI_TUTOR_OPENAI_REQUEST] Sending request to OpenAI, model: qwen-qwq-32b`);
    let chatCompletion;
    try {
      chatCompletion = await openai.chat.completions.create({
        model: "qwen-qwq-32b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });
      console.log(`[AI_TUTOR_OPENAI_RESPONSE] Response received`);
    } catch (openaiError: any) {
      console.error("[AI_TUTOR_OPENAI_ERROR]", {
        error: openaiError.message,
        type: openaiError.type,
        code: openaiError.code,
        param: openaiError.param,
        status: openaiError.status
      });
      
      return NextResponse.json({ 
        error: `OpenAI API error: ${openaiError.message}`,
        code: openaiError.code || 'unknown_error',
      }, { status: 502 }); // Bad Gateway - upstream service failed
    }
    
    const aiResponse = chatCompletion.choices[0].message.content || '';
    
    // Enhanced cleaning to remove any thinking tags and markdown formatting
    let cleanedResponse = aiResponse
      // Remove thinking sections with various possible tag formats
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .replace(/```(json|typescript|javascript)?[\s\S]*?```/g, '$2')
      .replace(/\bthink\b:.*?\n/g, '')
      .replace(/\bThinking\b:.*?\n/g, '')
      .trim();
    
    // Handle quiz generation specifically
    if (context === 'generate_quiz' && cleanedResponse) {
      try {
        console.log(`[AI_TUTOR_QUIZ_PROCESSING] Attempting to parse response as JSON`);
        console.log(`[AI_TUTOR_QUIZ_RESPONSE_PREVIEW] First 100 chars: ${cleanedResponse.substring(0, 200)}`);
        
        // Extract JSON array from the response more aggressively
        let jsonContent = cleanedResponse;
        
        // Try to extract just the JSON array part using regex
        const jsonMatch = jsonContent.match(/(\[[\s\S]*\])/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log('[AI_TUTOR_CLEANUP] Found JSON array structure');
        } else if (!jsonContent.trim().startsWith('[')) {
          console.log('[AI_TUTOR_CLEANUP] Response does not start with [, looking for JSON array');
          // Find content between [ and ]
          const startBracket = jsonContent.indexOf('[');
          const endBracket = jsonContent.lastIndexOf(']');
          
          if (startBracket !== -1 && endBracket !== -1 && startBracket < endBracket) {
            jsonContent = jsonContent.substring(startBracket, endBracket + 1);
            console.log('[AI_TUTOR_CLEANUP] Extracted JSON array by bracket positions');
          }
        }
        
        console.log(`[AI_TUTOR_CLEANED_RESPONSE] Cleaned response: ${jsonContent.substring(0, 100)}`);
        
        // Try to parse the response as JSON
        try {
          // Make sure JSON is properly terminated
          if (!jsonContent.trim().endsWith(']')) {
            console.log('[AI_TUTOR_REPAIR] Adding closing bracket to JSON');
            jsonContent = jsonContent.trim() + ']';
          }
          
          // Simple non-destructive preprocessing for obvious issues before more aggressive approaches
          jsonContent = jsonContent
            // Remove any non-json text before the opening bracket
            .replace(/^[^[]*(\[)/m, '$1')
            // Remove any non-json text after the closing bracket
            .replace(/(\])[^\]]*$/m, '$1')
            // Remove any internal non-JSON sections
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
          
          // Try direct parsing first
          let quizData;
          try {
            quizData = JSON.parse(jsonContent);
            console.log('[AI_TUTOR_PARSE] Successfully parsed JSON directly');
          } catch (initialParseError) {
            console.error("[AI_TUTOR_JSON_PARSE_ERROR]", initialParseError);
            
            // Aggressive JSON cleanup
            jsonContent = jsonContent
              // Handle escaped backslashes consistently
              .replace(/\\\\/g, '\\')
              // Fix double-escaped quotes
              .replace(/\\"/g, '"')
              // Re-escape all actual quotes
              .replace(/"/g, '\\"')
              // Fix what we just did for opening and closing brackets
              .replace(/^\\\[/m, '[')
              .replace(/\\\]$/m, ']')
              // Fix escaped quotes in property names and values
              .replace(/\\"\\\\/g, '\\"\\')
              // Fix property names without quotes
              .replace(/(\b)(\w+)(\s*:)/g, '$1"$2"$3')
              // Remove trailing commas in objects and arrays
              .replace(/,(\s*[}\]])/g, '$1')
              // Replace single quotes with double quotes
              .replace(/'/g, '"');
              
            try {
              quizData = JSON.parse(jsonContent);
              console.log('[AI_TUTOR_PARSE] Successfully parsed with mild cleaning');
            } catch (secondParseError) {
              // Even more aggressive JSON fixing
              try {
                // Try to reconstruct a minimal valid JSON from the response
                const responseLines = cleanedResponse.split('\n');
                const jsonLines = [];
                let inJsonBlock = false;
                
                // Collect all lines that look like JSON
                for (const line of responseLines) {
                  const trimmedLine = line.trim();
                  if (trimmedLine.startsWith('[') || trimmedLine.includes('{')) {
                    inJsonBlock = true;
                  }
                  
                  if (inJsonBlock) {
                    jsonLines.push(trimmedLine);
                  }
                  
                  if (trimmedLine.endsWith(']')) {
                    break;
                  }
                }
                
                // Join the JSON lines back together
                const reconstructedJson = jsonLines.join(' ');
                
                // Apply all our fixes
                let fixedJson = reconstructedJson
                  // Basic structural fixes
                  .replace(/^[^[]*(\[)/m, '$1')
                  .replace(/(\])[^\]]*$/m, '$1')
                  // Replace any unmatched quotes
                  .replace(/(['"])((?:\\.|[^\\])*?)(['"])?/g, (match, p1, p2, p3) => p3 ? match : `${p1}${p2}${p1}`)
                  // Fix property names without quotes
                  .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
                  // Remove trailing commas
                  .replace(/,(\s*[}\]])/g, '$1')
                  // Fix doubles
                  .replace(/""/g, '"')
                  // Ensure array structure is preserved
                  .replace(/\]\[/g, '],[')
                  // Fix missing commas between objects in array
                  .replace(/}(\s*){/g, '},\n{');
                
                // Check for balanced brackets
                let openCount = 0;
                let closeCount = 0;
                for (const char of fixedJson) {
                  if (char === '[') openCount++;
                  if (char === ']') closeCount++;
                }
                
                // Make sure we have proper array closing
                if (openCount > closeCount) {
                  fixedJson += ']'.repeat(openCount - closeCount);
                }
                
                quizData = JSON.parse(fixedJson);
                console.log('[AI_TUTOR_PARSE] Successfully parsed with deep reconstruction');
              } catch (reconstructError) {
                // Final fallback: extract a valid JSON structure from the raw response
                try {
                  console.log('[AI_TUTOR_PARSE] Attempting deep pattern matching');
                  
                  // Extract question pattern directly from text
                  const questions = [];
                  const questionMatches = cleanedResponse.matchAll(/["']?id["']?\s*:\s*["']?q(\d+)["']?[\s\S]*?["']?isCorrect["']?\s*:\s*(true|false)/g);
                  
                  let currentMatch;
                  while ((currentMatch = questionMatches.next()) && !currentMatch.done) {
                    const match = currentMatch.value;
                    if (match && match[0]) {
                      // Find the complete question object (content between { and })
                      const startPos = cleanedResponse.lastIndexOf('{', cleanedResponse.indexOf(match[0]));
                      if (startPos !== -1) {
                        let endPos = startPos;
                        let braceCount = 1;
                        for (let i = startPos + 1; i < cleanedResponse.length; i++) {
                          if (cleanedResponse[i] === '{') braceCount++;
                          if (cleanedResponse[i] === '}') braceCount--;
                          if (braceCount === 0) {
                            endPos = i;
                            break;
                          }
                        }
                        
                        if (endPos > startPos) {
                          const questionText = cleanedResponse.substring(startPos, endPos + 1);
                          try {
                            // Normalize and fix this question object
                            const fixedQuestion = questionText
                              .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                              .replace(/'/g, '"');
                            const questionObj = JSON.parse(fixedQuestion);
                            questions.push(questionObj);
                          } catch (qError) {
                            console.log('[AI_TUTOR_PARSE] Failed to parse individual question');
                          }
                        }
                      }
                    }
                  }
                  
                  if (questions.length > 0) {
                    quizData = questions;
                    console.log(`[AI_TUTOR_PARSE] Successfully extracted ${questions.length} questions through pattern matching`);
                  } else {
                    throw new Error("Could not extract valid questions");
                  }
                } catch (patternError) {
                  console.error("All JSON parsing approaches failed:", patternError);
                  throw new Error("All JSON parsing approaches failed");
                }
              }
            }
          }
          
          // Validate quiz data structure
          if (!Array.isArray(quizData)) {
            console.error("[AI_TUTOR_QUIZ_VALIDATION_ERROR] Response is not an array");
            return NextResponse.json({ 
              error: "AI response is not a valid quiz array", 
              text: jsonContent 
            }, { status: 400 });
          }
          
          if (quizData.length === 0) {
            console.error("[AI_TUTOR_QUIZ_VALIDATION_ERROR] Quiz array is empty");
            return NextResponse.json({ 
              error: "AI generated an empty quiz", 
              text: jsonContent 
            }, { status: 400 });
          }
          
          // Add IDs and ensure correct structure for quiz data
          const processedQuizData = quizData
            // Filter out any questions that don't have the minimum required structure
            .filter((question: any) => {
              // Ensure each question has the basic required fields
              return question && 
                     typeof question === 'object' &&
                     (question.text || question.question); // Allow for different field names
            })
            .map((question: any, index: number) => {
              // Ensure consistent structure for each question
              const processedQuestion: any = {
                id: question.id || `q${index + 1}`,
                text: question.text || question.question || `Question ${index + 1}`,
                type: question.type || "multipleChoice",
                points: question.points || 1
              };
              
              // Process options if they exist, or create default options
              if (Array.isArray(question.options) && question.options.length > 0) {
                processedQuestion.options = question.options.map((option: any, optIndex: number) => {
                  return {
                    id: option.id || `q${index + 1}-${String.fromCharCode(97 + optIndex)}`,
                    text: option.text || `Option ${String.fromCharCode(65 + optIndex)}`,
                    isCorrect: option.isCorrect || false
                  };
                });
              } else {
                // Create default options if none exist
                processedQuestion.options = [
                  { id: `q${index + 1}-a`, text: "True", isCorrect: true },
                  { id: `q${index + 1}-b`, text: "False", isCorrect: false }
                ];
                
                // For multiple choice, add additional options
                if (processedQuestion.type === "multipleChoice") {
                  processedQuestion.options.push(
                    { id: `q${index + 1}-c`, text: "Not mentioned", isCorrect: false },
                    { id: `q${index + 1}-d`, text: "Partially correct", isCorrect: false }
                  );
                }
              }
              
              // Ensure at least one option is marked as correct
              if (!processedQuestion.options.some((opt: any) => opt.isCorrect)) {
                processedQuestion.options[0].isCorrect = true;
              }
              
              return processedQuestion;
            });
          
          console.log(`[AI_TUTOR_QUIZ_SUCCESS] Generated ${processedQuizData.length} questions`);
          
          // Return the processed quiz data
          return NextResponse.json({ 
            quiz: processedQuizData
          }, { status: 200 });
        } catch (jsonError) {
          console.error("[AI_TUTOR_QUIZ_JSON_PARSE_ERROR]", jsonError);
          console.error("[AI_TUTOR_QUIZ_JSON_PARSE_ERROR_RESPONSE]", cleanedResponse);
          
          // Generate a basic fallback quiz from the model's response
          try {
            console.log("[AI_TUTOR_FALLBACK] Generating basic fallback quiz");
            
            // Create a simple true/false quiz with extracted information from the response
            const lines = cleanedResponse.split(/\n/).filter(line => 
              line.trim().length > 10 && 
              !line.startsWith('<') && 
              !line.startsWith('```')
            );
            
            // Get 5 statements to use for quiz questions (or fewer if not enough lines)
            const statements = lines.slice(0, 5);
            
            // Create fallback questions
            const fallbackQuestions = statements.map((statement, index) => ({
              id: `q${index + 1}`,
              text: `Based on the video, is this statement correct? "${statement.substring(0, 100)}"`,
              type: "multipleChoice",
              points: 1,
              options: [
                {id: `q${index + 1}-a`, text: "True", isCorrect: true},
                {id: `q${index + 1}-b`, text: "False", isCorrect: false},
                {id: `q${index + 1}-c`, text: "Not mentioned", isCorrect: false},
                {id: `q${index + 1}-d`, text: "Partially correct", isCorrect: false}
              ]
            }));
            
            // If we couldn't extract enough statements, add generic questions
            if (fallbackQuestions.length < 2) {
              fallbackQuestions.push({
                id: "q-fallback",
                text: "Did you find this video content informative?",
                type: "multipleChoice",
                points: 1,
                options: [
                  {id: "q-fallback-a", text: "Yes, very informative", isCorrect: true},
                  {id: "q-fallback-b", text: "No, not informative", isCorrect: false},
                  {id: "q-fallback-c", text: "Somewhat informative", isCorrect: false},
                  {id: "q-fallback-d", text: "Need more details", isCorrect: false}
                ]
              });
            }
            
            console.log(`[AI_TUTOR_FALLBACK_SUCCESS] Generated ${fallbackQuestions.length} fallback questions`);
            
            return NextResponse.json({ 
              quiz: fallbackQuestions,
              isServerFallback: true
            }, { status: 200 });
          } catch (fallbackError) {
            console.error("[AI_TUTOR_FALLBACK_ERROR]", fallbackError);
            // If fallback generation fails, return the raw text so client can try to recover
            return NextResponse.json({ 
              error: "Failed to generate valid quiz data", 
              text: cleanedResponse 
            }, { status: 400 });
          }
        }
      } catch (jsonError) {
        console.error("[AI_TUTOR_QUIZ_JSON_PARSE_ERROR]", jsonError);
        console.error("[AI_TUTOR_QUIZ_JSON_PARSE_ERROR_RESPONSE]", cleanedResponse);
        
        // Generate a basic fallback quiz from the model's response
        try {
          console.log("[AI_TUTOR_FALLBACK] Generating basic fallback quiz");
          
          // Create a simple true/false quiz with extracted information from the response
          const lines = cleanedResponse.split(/\n/).filter(line => 
            line.trim().length > 10 && 
            !line.startsWith('<') && 
            !line.startsWith('```')
          );
          
          // Get 5 statements to use for quiz questions (or fewer if not enough lines)
          const statements = lines.slice(0, 5);
          
          // Create fallback questions
          const fallbackQuestions = statements.map((statement, index) => ({
            id: `q${index + 1}`,
            text: `Based on the video, is this statement correct? "${statement.substring(0, 100)}"`,
            type: "multipleChoice",
            points: 1,
            options: [
              {id: `q${index + 1}-a`, text: "True", isCorrect: true},
              {id: `q${index + 1}-b`, text: "False", isCorrect: false},
              {id: `q${index + 1}-c`, text: "Not mentioned", isCorrect: false},
              {id: `q${index + 1}-d`, text: "Partially correct", isCorrect: false}
            ]
          }));
          
          // If we couldn't extract enough statements, add generic questions
          if (fallbackQuestions.length < 2) {
            fallbackQuestions.push({
              id: "q-fallback",
              text: "Did you find this video content informative?",
              type: "multipleChoice",
              points: 1,
              options: [
                {id: "q-fallback-a", text: "Yes, very informative", isCorrect: true},
                {id: "q-fallback-b", text: "No, not informative", isCorrect: false},
                {id: "q-fallback-c", text: "Somewhat informative", isCorrect: false},
                {id: "q-fallback-d", text: "Need more details", isCorrect: false}
              ]
            });
          }
          
          console.log(`[AI_TUTOR_FALLBACK_SUCCESS] Generated ${fallbackQuestions.length} fallback questions`);
          
          return NextResponse.json({ 
            quiz: fallbackQuestions,
            isServerFallback: true
          }, { status: 200 });
        } catch (fallbackError) {
          console.error("[AI_TUTOR_FALLBACK_ERROR]", fallbackError);
          // If fallback generation fails, return the raw text so client can try to recover
          return NextResponse.json({ 
            error: "Failed to generate valid quiz data", 
            text: cleanedResponse 
          }, { status: 400 });
        }
      }
    }
    
    // Log the interaction to database if possible
    try {
      if (user.id) {
        const dbUser = await client.user.findUnique({
          where: { clerkid: user.id }
        });
      
        if (dbUser) {
          await client.aiTutorInteraction.create({
            data: {
              userId: dbUser.id,
              prompt,
              response: cleanedResponse || "",
              context: context || "general_help"
            }
          });
          console.log(`[AI_TUTOR_LOG_SUCCESS] Interaction logged to database`);
        } else {
          console.log(`[AI_TUTOR_LOG_WARNING] Could not find database user for clerk ID: ${user.id}`);
        }
      }
    } catch (dbError) {
      // Don't fail the request if logging fails
      console.error("[AI_TUTOR_LOG_ERROR]", dbError);
    }
    
    return NextResponse.json({ 
      text: cleanedResponse
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("[AI_TUTOR_ERROR]", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({
      error: "Internal server error", 
      message: error.message
    }, { status: 500 });
  }
} 