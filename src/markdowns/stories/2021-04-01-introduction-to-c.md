#  Basic Introduction to C Language
### April 1, 2021

This might be one the most hated languages by standard developers due to its tedious requirements needed to build something, let alone when you have to debug something, it's really horrible. You get errors and bugs and you have no idea of where they come from and sometimes you have to create your own data structures when programming languages like `Java` or `Python` already offer you a lot of tools to treat and manage data. But let's be honest, this language is mandatory for every programmer who is starting their career. It's the core and mother syntax of the most used programming languages, and it's a high payed one. Who will be the brave guy to start the `gdb` debugger to find out what is the devil that is causing `core dump` exception? And, all hardware components embebbed systems are programmed in C/C++. That's why I brougth you here, to learn about this magnificent language that is pretty easy to learn. Once you understand some of the syntax, the rest of programming languages will be easy to learn. Let's start from stratch.


### Creating your first program

Before starting off, we have to keep in mind that C Language uses semicolons `;` to finish a statement or to assign a value to a variable. Also, C Language doesn't allow executable code to exist outside of functions or subroutines. Thus, the program that will execute the code we have written must start from a function. Why? Because C comes from a legacy of single threaded programs and therefore we must have a deterministic starting point, which is the `main()` function. We'll talk about functions later, but let's focus on this one. All C language programs must have a `main()` function because it is the reserved function where the program is going to start running. The simplest program we can write is this one:

```c
main() {
    
}
```

This code wont't do anything it will make the computer do a system call, create a child process, run this code (containing nothing and giving no orders) and it will end. However, this is not a proper way to write a `main()` function. All functions should contain in the beginning the type of value they are returning. In this case, as we are not executing anything and returning no value, we can write it like this:

```c
void main() {
    
}
```

This code executes the `main()` function and tells the compiler it will a *void* value, that is, nothing. However, this is still incorrect. It will work, but it's still not written properly.  
When we run a process, i.e. this code, when it finished its work it should return a value to the Operating System if the program executed successfully or if there has been a problem. That's why the correct way to write a C program is this:

```c
int main() {
    return 0;
}
```

By doing this, we tell the compiler our `main` function returns an **integer** and we tell the OS we are returning the value `0`, notifying a successful execution. Keep in mind that `return` must ALWAYS be placed at the end of the function. 

#### Printing a Hello World

Let's print a "Hello World" as we do with every programming language we want to learn. In order to do this we have to import the Input/Output Library. A Library is a set of named functions encapsulated file and abstracts the programmer from the implementation of these functions. In this case, we have to import the library that contains functions used for file input and output because we want the message to diplayed in our screen. Therefore, we are going to include the `stdio` library on top of the file. Then, to print a message we must use the `printf()` provided by the `stdio` and write our message between the parenthesis and always between double quotes.

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
    return 0;
}
```

Now you might be wondering why we imported a `.h` file and why we added a `\n` to our message. Well, the `stdio.h` is the header file that contains an index of the function that are implemented in the library. The `\n` adds a new line to the message, so that we can have something like this  
```
user$ ./my_program.o
Hello World
user$
```
and not  like this:  
```
user$ ./my_program.o
Hello Worlduser$
```

Congratulations, now you have your first C Language program. 

### Variables, Primitive Data Types and Printing values 

In the previous section, we wrote our first program. But now, we'd like to assign, store and manage a value, that's why we need to use *variables*. A variable is simply an identifier that contains a stored value, just as simple as that. That contained value can be an Integer, a Character, a chain of characters, a data structure, etc. In this section we are going to see the primitive data types, assign a value variables and print them. 


* Numerical variables
 As numerical values, we have integers, floats and doubles. Integers are whole numbers, Floats and doubles are used to store numbers with numbers after the decimal point. An integer value can be, i.e., `34`. Integer values range from `-32767` to `32767`. A float or a double value can be like `12.342` or `345.002`.

 * Alphanumerical variables
 we have characters, that are writen between simple quotes, like 'h', and can only contain a letter. We have `Strings` that are arrays of characters and are written between double quotes, like `"Hello World"`.

Now, how do we declare a variable? A variable can be declared wherever you want and must follow the pattern

```
[type] [name of the variable];
```

If the type is a primitive type, then you have to use this reserved words:

* `int` for integer
* `char` for characters
* `float` for floats
* `double` for double

```c

