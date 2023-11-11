# LangChain-Documentor

LangChain-Documentor is a writing assistance library built using [LangChain.js](https://github.com/langchain-ai/langchainjs). It suggests continuations for the text you input, referencing specified documents and utilizing Large Language Models (LLMs).

## Installation

The installation instructions will be available here once LangChain-Documentor is registered on npm.

<!-- ```bash
npm install langchain-documentor
``` -->

## Basic Usage

```js
const { getDocumentorChain, getDocumentsFromUrl } = require('langchain-documentor');

const documentorChain = await getDocumentorChain();

const url = '<reference url>';
const docs = await getDocumentsFromUrl(url);
await documentorChain.addDocuments(docs);

// also you can add another reference documents
// const anotherUrl = '<another reference url>';
// const anotherDocs = getDocumentsFromUrl(anotherUrl);
// await documentorChain.addDocuments(anotherDocs);

const text = '<text>';
const result = await documentorChain.call({ text });

// documentorChain generates a continuation based on the reference documents and the input text
console.log(result);
```

## Setting up DocumentorChain with detailed configuration

```js
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { OpenAIChat } = require('langchain/llms/openai');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { DocumentorChain, getDocumentsFromUrl } = require('langchain-documentor');

const llm = new OpenAIChat({
  // OpenAIChat options
});
const vectorStore = new FaissStore(new OpenAIEmbeddings(), {});   // you can use any vector store
const documentorChain = DocumentorChain.fromLLM(llm, vectorStore, {
  // number of chunked documents to select for text generation
  k: 8,
  // whether to return the documents referred to while generating the continuation of the text
  returnSourceDocuments: true,
  // whether to display detailed logs for internal processes
  verbose: false,
});
```

## Technical Notes

- Currently, LangChain-Documentor allows the use of web pages specified by URLs as references.
- To retrieve the web pages, LangChain-Documentor utilizes Selenium along with Chrome in headless mode.

## License

LangChain-Documentor is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
