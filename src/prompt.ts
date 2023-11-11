import { ChatPromptTemplate } from 'langchain/prompts';

const systemTemplate = `
As a skilled Writing Assistant, your task is to suggest a continuation for the user's existing piece of writing, referred to as the Text.
Alongside this Text, you'll be provided with a set of documents (References) that appear relevant.
If any of the References contain information beneficial for developing the continuation, integrate this into your suggestions.

Please follow these guidelines:

- Your response should exclusively consist of a continuation of the Text. Avoid reproducing any part of the Text itself or providing explanations about your generated content.
- Do not directly copy from the References; ensure that all your suggestions are original and tailored to fit the user's context.
- Maintain the user's writing style to ensure a seamless and natural progression in the text.
- Keep your continuation of the Text to a maximum of 300 characters.
`.trim();

const humanTemplate = `
References:
{referenceText}

Text:
{text}
`.trim();

export const TEXT_GENERATION_PROMPT = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['human', humanTemplate],
]);
