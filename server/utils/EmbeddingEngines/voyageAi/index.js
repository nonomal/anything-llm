class VoyageAiEmbedder {
  constructor() {
    if (!process.env.VOYAGEAI_API_KEY)
      throw new Error("No Voyage AI API key was set.");

    const {
      VoyageEmbeddings,
    } = require("@langchain/community/embeddings/voyage");
    const voyage = new VoyageEmbeddings({
      apiKey: process.env.VOYAGEAI_API_KEY,
    });

    this.voyage = voyage;
    this.model = process.env.EMBEDDING_MODEL_PREF || "voyage-large-2-instruct";

    // Limit of how many strings we can process in a single pass to stay with resource or network limits
    this.batchSize = 128; // Voyage AI's limit per request is 128 https://docs.voyageai.com/docs/rate-limits#use-larger-batches
    this.embeddingMaxChunkLength = this.#getMaxEmbeddingLength();
  }

  // https://docs.voyageai.com/docs/embeddings
  #getMaxEmbeddingLength() {
    switch (this.model) {
      case "voyage-large-2-instruct":
      case "voyage-law-2":
      case "voyage-code-2":
      case "voyage-large-2":
        return 16_000;
      case "voyage-2":
        return 4_000;
      default:
        return 4_000;
    }
  }

  async embedTextInput(textInput) {
    const result = await this.voyage.embedDocuments(
      Array.isArray(textInput) ? textInput : [textInput],
      { modelName: this.model }
    );
    return result || [];
  }

  async embedChunks(textChunks = []) {
    try {
      const embeddings = await this.voyage.embedDocuments(textChunks, {
        modelName: this.model,
        batchSize: this.batchSize,
      });
      return embeddings;
    } catch (error) {
      console.error("Voyage AI Failed to embed:", error);
      throw error;
    }
  }
}

module.exports = {
  VoyageAiEmbedder,
};
