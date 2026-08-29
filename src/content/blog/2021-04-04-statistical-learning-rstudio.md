---
title: "Data Science with RStudio: Supervised Learning & Election Prediction"
description: "A Supervised Learning exercise using RStudio and Caret package to predict voting patterns in British elections."
pubDate: 2021-04-04
author: "Morad Abaz"
category: "Data Science"
tags: ["R", "RStudio", "Data Science", "Supervised Learning", "Caret"]
---

In this post I present the results of a supervised learning exercise in which we used data science techniques in RStudio to predict candidate votes based on demographic and political survey data.

If you want to read the full technical report, check out the PDF on GitHub: [BEPS.pdf](https://github.com/moradisten/BEPS/blob/master/BEPS.pdf).

---

## Introduction

In 2002, the British Election Study (BEPS) collected survey data from voters in the UK. The dataset recorded variables related to political ideology, euroscepticism, candidate opinions, and demographics. Our primary objective was to build statistical supervised learning models to analyze the influence of each variable and predict voter preferences.

## Requirements

To replicate this exercise, you will need:
* [RStudio](https://rstudio.com/) IDE installed
* Basic working knowledge of `R`
* The [`caret`](https://topepo.github.io/caret/) package for machine learning tools

---

## Features of the Dataset

We analyzed 10 key predictors:

* **vote**: Target output factor (Conservative, Liberal Democrat, Labour)
* **age**: Voter age
* **gender**: Gender (Male / Female)
* **National Economy Knowledge**: Assessment of national economic state
* **Household Economy Knowledge**: Family financial outlook
* **Blair**: Opinion score for Labour candidate Tony Blair
* **Hague**: Opinion score for Conservative candidate William Hague
* **Kennedy**: Opinion score for LibDem candidate Charles Kennedy
* **Euroscepticism**: Score from 0 (pro-European) to 11 (highly eurosceptic)
* **Political Knowledge**: Score indicating general political awareness

---

## Key Model Insights

### 1. Conservatives vs Non-Conservatives
* Higher opinion scores for **Hague** and higher **Euroscepticism** strongly correlated with voting Conservative.
* **Blair** and **Kennedy** scores had a negative impact on Conservative votes.

### 2. Labourists vs Non-Laborists
* **Tony Blair**'s approval rating was the single strongest positive predictor for Labour votes, especially among younger demographics.

### 3. Liberal Democrats vs Non-Liberal Democrats
* Approval of **Charles Kennedy** and high **political knowledge** increased the probability of voting Liberal Democrat.

---

## Machine Learning Model Comparison

We trained and evaluated three classification models using Cross-Validation:

1. **K-Nearest Neighbors (KNN)**
2. **Support Vector Machines (SVM)**
3. **Random Forests**

The models showed strong predictive accuracy for Labour and Conservative voters, while Liberal Democrat votes required additional features due to dataset size limitations.

For further reading on Data Science with R, I highly recommend the free online book [R for Data Science](https://r4ds.had.co.nz/).
