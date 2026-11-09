import logging
import os
import random
import re
import zipfile
from pathlib import Path
from threading import Lock
from typing import Any

from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException


DEFAULT_QUESTION_BANK_PATH = Path(
    r"C:\Users\dell\Downloads\student-performance\Placement_Interview_Quiz_Questions.csv.xlsx"
)

_logger = logging.getLogger(__name__)
_cache_lock = Lock()
_cached_bank: tuple[Path, int, tuple[dict[str, Any], ...]] | None = None


class QuestionBankUnavailable(Exception):
    pass


class QuestionCountUnavailable(Exception):
    pass


def question_bank_path() -> Path:
    configured_path = os.getenv("EDUAI_QUIZ_BANK_PATH")
    return Path(configured_path).expanduser() if configured_path else DEFAULT_QUESTION_BANK_PATH


def _read_question_bank(path: Path) -> tuple[dict[str, Any], ...]:
    try:
        workbook = load_workbook(path, read_only=True, data_only=True)
    except (OSError, ValueError, InvalidFileException, zipfile.BadZipFile) as error:
        raise QuestionBankUnavailable(
            f"The local quiz question bank could not be opened at {path}. "
            "Set EDUAI_QUIZ_BANK_PATH to a readable .xlsx question bank."
        ) from error

    try:
        worksheet = workbook.active
        rows = worksheet.iter_rows(values_only=True)
        headers = next(rows, None)
        if headers is None:
            raise QuestionBankUnavailable("The local quiz question bank is empty.")
        columns = {
            str(value).strip().lower(): index
            for index, value in enumerate(headers)
            if value is not None
        }
        required = {"question", "difficulty", "a", "b", "c", "d", "answer"}
        missing = sorted(required - columns.keys())
        if missing:
            raise QuestionBankUnavailable(
                f"The local quiz question bank is missing required columns: {', '.join(missing)}."
            )

        questions: list[dict[str, Any]] = []
        invalid_rows = 0
        duplicate_rows = 0
        seen_questions: set[str] = set()
        for row in rows:
            if not any(value is not None for value in row):
                continue
            question = str(row[columns["question"]] or "").strip()
            difficulty = str(row[columns["difficulty"]] or "").strip().title()
            options = [str(row[columns[key]] or "").strip() for key in ("a", "b", "c", "d")]
            answer = str(row[columns["answer"]] or "").strip().upper()
            if (
                not question
                or difficulty not in {"Easy", "Medium", "Hard"}
                or not all(options)
                or len({option.casefold() for option in options}) != 4
                or answer not in {"A", "B", "C", "D"}
            ):
                invalid_rows += 1
                continue
            question_key = re.sub(r"\W+", " ", question.casefold()).strip() or question.casefold().strip()
            if question_key in seen_questions:
                duplicate_rows += 1
                continue
            seen_questions.add(question_key)

            section = str(row[columns["section"]] or "").strip() if "section" in columns else ""
            topic = str(row[columns["topic"]] or "").strip() if "topic" in columns else ""
            questions.append(
                {
                    "question": question,
                    "options": options,
                    "correct_index": ord(answer) - ord("A"),
                    "explanation": f"The correct answer is {options[ord(answer) - ord('A')]}",
                    "difficulty": difficulty,
                    "topic": topic or section or "General",
                    "section": section,
                }
            )
        if invalid_rows:
            _logger.warning("Skipped %d malformed rows in the local quiz question bank.", invalid_rows)
        if duplicate_rows:
            _logger.info("Skipped %d duplicate questions in the local quiz question bank.", duplicate_rows)
        if not questions:
            raise QuestionBankUnavailable("The local quiz question bank has no valid multiple-choice questions.")
        return tuple(questions)
    finally:
        workbook.close()


def _load_question_bank(path: Path) -> tuple[dict[str, Any], ...]:
    global _cached_bank

    try:
        modified_at = path.stat().st_mtime_ns
    except OSError as error:
        raise QuestionBankUnavailable(
            f"The local quiz question bank was not found at {path}. "
            "Set EDUAI_QUIZ_BANK_PATH to its .xlsx file."
        ) from error

    with _cache_lock:
        if _cached_bank is not None:
            cached_path, cached_modified_at, cached_questions = _cached_bank
            if cached_path == path and cached_modified_at == modified_at:
                return cached_questions
        questions = _read_question_bank(path)
        _cached_bank = (path, modified_at, questions)
        return questions


def sample_random_questions(
    question_count: int,
    difficulty: str = "Any",
    bank_path: Path | None = None,
) -> list[dict[str, Any]]:
    questions = _load_question_bank(bank_path or question_bank_path())
    eligible = [
        question for question in questions
        if difficulty == "Any" or question["difficulty"] == difficulty
    ]
    if question_count > len(eligible):
        question_label = "question" if len(eligible) == 1 else "questions"
        raise QuestionCountUnavailable(
            f"The question bank has {len(eligible)} usable {question_label} for difficulty '{difficulty}', "
            f"but {question_count} were requested. Choose a smaller count or another difficulty."
        )

    selected = random.sample(eligible, question_count)
    generated: list[dict[str, Any]] = []
    for source in selected:
        answer_order = list(range(len(source["options"])))
        random.shuffle(answer_order)
        options = [source["options"][index] for index in answer_order]
        question = {
            **source,
            "options": options,
            "correct_index": answer_order.index(source["correct_index"]),
        }
        generated.append(question)
    return generated
