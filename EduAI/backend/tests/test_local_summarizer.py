import unittest
from unittest.mock import patch

from app import local_summarizer


class LocalSummarizerTests(unittest.TestCase):
    def test_selects_highest_scored_sentences_and_keeps_source_order(self) -> None:
        model = {
            "word_frequencies": {"alpha": 1.0, "beta": 0.1, "gamma": 0.2},
            "stop_words": {"are", "by", "can", "to"},
        }
        text = (
            "Beta concepts are understood by students. "
            "Alpha concepts are understood by learners. "
            "Gamma ideas can explain material to readers."
        )

        with patch.object(local_summarizer, "load_summarization_model", return_value=model):
            summary = local_summarizer.summarize_study_material(text, max_sentences=2)

        self.assertEqual(
            summary,
            "Alpha concepts are understood by learners. Gamma ideas can explain material to readers.",
        )

    def test_rejects_text_without_summarizable_sentences(self) -> None:
        with patch.object(
            local_summarizer,
            "load_summarization_model",
            return_value={"word_frequencies": {"text": 1.0}, "stop_words": set()},
        ):
            with self.assertRaisesRegex(
                local_summarizer.SummarizationInputError,
                "no summarizable sentences",
            ):
                local_summarizer.summarize_study_material("Too short.")
