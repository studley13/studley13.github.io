---
layout: post
hidden: true
---

This is just going to test some basic code.

~~~ c
int main(int argc, char *argv[]) {
    for (int i = 0; i < argc; i++) {
        printf("Item %d is %s", i, argv[i]);
    }
    return EXIT_SUCCESS;
}
~~~
