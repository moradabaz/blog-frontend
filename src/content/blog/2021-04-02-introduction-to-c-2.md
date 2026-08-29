---
title: "Basic Introduction to C: Structs, Pointers and Dynamic Memory"
description: "Mastering C core properties: structs, pointers, memory addresses, stack vs heap, and dynamic memory allocation with malloc and free."
pubDate: 2021-04-02
author: "Morad Abaz"
category: "Programming"
tags: ["C", "C Language", "Pointers", "Memory Management", "Data Structures"]
---

In this second part of the C programming introduction, we explore the core features that give C its efficiency and control: **Structs**, **Pointers**, and **Dynamic Memory Management**.

---

## 1. Structs & `typedef`

A `struct` allows you to group related variables under a single name:

```c
#include <stdio.h>

typedef struct Point {
    int x;
    int y;
} Point;

int main() {
    Point p1 = {10, 20};
    printf("Point coordinates: (%d, %d)\n", p1.x, p1.y);
    return 0;
}
```

Using `typedef` simplifies syntax so you can write `Point p1;` instead of `struct Point p1;`.

---

## 2. Pointers & Memory Addresses

A **pointer** is a variable that stores the memory address of another variable.

* `&var`: Returns the memory address of `var`.
* `*ptr`: Dereferences `ptr` to access or modify the value stored at that address.

```c
#include <stdio.h>

int main() {
    int val = 42;
    int *ptr = &val; // ptr holds address of val

    printf("Value: %d\n", val);
    printf("Address: %p\n", (void*)ptr);
    printf("Value via pointer: %d\n", *ptr);

    *ptr = 100; // Modifies val directly
    printf("New value: %d\n", val);
    return 0;
}
```

---

## 3. Dynamic Memory Allocation (`malloc` & `free`)

When the size of data isn't known at compile time, we allocate memory on the **Heap** using `stdlib.h`:

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;
    int *arr = (int*) malloc(n * sizeof(int));

    if (arr == NULL) {
        printf("Memory allocation failed!\n");
        return 1;
    }

    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;
    }

    for (int i = 0; i < n; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    // Always free allocated memory to prevent memory leaks!
    free(arr);
    return 0;
}
```

Understanding pointers and memory safety is essential for low-level systems programming and C software development.