// int variable
int my_number;
char my_char;
float my_float;
double my_double;
```

Now, how do we assign a value? Easy, just add `=` and the value you want to assign.

```c
int my_number:
my_number = 5;
char my_char:
my_char = 'h';
float my_float:
my_float = 23.231;
double my_double
my_double = 12.234;
```

You can also assign a value to a variable at the same time you are declaring it.

```c
int my_number = 5;
char my_char = 'h';
float my_float = 5.55;
double my_double = 6.55;
```

**WARNING**. If you assign a value that doesn't match with the variable type, it will drop an error. Things like this are not allowed. 

```c
int my_number = 'h';
```

If you assign a integer value to float/double variable, it will not show an error, but rather a warning. Another thing to mention is that you don't have to write the data type to reassign a value to a variable once you declared it. 

```c
int my_number = 5;
my_number = 10;
my_number = 255;
```

**What if I want to print a variable?** Well, you can't print it directly, you have to use a placeholder for each type:

* int (integer values) uses `%d` or `%i` (less used) 
* float/double (floating point values) uses `%f`.
* char (single character values) uses `%c`.

So, if I have a int variable called `my_number` and I want to print it, I have to write this:

```c
int my_age = 20;
float my_heigh = 1.77;
printf("my age is %d\n", my_age);
printf("I'm %f meters tall", my_height);
```

What if I want to print several variables writing just a `printf`? Easy. You put as many placeholders as variable you are going to print. 

```c
int my_age = 20;
float my_heigh = 1.77;
printf("my age is %d and I'm %f m tall\n", my_age, my_height);
```

Make sure you are putting the correct placeholders, otherwise you will have errors.  Another thing you should keep in mind is that you can't print a variable before it's declared and initialized. 

Obviously, there are many more primitive data types. If you want to know more about them, I recommend visiting this website of [freecodecamp](https://www.freecodecamp.org/news/data-types-in-c-integer-floating-point-and-void-explained/). 


#### Arrays and Strings.

Alright, we've seen how to declare, assign and print a variable containing a primitive data type. **But, what if I want to print a word?** In this case we have to declare an array of characters. *How do we write an array?* Well, there are certain ways to declare an array:

* We can do it by initializing directly the items of the array, with the name of the variable followed by `[]` and writing the items between brackets and separated by a coma.

```c
int my_numbers[] = {2, 6, 4, 7};
```

* We can write the number of items we are going to have without initializing each item.

```c
int my_numbers[5];
```

To initialize each item, we can do this.

```c
int my_numbers[5];
my_numbers[0] = 9;
my_numbers[1] = 10;
my_numbers[2] = 0;
my_numbers[3] = 5;
my_numbers[4] = 6;
```

This is very tedious and boring, we'll see another a much better way to initialize the items. Now, you might have noticed there's no index 5 in the example above. This is because the computer starts counting the first element by the number zero, unlike humans who start counting by one. Thus, the indices of an array of an *N* size, range from *0 to N - 1*.

**What about Strings?** Strings are arrays of characters, that is, text. How do we represent them? Well, there are two ways to declare a String:

* Initializing the value of the variable when it's declared.

```c
char my_string[] = "Hello World":
```

You might have noticed Strings are initialized in a different way, between double quotes. 

* Setting the number of character the *String* is going to have.

```c
char my_name[50];
```

And how do we print a string? Just like the rest of the primitive types, by adding a place holder, in this case it's `%s` for strings.

```c
char my_name[] = "Morad";
printf("Hello friends, my name is %s ", my_name);
```

### Reading a value from the keyboard

So far, we've seen how to declare, initialize and print a variable on the screen, but what about making the program ask for a value for a variable? For example, when you want to draw money from an ATM and it asks you for for some info you have to type. That's when we use the function `scanf()` which is an `stdio` Library function.

If we want the computer to tell us to write our age, for example, we have to do this.

```c
#include<stdio.h>

int main() {
  
  int my_age;
  scanf("%d", &my_age);
  
  return 0;
}
```

Alright, what have we done here? The first argument tells the function to read an integer, the second one contains the memory adress of the variable we want to assign our value. To obtain the memory adress of a variable, we must add an `&` in the beginning. 

What if I want the computer to ask for my name? Well, it's simple.

```c
#include<stdio.h>

