import os
import math
from functools import lru_cache
from pathlib import Path
from typing import Any, Mapping

import joblib
import pandas as pd


MODEL_FEATURES = (
    "Attendance",
    "StudyHours",
    "Assignments",
    "InternalMarks",
    "TestScore",
)
REQUEST_FEATURES = (
    "attendance",
    "study_hours",
    "assignments",
    "internal_marks",
    "test_score",
)
DEFAULT_MODEL_PATH = Path(
    r"C:\Users\dell\Downloads\student-performance\models\student_performance_model.pkl"
)


class LocalModelUnavailable(RuntimeError):
    pass


def _model_path() -> Path:
    configured_directory = os.getenv("EDUAI_MODEL_DIR")
    if configured_directory:
        directory = Path(configured_directory).expanduser()
        if not directory.is_absolute():
            directory = Path(__file__).resolve().parents[3] / directory
        return directory / DEFAULT_MODEL_PATH.name
    return DEFAULT_MODEL_PATH


@lru_cache(maxsize=1)
def load_student_performance_model() -> Any:
    model_path = _model_path()
    if not model_path.is_file():
        raise LocalModelUnavailable(
            f"Local performance model was not found at {model_path}. "
            "Set EDUAI_MODEL_DIR to the directory containing the replacement trained model."
        )

    model = joblib.load(model_path)
    if tuple(getattr(model, "feature_names_in_", ())) != MODEL_FEATURES:
        raise LocalModelUnavailable(
            f"The performance model at {model_path} does not match the expected feature order."
        )
    if not callable(getattr(model, "predict", None)):
        raise LocalModelUnavailable(
            f"The performance model at {model_path} does not support prediction."
        )
    return model


def predict_student_performance(features: Mapping[str, float]) -> dict[str, object]:
    missing_features = [name for name in REQUEST_FEATURES if name not in features]
    if missing_features:
        raise ValueError(f"Missing trained-model features: {', '.join(missing_features)}.")

    values = [float(features[name]) for name in REQUEST_FEATURES]
    feature_frame = pd.DataFrame([values], columns=MODEL_FEATURES)
    model = load_student_performance_model()
    predicted_marks = float(model.predict(feature_frame)[0])
    if not math.isfinite(predicted_marks):
        raise LocalModelUnavailable("The performance model returned a non-finite score.")
    return {
        "name": "Student Performance Random Forest Regressor",
        "predicted_final_marks": round(max(0.0, min(100.0, predicted_marks)), 1),
    }
