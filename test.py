import math

PI = math.pi

def circle_area(radius):
    area = PI * radius * radius
    return area

def greet_user(name):
    greeting = "Hello, " + name + "!"
    if len(name) > 5:
        print(greeting.upper())
    else:
        print(greeting)

def generate_table(n):
    for i in range(1, n + 1):
        print(f"{i} x {i} = {i * i}")

def compute_scores(scores):
    total = 0
    for score in scores:
        if score > 0:
            total += score
    return total

user = "Alice"
greet_user(user)

r = 5
print("Area of circle:", circle_area(r))

generate_table(5)

values = [3, 7, 10, -1, 5]
total_score = compute_scores(values)
print("Total score:", total_score)
