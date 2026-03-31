from langchain_huggingface import HuggingFaceEmbeddings


def load_embedding_model():

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )

    return embeddings