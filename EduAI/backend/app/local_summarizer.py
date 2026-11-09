import math
import os
import pickle
import re
from functools import lru_cache
from pathlib import Path
from typing import Any


DEFAULT_MODEL_PATH = Path(
    r"C:\Users\dell\Downloads\student-performance\models\text_summarization_model.pkl"
)


class SummarizationModelUnavailable(RuntimeError):
    pass


class SummarizationInputError(ValueError):
    pass


def _model_path() -> Path:
    configured_path = os.getenv("EDUAI_SUMMARIZATION_MODEL_PATH")
    if not configured_path:
        return DEFAULT_MODEL_PATH

    path = Path(configured_path).expanduser()
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[3] / path
    return path


@lru_cache(maxsize=1)
def load_summarization_model() -> dict[str, Any]:
    model_path = _model_path()
    if not model_path.is_file():
        raise SummarizationModelUnavailable(
            f"Local summarization model was not found at {model_path}. "
            "Set EDUAI_SUMMARIZATION_MODEL_PATH to the model file."
        )

    try:
        with model_path.open("rb") as model_file:
            model = pickle.load(model_file)
    except (OSError, pickle.PickleError, EOFError) as error:
        raise SummarizationModelUnavailable(
            f"Local summarization model at {model_path} could not be loaded."
        ) from error

    frequencies = model.get("word_frequencies") if isinstance(model, dict) else None
    stop_words = model.get("stop_words") if isinstance(model, dict) else None
    if (
        not isinstance(frequencies, dict)
        or not frequencies
        or not all(
            isinstance(word, str)
            and isinstance(frequency, (int, float))
            and math.isfinite(frequency)
            and frequency >= 0
            for word, frequency in frequencies.items()
        )
        or not isinstance(stop_words, (list, tuple, set))
        or not all(isinstance(word, str) for word in stop_words)
    ):
        raise SummarizationModelUnavailable(
            f"Local summarization model at {model_path} has an incompatible format."
        )

    return {"word_frequencies": frequencies, "stop_words": set(stop_words)}


def _preprocess(text: str, stop_words: set[str]) -> list[str]:
    normalized = re.sub(r"[^a-zA-Z0-9\s]", "", text.lower())
    return [
        word
        for word in normalized.split()
        if word not in stop_words and len(word) > 2
    ]


def summarize_study_material(text: str, max_sentences: int = 3) -> str:
    model = load_summarization_model()
    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?]+", text)
        if sentence.strip() and len(sentence.strip()) > 10
    ]
    if not sentences:
        raise SummarizationInputError("The study material has no summarizable sentences.")

    frequencies = model["word_frequencies"]
    stop_words = model["stop_words"]
    scored_sentences: list[tuple[int, str, float]] = []
    for index, sentence in enumerate(sentences):
        words = _preprocess(sentence, stop_words)
        known_frequencies = [frequencies[word] for word in words if word in frequencies]
        score = sum(known_frequencies) / len(known_frequencies) if known_frequencies else 0.0
        if len(sentence) > 100:
            score *= 1.4
        elif len(sentence) > 50:
            score *= 1.2
        scored_sentences.append((index, sentence, score))

    selected = {
        index
        for index, _, _ in sorted(
            scored_sentences,
            key=lambda item: item[2],
            reverse=True,
        )[:max(1, max_sentences)]
    }
    summary = ". ".join(
        sentence for index, sentence, _ in scored_sentences if index in selected
    )
    return f"{summary}."