int main() {
  
  char my_name[50];
  scanf("%s", &my_name);
  
  return 0;
}
```
Another thing we should keep in mind is, if a variable already contains a value, `scanf` will overwrite it. 

### Arithmetical Operations and comments

Before moving on, let's have a quick view on arithmetical and logical operations. Let's say we have two integers `a` and `b`.  

If we want to add or subtract 1 to `a` we can do it like this:

```c
a = a + 1;
a = a - 1;
```

When it comes to one, there's a shorter way to do it

```c
a++;
a--;
```

if we want to add any value to `a`, for example 7,  we can also do it like this

```c
a += 7
```

We can also do it with another variable
```c
a += b
```

We can apply this to subtractions, multiplication and divisions.

```c
a -= b
a *= b
a /= b
```

We can also get a module by doing this:

```c
a % b
```

At last, we have comments. The compiler will ignore the comments you put. You can put comments in one line by doing this:

```c
// this is a comment
int a = 5;
```

Or if you want to write comments in several lines, you can do this:

```c
/*
This is a comment section
The compiler will ignore this
*/
```


### Conditional statements and Loops

#### Conditional Statements

In section we are going to see how to make a decision based on certain conditions. Before starting, let's see the aritmetic-logical operators. Let's say we have two integers, `a` and `b`.

* `a > b` returns `1` if a is greater than b. Otherwise, it will return a `0` value. 

* `a < b` returns `1` if a is lower than b. Otherwise, it will return a `0` value. 

* `a == b` returns `1` if a is equal b. Otherwise, it will return a `0` value. 

Other relational operators are:

*  `a <= b`: `a` less or equal `b`
*  `a >= b`: `a` greater or equal `b`
*  `a != b`: `a` not equals `b`
*  `!a`: returns 1 if `a` equals zero. 

This is one of the most basic and used conditional statements that could change the flow of an execution program. Let's see an example.

```c
if (a > b) {
  printf("This comparison returns 1\n");
}
```

if the value of a is greater that b, it will print a message. Otherwise, it won't print anything. If there's only a statement to execute after the condition, we can also write it without brackets.

```c
if (a > b)
  printf("This comparison returns 1\n");
```

If we want to print an alternative message, we can add an `else`.

```c
if (a > b) {
  printf("This comparison return 1\n");
} else {
  printf("This comparison return 0\n");
}
```

We also have this. 

```c
if (a)
  printf("It's not zero ");
```

This conditions checks if `a` is a non-zero value.

What if we want to add another check if the first condition is not satified? Simple, we just add `else if`.

```c
if (a > b) {
  printf("This comparison return 1\n");
} else if (a == 0) {
  printf("This comparison return 0\n");
} else {
  printf("Well, Im done");
}
```

I remember when I was in college, I used to have problems making the difference between this:

```c
if (a > b) {
  printf("This comparison return 1\n");
} else if (a == 5) {
  printf("This comparison return 5\n");
} else {
  printf("Well, Im done");
}
```

and this:

```c
if (a > b) {
  if (a == 5) {
    printf("This comparison returns 0\n");
  }
} else {
  printf("Well, Im done");
}
```

The first one executes the second `if` when the first condition is not satisfied. The second one executes the second `if` once the first condition is satisified. Having said this, we can put as many nested if-else statements as we want. 


```c
#include<stdio.h>
int main()
{
  int num = 1;
  if(num < 10) {
    if(num == 2) {
      printf("The value is:%d\n",num);  
    } else if (num < 5) {
      printf("The value is lower than 5");
    } else {
      printf("The value is greater than 5");
    }
  } else {
    printf("The value is greater than 10");
  }
  return 0;
}
```

Alright, what if we want to have more than one comparison in one conditional statement? Well, we just have to add `&&` and `||`. `&&` is used when we want to express that one condition AND another are satisfied. 

```c
if (number > 5 && number < 10) {
  printf("The number is greater than 5 and lower that 10");
}
```

`||` is used to express that the if-statement is satisfied if one of the condition are satisfied. 

```c
if (number > 5 || number < 10) {
  printf("The number if either greater than 5 OR lower than 10");
}
```

By the way, we can add more than two conditions.

```c
int number = 6;
int other = 0:
if (number > 5 && number < 10 && other == 0)
  printf("The number value is between 5 and 10, and other equals zero");

