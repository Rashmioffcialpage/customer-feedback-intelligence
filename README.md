# Customer Feedback Intelligence

An NLP project exploring sentiment classification of customer review
sentences. I am building this project in public and documenting the
experiments, results, and limitations.

**Status: In progress — data preparation and initial model experiments.**

## Completed

- Loaded 1,000 Amazon review sentences
- Prepared a cleaned dataset containing 987 sentences
- Created training, validation, and test splits
- Trained a dummy baseline
- Compared TF-IDF with logistic regression and Multinomial Naive Bayes
- Inspected validation errors and vocabulary coverage

## Validation results

Models were trained on 591 sentences and evaluated on 198 validation
sentences.

| Model | Accuracy | Macro F1 | Errors |
| --- | ---: | ---: | ---: |
| Dummy baseline | 50.0% | 0.333 | 99 |
| Logistic regression | 79.3% | 0.793 | 41 |
| Multinomial Naive Bayes | 78.8% | 0.788 | 42 |

Both trained classifiers misclassified 33 of the same validation sentences.
Their accuracy differs by one correct prediction; this single split does
not establish a general winner.

**The final test set remains untouched.**

## Current experiment

Testing whether changing TF-IDF's minimum document frequency from 2 to 1
affects vocabulary size and validation performance. Results are pending.

## Planned work

- Complete error analysis and model selection
- Evaluate the selected approach on the held-out test set
- Build a FastAPI prediction service
- Build a React interface with visual summaries
- Add tests and setup documentation

## Tools

Python, pandas, NumPy, scikit-learn, matplotlib, and Jupyter notebooks.

## Dataset and limitations

Source: [UCI Sentiment Labelled Sentences](https://archive.ics.uci.edu/dataset/331/sentiment+labelled+sentences),
Amazon subset.

Citation: Kotzias, D. (2015). Sentiment Labelled Sentences [Dataset].
UCI Machine Learning Repository.
https://doi.org/10.24432/C57604

Dataset license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Processed copies are derived from the source dataset using the cleaning
and splitting steps documented in the notebook.

This is a small, curated sample with positive and negative labels.
It contains no neutral class and does not represent overall customer
satisfaction. Results are not evidence of production readiness.