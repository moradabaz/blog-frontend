# Data Science Exercise: Predition Models with Python
---

In this post we show how we did a simple data science exercise, with python, which consists in the data exploration and models comparison to predict whether a person is earning more than 50.000$ a year.
If you want to read the whole report, please check this kaggle link [here](https://www.kaggle.com/moradisten/adult-income-prediction-and-data-exploration). In this post we are going to show the results and the requirements needed. 

### Requirements
*  [Python3](https://www.python.org/downloads/)
*  [Jupyter Notebook](https://jupyter.org/install) because our exercise will be done in a python notebook. If you don't want to install `Jupyter`, I recommend signin up in [Kaggle](https://www.kaggle.com/) and create a notebook there. 
* Python packages:
  * [`pandas`](https://pandas.pydata.org/) 
  * [`numpy`](https://numpy.org/)
  * [`sklearn`](https://scikit-learn.org/stable/)
  * [`matplotlib`](https://matplotlib.org/)
  * [`scipy`](https://www.scipy.org/)
  * [`seaborn`](https://seaborn.pydata.org/)

Download the dataset we will need to do our exercise by clicking [here](https://github.com/moradisten/personal-ml-notebooks/tree/master/datasets/AdultIncome)


## Final observations and Conclusion after the Data Exploration

We analyzed and explored all the features of the dataset and their particularities, we want to summerise all the interesting facts we discovered and could help us predict whether a person earns more or less than 50,000\$. The interesting observations we drew are:
* **Workclas and occupations**
    * The 55% of self employed people work are self-employed
    * The 63.3% of the total people in the census earning more than 50,000\$ work in the private sector and the 71% of the total people in the census earning under 50,000\$ work in the private sector too. 
    * If we only focus on the private sector, the 26% of the people earn more than 50,000$\year.
    * Jobs in which people earn above 50,000\$ are executive managers, protection services, college professors, engineering and jobs related to technology who are mostly occupied by men.

![png](./img/adult-income/output_501.png)

* **Education**
    * It's interesting that the 73% of the Professors, 74% of PhDs, the 55% of people owning a Master Degree and the 40% of Bachelors bachelors earn above 50,000 $.
    * We this information we can conclude that owning at least a college degree will increase your probabilities to earn 50,000 $/year.
    
    
* **Gender, Marital Status and relationship**
    * The 85% of total people in the census earning more than 50,000\$ are married.
    * The 44% of people who are married earn more than 50,000\$.
    * The 44% of husbands earen more than 50,000\$.
    * The 47% of Wifes earn more than 50,000\$.
    * According to this info, being maried increases the probability of earning above 50,000\$.
    
    
* **Other interesting information**
    * The salary is directly related to age. The older people get, the more the surpass the 50,000\$ line.
    * Men work for more hours than women in all ages but as they both get closer to the 60's they tend to work for similiar amount of hours per week.
    * People earning more than 50,000\$ per year tend to work for more hours too.
    * Men working for more than 40 hours per week tend to earn above 50,000\$ but women don't follow this trend and there's no correlation between hours per week and income when it comes to females. 

    ![png](./img/adult-income/output_502.png)


    ![png](./img/adult-income/output_500.png)
  

##### Conclusions

With the information above we've seen, we could say that a person who's likely to earn above 50.000$/year is a person who:
  * Is male whose age is between 30 or over.
  * Married
  * Whose job is related to bussines, engineering, college profesor, protection services, technical or IT field.
  * Holds a master degree or a Phd.
  * Works for more than 40 hours per week.
  * Is American, Asian or European.

    

## Machine Learning algorithms for classification trained

We've performed a training and testing process using a traditional ML technique which was the Logistic Regression. Now, we'll use some modern classifers which are:
For all of them we'ved performed a crossvaliation to detect the best hyperparameters.

* Logistic Regression
* Random Forests
  * Max. Features: 2
  * Number of Estimators: 30
* Gradient Boosting Machine
  * Max. Depth: 7
  * Min. samples to split: 800
* K Nearest Neighbours
  * Number of Nearest Neighbours: 8
* Naive Bayes
  * Smoothing: 1e-09


    
![png](./img/adult-income/output_271_1.png)
    


Our results concluded that the Random Forest Classifier is the best compared to the rest due the time Gradient Boosting needs to perform the training and testing with a 81.36% accuracy. 

**If you want to read the whole report, please click [here](https://www.kaggle.com/moradisten/adult-income-prediction-and-data-exploration) to get to the Kaggle notebook.
If you want to try this model, you can click in this [link](http://localhost:8080/adult-income/) where you can interact a little bit with the deployed model.** 

**Did you like this exercise? Do you want to find new datasets to train your skill as a data scientist or a machin learning engineer?** I highly recommend [Kaggle](https://www.kaggle.com/) where you can find a lot of datasets, create your own notebooks, participate in paid challenges (Sweet money, oh yeah) and, of course, see other highly professional data scientists notebooks and how they solve machine learning problems. Thanks for visiting this post and see you around ;)