```

There is also a simpler way to write a condition, which is this:

```c
(age >= 18) ? (printf("You are an adult")) : (printf("You are not an adult"));
```

If the condition is satisfied, the first statement will be execute, otherwise it will execute the statement which is after the colons. 


Let's move on to another way to write conditional statements. In this case we talk about **switch-case**. Imagine we want to check the day of the week and execute an action depending on each date. We can do this:

```c
int day = 1;

if (day == 1) {
  printf("It's Monday"); 
} else if (day == 2) {
  printf("It's Tuesday");
} else if (day == 3) {
  printf("It's Wednesday");
} else if (day == 4) {
  printf("It's Thursday");
} else if (day == 5) {
  printf("It's Friday");
} else if (day == 6) {
  printf("It's Saturday");
} else if (day == 7) {
  printf("It's Sunday");
}
```

This results too tedious and doesn't look good. That's why we use `switch-case` to make it simple.

```c
int day = 1;

switch (day) {
  case 1:
    printf("It's Monday");
    break;
  case 2:
    printf("It's Tuesday");
    break;
  case 3: 
    printf("It's Wednesday");
    break;
  case 4: 
    printf("It's Thursday");
    break;
  case 5: 
    printf("It's Friday");
    break;
  case 6: 
    printf("It's Saturday");
    break;
  case 7: 
    printf("It's Sunday");
    break;
  default:
    printf("the number doesn't match the days");
    break;
} 
```

This looks much better. Now, you are wondering why we put `break` in each case. Well, we put it because, once one of the cases satifies the condition, it makes the `switch-case` stop running and checking the rest of the cases. Another thing you might have noticed is the `default` word. This the default case we execute when no case satisfies the condition. 

#### Loops

Do you remember this?

```c
int my_numbers[5];
my_numbers[0] = 9;
my_numbers[1] = 10;
my_numbers[2] = 0;
my_numbers[3] = 5;
my_numbers[4] = 6;
```

What if we had an array of 10000 elements? Should we have to initialize each element? HELL NO. That's why we have some loop structures that can help us do this kind of things. 

##### While

Our first loop structure is `while` and the syntax is:

```
while(condition)
  [statement]
```

If you are executing more than one statement you have to put brackets:
```
while(condition) {
  [statement 1]
  [statement 2]
       ....
}
```

Here is an example.

```c
while (7 > 6)
  printf("Hello\n");
```

Obviously, this is going to run forever, that's why it's important put a condition that is going to end. For example:

```c
int counter = 0;

while (counter < 7) {
  printf("Hello\n");
  counter = counter + 1;
}
```

It will print `Hello` seven times as it increases the value of `counter`.


##### Do-While

The `do-while` structure similar to the `while` structure.
```c
do {
  [statements]
} while(condition);
```

The main difference is that, in `while` statement, if the condition is not satisfied at first moment, what's inside brackets won't be executed. For `do-while`, what's in brackets will be executed at least once. 

##### For

For loop is one of the most used structures, it helps write a loop that needs to execute a specific number of times. The syntax is:

```
for (init: condition: increment) {
  [statements]
}
```

* The **init** step is executed first and allows us to declare and initialize any loop control variable. 
* The **condition** will keep the control of the execution. It it is satisfied, it will let the loop execute. If not, it will stop. 
* The **increment** allows us to update any loop control variables.

Let's see an example:

```c
for (int i = 0; i < 10; i++) {
  print("Printing number %d\n", i);
}
```
Keep in mind one thing, which is, if you declare a variable in the structure, like what we have done, that variable will be destroyed after executing the whole loop.

We can also do:

```c 
int i = 0;
for (; i < 10; i +=2) {
    print("Printing number %d\n", i);
}
```

This time, we will keep the latest value of `i` and for each sequence, we will add 2 to the variable `i`. As you might have seen, there's no need to write something in the **init** part, because we already know we are going to start from `i = 0`. 


So, back to our example, let's try different loops. *Suppose we have an array of integers and we want to initialize them with the square value of each index and print the results.*  

```c
int numbers[5];
```

If we use a `while` loop, it will be like this:

```c
int counter = 0;
while (counter < 0) {
  int value = counter + 1;            // we put counter + 1, because for the computer the first index is 0
  numbers[counter] =  value * value;
  printf("%d\n", numbers[counter]);
  counter++;
}

