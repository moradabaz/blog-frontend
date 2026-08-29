---
title: "Data Science Exercise: Prediction Models with Python"
description: "Data exploration and ML classification models comparison to predict whether a person earns more than $50,000/year using Python, Pandas, and Scikit-Learn."
pubDate: 2021-04-06
author: "Morad Abaz"
category: "Data Science"
tags: ["Data Science", "Python", "Machine Learning", "Scikit-Learn"]
---

In this post we show how we did a simple data science exercise, with python, which consists in the data exploration and models comparison to predict whether a person is earning more than $50,000 a year.

If you want to read the whole report, please check this kaggle link [here](https://www.kaggle.com/moradisten/adult-income-prediction-and-data-exploration). In this post we are going to show the results and the requirements needed. 

### Requirements
* [Python3](https://www.python.org/downloads/)
* [Jupyter Notebook](https://jupyter.org/install) because our exercise will be done in a python notebook. If you don't want to install `Jupyter`, I recommend signin up in [Kaggle](https://www.kaggle.com/) and create a notebook there. 
* Python packages:
  * [`pandas`](https://pandas.pydata.org/) 
  * [`numpy`](https://numpy.org/)
  * [`sklearn`](https://scikit-learn.org/stable/)
  * [`matplotlib`](https://matplotlib.org/)
  * [`scipy`](https://www.scipy.org/)
  * [`seaborn`](https://seaborn.pydata.org/)

Download the dataset we will need to do our exercise by clicking [here](https://github.com/moradisten/personal-ml-notebooks/tree/master/datasets/AdultIncome)

---

## Final observations and Conclusion after the Data Exploration

We analyzed and explored all the features of the dataset and their particularities, we want to summerise all the interesting facts we discovered and could help us predict whether a person earns more or less than $50,000. The interesting observations we drew are:

* **Workclass and occupations**
    * The 55% of self employed people work are self-employed
    * The 63.3% of the total people in the census earning more than $50,000 work in the private sector and the 71% of the total people in the census earning under $50,000 work in the private sector too. 
    * If we only focus on the private sector, the 26% of the people earn more than $50,000/year.
    * Jobs in which people earn above $50,000 are executive managers, protection services, college professors, engineering and jobs related to technology who are mostly occupied by men.

* **Education**
    * It's interesting that the 73% of the Professors, 74% of PhDs, the 55% of people owning a Master Degree and the 40% of Bachelors earn above $50,000.
    * With this information we can conclude that owning at least a college degree will increase your probabilities to earn $50,000/year.
    
* **Gender, Marital Status and relationship**
    * The 85% of total people in the census earning more than $50,000 are married.
    * The 44% of people who are married earn more than $50,000.
    * According to this info, being married increases the probability of earning above $50,000.
    
* **Other interesting information**
    * The salary is directly related to age. The older people get, the more they surpass the $50,000 line.
    * Men work for more hours than women in all ages but as they both get closer to the 60's they tend to work for similar amount of hours per week.
    * People earning more than $50,000 per year tend to work for more hours too.

##### Conclusions

With the information above, we could say that a person who's likely to earn above $50,000/year is a person who:
  * Is male whose age is 30 or over.
  * Married
  * Whose job is related to business, engineering, college professor, protection services, technical or IT field.
  * Holds a master degree or a PhD.
  * Works for more than 40 hours per week.

---

## Machine Learning algorithms trained

We've performed a training and testing process using traditional ML techniques:

* **Logistic Regression**
* **Random Forests**
  * Max. Features: 2
  * Number of Estimators: 30
* **Gradient Boosting Machine**
  * Max. Depth: 7
  * Min. samples to split: 800
* **K Nearest Neighbours**
  * Number of Nearest Neighbours: 8
* **Naive Bayes**
  * Smoothing: 1e-09

Our results concluded that the **Random Forest Classifier** is the best choice compared to the rest due to performance and accuracy (81.36%).

**If you want to read the whole report, please click [here](https://www.kaggle.com/moradisten/adult-income-prediction-and-data-exploration) to get to the Kaggle notebook.**
