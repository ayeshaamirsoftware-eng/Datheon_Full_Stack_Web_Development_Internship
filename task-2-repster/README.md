# REPSTER — Built one rep at a time

A responsive strength-training planner built with HTML, CSS, and vanilla JavaScript. Open `dist/index.html` to use it; there is no build step or account.

Beginners can start with a full-body, upper-body, or lower-body template, or create a custom workout with familiar form controls. Strength exercises use sets, reps, and weight, while walking and running use duration and optional distance. In workout mode, REPSTER shows one exercise at a time with a short form tip, clear completion checks, and an optional 60-second rest timer.

A weekly target, training history, and light/dark theme make progress visible. Workouts, set progress, history, target, and theme are stored in the browser on the current device. A fresh browser opens with a clear first-workout state.

The site uses the approved REPSTER identity and the supplied gym photograph in its hero. The previous page is retained as `index-before-redesign.html` in the project folder for comparison.

## Datheon Task 2 mapping

REPSTER treats a planned workout session as a task. Users can create, view, edit, and delete sessions; assign a training category and date; mark sessions complete; and filter All, Active, or Completed. Quick search is included. Changes are saved immediately to localStorage. The app runs without a server, and the layout adapts to smaller screens. The workout timer, set log, history, and weekly target extend the required task manager behavior for the fitness use case.

