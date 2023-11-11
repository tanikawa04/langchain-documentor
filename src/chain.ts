import { BaseChain, ChainInputs, LLMChain } from 'langchain/chains';
import { BaseLanguageModel } from 'langchain/base_language';
import { CallbackManagerForChainRun } from 'langchain/callbacks';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAIChat } from 'langchain/llms/openai';
import { ChainValues } from 'langchain/schema';
import { TextSplitter, RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { VectorStore } from 'langchain/vectorstores/base';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { SeleniumWebBaseLoader } from './loader.js';
import { TEXT_GENERATION_PROMPT } from './prompt.js';

function makeTextGenerationInput(doc: Document[], text: string) {
  return {
    referenceText: doc.map((doc) => doc.pageContent).join('\n---\n'),
    text,
  };
}

export type DocumentorChainInputs = ChainInputs & {
  vectorStore: VectorStore;
  textGeneratorChain: LLMChain;
  returnSourceDocuments?: boolean;
  k?: number;
};

export class DocumentorChain extends BaseChain implements ChainInputs {
  static lc_name(): string {
    return 'documentor';
  }

  vectorStore: VectorStore;
  textGeneratorChain: LLMChain;
  returnSourceDocuments = true;
  k = 8;

  get inputKeys(): string[] {
    return ['text'];
  }

  get outputKeys(): string[] {
    return this.returnSourceDocuments ? ['text', 'sourceDocuments'] : ['text'];
  }

  constructor(fields: DocumentorChainInputs) {
    super(undefined, fields.verbose, fields.callbacks);
    this.vectorStore = fields.vectorStore;
    this.textGeneratorChain = fields.textGeneratorChain;
    this.returnSourceDocuments = fields.returnSourceDocuments ?? this.returnSourceDocuments;
    this.k = fields.k ?? this.k;
  }

  async addDocuments(documents: Document<Record<string, any>>[], options?: Record<string, any> | undefined) {
    return await this.vectorStore.addDocuments(documents, options);
  }

  // @ts-ignore
  async _call(values: ChainValues, runManager?: CallbackManagerForChainRun): Promise<ChainValues> {
    const text = values.text as string;
    const docs = await this.vectorStore.similaritySearch(text, this.k);
    const textGenerationInput = makeTextGenerationInput(docs, text);
    const result = await this.textGeneratorChain.call(textGenerationInput);

    if (this.returnSourceDocuments) {
      return { ...result, sourceDocuments: docs };
    } else {
      return result;
    }
  }

  _chainType(): string {
    return 'documentor';
  }

  static fromLLM(
    llm: BaseLanguageModel,
    vectorStore: VectorStore,
    options: {
      k?: number,
      returnSourceDocuments?: boolean,
      verbose?: boolean,
    } = {}
  ): DocumentorChain {
    const { verbose, ...rest } = options;
    const textGeneratorChain = new LLMChain({ llm, prompt: TEXT_GENERATION_PROMPT, verbose });
    return new DocumentorChain({ vectorStore, textGeneratorChain, ...rest });
  }
}

export type DocumentorInitOptions = {
  modelName?: string,
  temperature?: number,
  faissStoreDirectory?: string,
  k?: number,
  returnSourceDocuments?: boolean,
  verbose?: boolean,
};

export async function getDocumentorChain(options: DocumentorInitOptions = {}) {
  const llm = new OpenAIChat({
    temperature: options.temperature ?? 0.5,
    modelName: options.modelName ?? 'gpt-4-1106-preview',
  });
  let vectorStore: FaissStore;
  if (options.faissStoreDirectory) {
    vectorStore = await FaissStore.load(options.faissStoreDirectory, new OpenAIEmbeddings());
  } else {
    vectorStore = new FaissStore(new OpenAIEmbeddings(), {});
  }
  const documentorChain = DocumentorChain.fromLLM(llm, vectorStore, {
    k: options.k ?? 8,
    returnSourceDocuments: options.returnSourceDocuments ?? true,
    verbose: options.verbose ?? false,
  });
  return documentorChain;
}

export async function getDocumentsFromUrl(
  url: string,
  splitter: TextSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 64,
    separators: ['\n\n', '\n', '。', '　', ' ', ''],
    keepSeparator: false,
  }),
) {
  const loader = await new SeleniumWebBaseLoader(url);
  const docs = await loader.loadAndSplit(splitter);
  return docs;
}