```

If we use a `do-while` loop, it will be like this:

```c
int counter = 0;
do {
  int value = counter + 1;            
  numbers[counter] =  value * value;
  printf("%d\n", numbers[counter]);
  counter++;
} while(counter < 5);
```

If we use a `for` loop, it will like this:

```c
for (int counter = 0; counter < 5; counter++) {
  int value = counter + 1;
  numbers[counter] =  value * value;
  printf("%d\n", numbers[counter]);
}
```

### Functions 

In previous sections we've seen primitive data types, conditions, loops and arithmetical operations. But most of the time, there are some group of statements we used at the same time to perform a task, that's why we use functions. Functions execute the same code and can return a value depending on the arguments you pass, can perform an action or transform a data structure. C Language already uses a `main()` function to start the execution. The syntax of a function in C is:

```
[return type] name(type argument1, type argument2, ...) {
  [statements]
}
```

* The `return type` will is the type of the value you are going to return. You may create a function that returns no value.
* Between the parenthesis you can write the arguments or parameters you are going to pass.
* Between the brackets you'll find the statements you are going to execute.
* If the function is returning a value, we must always put `return [value]` in the end of the functon. When we write `return` we are telling the function that the sequence is done.

Let's see an example. Let's suppose I want a function that receives an integer as input and return the square value of that input. 

```c
int square_value(int number) {
  return number * number;
}
```

In this function, we return an integer type, that's why we write `int` in the beginning. We pass an integer argument, so we put the type and a name (You can put the name you want), and finally we return that argument multiplied by itself.  
Let's see another example, we will create a function that returns nothing but prints the subtraction of two numbers.

```c
void print_subtraction(int first_number, int second_number) {
  int difference = first_number - second_number;
  printf("The resulf of %d - %d is: %d\n", first_number, second_number, difference);
}
```

The function returns a void value, so we don't have to write a `return`. We created a variable called `difference` and printed a message. I want to stop here to say that `difference` is local variable and can only be accessed inside the function. That is, the variable `difference` doesn't exist for the rest of the code, only inside the function.

If we want to create a function an pass a string as an argument, we have to do it without putting the number of characters, that is:

```c
void print_a_word(char word[]) {
  printf("%s\n", word);
}
```

or like this (We'll explain what that asterisk means):

```c
void print_a_word(char * word) {
  printf("%s\n", word);
}
```

So, **Where do you write a function in the code?** Never inside the main function. 

This is **INCORRECT**.
```c
  int main() {
    int square_value(int number) {
      return number * number;
    }
    return 0:
  }
```

Normally we write a function above the `main()`:

```c
int square_value(int number) {
  return number * number;
}


int main() {

  return 0;
}
```

We can also write a function below the `main()` but first we have declare it above without the body.

```c
int square_value(int number);

int main() {

  return 0;
}

int square_value(int number) {
  return number * number;
}
```

The `main()` function also has arguments.
```c
int main(int argc, char * argv[]) {
  .........
}
```

* `argc` stores the number of arguments passed when the user runs the program is run in a command line. 
* `argv` is an array of strings in which each string is an argment passed through the command-line.

So, how do we invoke a function we have created? It's simple, let's see an example.

```c
#include <stdio.h>

int square_value(int number) {
  return number * number;
}


int main() {
  int number = square_value(2):
  printf("%d\n", number);
  return 0;
}
```

This code will print the value of `4`, we pass `2` as an argument and the returned value will be stored in the `number` variable. We can also pass a variable as an argument.

```c
int square_value(int number) {
  return number * number;
}

int main() {
  int number = 2;
  int square_number = square_value(number);
  printf("%d\n", square_number);
  return 0;
}
```

or even like this

```c
int square_value(int number) {
  return number * number;
}

int main() {
  int number = 2;
  printf("%d\n", square_value(number));
  return 0;
}
```

### Let's practice 

If this post resulted interesting for you, check [this page](https://codeforwin.org/c-programming-examples-exercises-solutions-beginners) to practice with some simple exercises. Practicing is the key to mastery :)
