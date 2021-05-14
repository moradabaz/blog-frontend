# Data Science with Rstudio: Let's do an exercise

---

In this post would like to show the results of a supervised learning exercise in which we were going to use some data science techniques to solve it.
The exercise consists in, given a dataset, to predict the candidate a person is going to vote based on some information contained in the data. In this post we are going to show only the results, but
**if you want to read the whole report, I suggest you click on this [link](https://github.com/moradisten/BEPS/blob/master/BEPS.pdf).**


# Introduction

In 2002 there was a survey which collected some information from people in the UK for the british elections in 2002. The information collected was stored in a dataset called *BEPS* and registered data related to people's ideology, euroscepticism, opinion about certain candidates, etc. Having this information, our main target was to predict the candidate a person would vote to if they gathered some of the opinions and ideology patterns. Thus,  we made a statistical supervised learning analysis based on the dataset we have in hand to study the influence and utility of each variable composing the dataset to predict the political party a person would vote. 


# Requirements

To do this exercise, we will need:

* You must have installed Rstudio, which is the IDE we are going to use in exercise.
* You must have, at least, a basic knowledge of  `Rstudio` .
* You must install `Caret`, which is the library that contains the machine learning tools we are going to use.

Also, if during our exercise you find there's a package you haven't installed, do it. And we will do this exercise in an Rmarkdown `.Rmd` file, so that we keep a track of our work.




## Features of the dataset

As we see, we have 10 different variables/predictors:

 * **vote**: This is the *output* we want to draw. It's a Factor variables which represent the three main political parties: Conservative, Liberal Democrat and Labour.
 * **age**: The age of each person surveyed.
 * **gender**: Each person's gender (Male or Female). 
 * **National Economy Knowledge**: This variable represents each person's knowledge of the national economy.
 * **Household Economy Knowledge**: This variable represents each person's knowledge of families' household economy.
 * **Blair**: This variable represents each person's opinion about labourist candidate Blair.
 * **Hague**: This variable represents each person's opinion about conservative candidate Hague.
 * **Kennedy**: This variable represents each person's opinion about conservative candidate Kennedy.
 * **Euroscepticism**: This variable represents each person's euroscepticism. If a persons is very eurosceptic, the value will be 11. If is very pro-european, the value will be 0
 * **Political Knowledge**: This variable represents each person's political knowledge.
 


![](./img/datasciencerstudio/gendervoteratio.png)


![](./img/datasciencerstudio/arevoteratio.png)


![](./img/datasciencerstudio/politicalknowledge.png)


![](./img/datasciencerstudio/europe.png)

### Liberal Democrats vs Non-Liberal Democrats


Observations we can draw here are:

* The only negative values are the `Kennedy` and `political.knowledge` ones, which means, as opinion about Kennedy improves and political knowledge grow, the probability to vote for democrats rises. As the rest of coefficients values rise, the probability of voting for democrat decreases. 

### Conservatives vs Non-Conservatives

The observations we've drawn are:

* The `Blair` and `Kennedy` have a negative impact on Conservative vote.
* The rest have a good influence on the conservative vote election. 


### Laborists vs Non-Laborists

The only predictor that could positively influence on Labour Vote was `Blair`. The rest, as they increase, they have a negative impact on Labour vote.  

### Conclusions 

After executing a logistic regression for each vote value, the general conclusion we can extract are the following:

* **Conservatives**: People who vote for conservatives are people who have a good opinion on `Hague` candidate, they are eurosceptic and have certain political knowledge.
* **Laborists**: They're more likely to be chosen by people who are young or have a good opinion on `Blair`.
* **Liberals**: They're more likely to be chosen by people who have a good opinion on `Kennedy`. 

## Machine Learning training models results

Now we are going to use some Machine Learning models offered by `Caret` Library in RStudio. The three tecniques we will use are:

* **K-nearest neighbors**: This simple classification tecnique classifies an element based on the `k` neighbours previously classified. 
* **Support Vector Machine**: The Support Vector Machine algorithm is an autom'atic learning technique which consists on building a hyperplane in a high dimensionality space which separates the classes we have.
* **Random Forests**: It's a predictive algorithm which uses a *Bagging* technique that combines different trees, where each tree is created by observations and random variables. 

The applied a crossvalidation for each algorithm and picked the best hyperparameters. Then we compared the results

![](./img/datasciencerstudio/comparison.png)



The model has a good predition of the Labour and conservative vote, but a has a bad prediction of the Liberal vote. Our dataset is very small and we may need more tecniques and exemplar to search for a good model. 
**If you want to read the whole report, please click on this [link](https://github.com/moradisten/BEPS/blob/master/BEPS.pdf)** 

**Did you like the post? Did you find it interesting?** If you want to learn more about Data Science and Rstudio, please check this glorious book [R for Data Science](https://r4ds.had.co.nz/), it's one of the greatest books to read if you want to explore more about Data Science and Machine Learning using R. Thanks for reading this post, I hope you find it interesting. 









