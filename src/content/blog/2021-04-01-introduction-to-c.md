---
title: "Introduction to C Language: Syntax, Variables, Control Flow & Functions"
description: "A comprehensive introduction to C programming fundamentals: main function, variables, standard I/O, control flow, loops, and functions."
pubDate: 2021-04-01
author: "Morad Abaz"
category: "Programming"
tags: ["C", "C Language", "Programming", "Computer Science", "Algorithms"]
---

C might be one of the most foundational languages for any computer science career. It forms the core syntax of modern languages like C++, Java, C#, and JavaScript, and remains essential for operating systems, embedded hardware, and high-performance computing.

---

## 1. Creating Your First Program

All executable code in C lives inside functions. The operating system starts execution at a mandatory, deterministic function: `main()`.

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
    return 0;
}
```

* `#include <stdio.h>` imports the Standard Input/Output header file.
* `printf()` outputs text to the standard terminal.
* `return 0;` signals successful execution to the host OS.

---

## 2. Variables & Primitive Data Types

In C, variables must be explicitly typed before use:

```c
int age = 25;
float height = 1.78;
char grade = 'A';
char name[] = "Morad";
```

### Placeholders for `printf()`
* `%d` or `%i`: Integers
* `%f`: Floating point numbers
* `%c`: Characters
* `%s`: Strings (character arrays)

```c
printf("Name: %s, Age: %d, Height: %.2fm\n", name, age, height);
```

---

## 3. Reading Input with `scanf()`

To read user input from the keyboard, use `scanf()` with the memory address operator `&`:

```c
#include <stdio.h>

int main() {
    int age;
    printf("Enter your age: ");
    scanf("%d", &age);
    printf("You entered: %d\n", age);
    return 0;
}
```

---

## 4. Control Flow: Conditions & Loops

### Conditionals (`if`, `else`, `switch`)

```c
if (age >= 18) {
    printf("Adult\n");
} else {
    printf("Minor\n");
}
```

### Switch Statements

```c
switch (day) {
    case 1: printf("Monday\n"); break;
    case 2: printf("Tuesday\n"); break;
    default: printf("Other day\n"); break;
}
```

### Loops (`for`, `while`, `do-while`)

```c
// For loop
for (int i = 0; i < 5; i++) {
    printf("Iteration %d\n", i);
}

// While loop
int count = 0;
while (count < 3) {
    printf("Count: %d\n", count);
    count++;
}
```

---

## 5. Functions

Functions keep code modular and readable:

```c
#include <stdio.h>

int square(int num) {
    return num * num;
}

int main() {
    int val = 5;
    printf("Square of %d is %d\n", val, square(val));
    return 0;
}
```

Practicing writing small programs is the key to mastering C language syntax!
