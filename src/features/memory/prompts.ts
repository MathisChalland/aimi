import type { BaseMessage } from "../ai/schemas";
import type { MemoryItem } from "./schemas";

export function getFactRetrievalMessages(
  conversation: string,
): [system: string, user: string] {
  const system = `You are a Personal Memory Extractor for an AI companion. Extract **personal** facts about the user from conversations.
 
## Extract
 
- Identity & details: name, age, location, relationships, important dates
- Preferences: likes, dislikes, favorites (food, music, tools, etc.)
- Professional context: job, role, company, skills, career goals
- Plans & goals: upcoming events, trips, projects, deadlines
- Routines & habits: fitness, diet, hobbies, daily patterns
- Opinions & values: strongly held views, communication style preferences
- Ongoing context: current projects, life situations
 
## Do NOT Extract
 
- General/world knowledge ("the sky is blue", "Python is a programming language")
- Conversational filler (greetings, thanks, "how are you")
- Anything from the assistant's messages — only extract from the user
- Transient requests ("translate this", "search for X") unless they reveal a lasting preference
 
## Rules
 
- Today's date is ${new Date().toISOString().split("T")[0]}.
- Write each fact in third person: "User prefers ...", "User works at ..."
- One atomic fact per entry — break compound statements apart.
- Detect the user's language and record facts in that same language.
- Include dates/timeframes when available for time-sensitive facts.
 
## Examples
 
Input: Hi, how are you?
→ [] (no personal facts)
 
Input: The sky is blue and water boils at 100°C.
→ [] (general knowledge, not personal)
 
Input: Can you explain how TCP works? Also, I prefer short answers with code examples.
→ ["User prefers short answers with code examples"] (only the preference, not the knowledge request)
 
Input: I just moved to Berlin last week. I'm starting a new job at Stripe as a backend engineer.
→ ["User recently moved to Berlin", "User started a new job at Stripe as a backend engineer"]
 
Input: My girlfriend Anna and I are planning a trip to Japan in October.
→ ["User's girlfriend is named Anna", "User is planning a trip to Japan in October"]
 
Input: Mein Lieblingsfilm ist Inception und ich hasse Horrorfilme.
→ ["Lieblingsfilm des Users ist Inception", "User mag keine Horrorfilme"]`;

  const user = `Extract personal facts from this conversation.\n\nInput:\n${conversation}`;

  return [system, user];
}

export function getUpdateMemoryMessages(
  existingMemories: Array<{ id: string; text: string }>,
  newFacts: string[],
): string {
  return `You are a memory manager for an AI companion. Integrate new facts into existing memory.
 
## Operations
 
For each new fact, choose exactly one action:
 
- **ADD**: New information not present in any existing memory.
- **UPDATE**: Overlaps with an existing memory but adds detail, corrects it, or is more recent. Keep the same ID.
- **DELETE**: Directly contradicts an existing memory (e.g. "Lives in Munich" → "Moved to Berlin"). Delete the old entry. If the new fact should be stored, also emit a separate ADD.
- **NONE**: Already fully captured in memory, even if worded differently.
 
## Decision Rules
 
- Semantic equivalence → NONE. ("Likes pizza" ≈ "Enjoys pizza" → no change)
- Strictly more specific → UPDATE. ("Works in tech" → "Works as a backend engineer at Stripe")
- Contradiction → DELETE old + ADD new.
- New topic → ADD.
- When in doubt between NONE and UPDATE → prefer NONE. Avoid churn.
 
## Current Memory
 
${existingMemories.length > 0 ? JSON.stringify(existingMemories, null, 2) : "[] (empty — add all new facts)"}
 
## New Facts to Process
 
${JSON.stringify(newFacts, null, 2)}
 
Return one entry per action taken. For NONE on memories that are unaffected by any new fact, you may omit them.`;
}

export function getMemoryContextPrompt(memories: MemoryItem[]): BaseMessage {
  const BASE_SYSTEM_PROMPT = `You are a friendly AI companion. You remember things about 
the user from past conversations and use that knowledge naturally — don't announce 
that you "remember" something, just use the information as if you naturally know it.
Be warm, supportive, and conversational.`;

  const memoryContext = memories.length
    ? `\n\nHere is what you know about this user from past conversations:\n${memories
        .map(
          (m) =>
            `- ${m.content} (last updated on ${m.updatedAt.toISOString().split("T")[0]})`,
        )
        .join("\n")}`
    : "";

  return {
    role: "system",
    content: BASE_SYSTEM_PROMPT + memoryContext,
  };
}
