import unittest
from unittest.mock import patch

from app import local_models


class FakePerformanceModel:
    feature_names_in_ = local_models.MODEL_FEATURES

    def predict(self, rows):
        self.rows = rows
        return [82.46]


class LocalModelTests(unittest.TestCase):
    def test_prediction_preserves_feature_order_and_returns_regression_score(self) -> None:
        model = FakePerformanceModel()
        features = {name: index for index, name in enumerate(local_models.REQUEST_FEATURES)}

        with patch.object(local_models, "load_student_performance_model", return_value=model):
            result = local_models.predict_student_performance(features)

        expected_row = [float(index) for index in range(len(local_models.MODEL_FEATURES))]
        self.assertEqual(list(model.rows.columns), list(local_models.MODEL_FEATURES))
        self.assertEqual(model.rows.iloc[0].tolist(), expected_row)
        self.assertEqual(result["predicted_final_marks"], 82.5)
        self.assertEqual(result["name"], "Student Performance Random Forest Regressor")

    def test_prediction_rejects_missing_model_features(self) -> None:
        features = {name: 0.0 for name in local_models.REQUEST_FEATURES}
        features.pop("internal_marks")

        with self.assertRaisesRegex(ValueError, "internal_marks"):
            local_models.predict_student_performance(features)
