import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from app.local_quiz_bank import QuestionCountUnavailable, sample_random_questions


class LocalQuizBankTests(unittest.TestCase):
    def test_samples_unique_questions_and_shuffles_options_with_answer(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "questions.xlsx"
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.append(["question", "section", "topic", "difficulty", "A", "B", "C", "D", "answer"])
            worksheet.append(["Question one?", "Section", "Topic", "Easy", "one", "two", "three", "four", "A"])
            worksheet.append(["question ONE ?", "Section", "Topic", "Easy", "one", "two", "three", "four", "A"])
            worksheet.append(["Question two?", "Section", "Topic", "Hard", "red", "blue", "green", "gold", "D"])
            workbook.save(path)

            questions = sample_random_questions(2, "Any", path)

        self.assertEqual({question["question"] for question in questions}, {"Question one?", "Question two?"})
        for question in questions:
            expected_answer = "one" if question["question"] == "Question one?" else "gold"
            self.assertEqual(question["options"][question["correct_index"]], expected_answer)

    def test_rejects_a_count_larger_than_the_available_question_bank(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "questions.xlsx"
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.append(["question", "difficulty", "A", "B", "C", "D", "answer"])
            worksheet.append(["Question?", "Easy", "one", "two", "three", "four", "A"])
            workbook.save(path)

            with self.assertRaisesRegex(QuestionCountUnavailable, "has 1 usable question"):
                sample_random_questions(2, "Any", path)

    def test_filters_by_difficulty_and_reports_empty_category_count(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "questions.xlsx"
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.append(["question", "difficulty", "A", "B", "C", "D", "answer"])
            worksheet.append(["Easy question?", "Easy", "one", "two", "three", "four", "A"])
            worksheet.append(["Hard question?", "Hard", "red", "blue", "green", "gold", "D"])
            workbook.save(path)

            easy_questions = sample_random_questions(1, "Easy", path)
            self.assertEqual(easy_questions[0]["difficulty"], "Easy")
            with self.assertRaisesRegex(QuestionCountUnavailable, "has 0 usable questions"):
                sample_random_questions(1, "Medium", path)


if __name__ == "__main__":
    unittest.main()
